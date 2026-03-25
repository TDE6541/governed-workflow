#!/usr/bin/env node

import { createHash } from "crypto";
import * as fs from "fs/promises";
import os from "os";
import * as path from "path";

const HOOK_EVENTS_RELATIVE_PATH = path.join(".governed", "hooks", "events.jsonl");
const MAX_PATHS = 20;
const MAX_JSONL_LINE_LENGTH = 250_000;

void main();

async function main() {
  try {
    const payload = await readStdinJson();
    if (!payload) {
      return;
    }

    const hookName = normalizeHookName(payload.hook_event_name);
    if (!hookName) {
      return;
    }

    const workspacePath = resolveWorkspacePath(payload);
    const at = toIsoTimestamp(payload.timestamp) ?? new Date().toISOString();

    if (hookName === "sessionstart") {
      await appendEventLine(workspacePath, {
        id: buildEventId("session_start", payload, at, "base"),
        type: "session_start",
        hook_event_name: "SessionStart",
        timestamp: at,
        session_id: toNullableString(payload.session_id),
        source: toNullableString(payload.source),
        model: toNullableString(payload.model),
        agent_type: toNullableString(payload.agent_type),
        cwd: workspacePath,
        origin: "claude_code"
      });
      return;
    }

    if (hookName === "pretooluse") {
      const files = extractRelevantTargets(payload.tool_input, workspacePath);
      await appendEventLine(workspacePath, {
        id: buildEventId("pre_tool_use", payload, at, "base"),
        type: "pre_tool_use",
        hook_event_name: "PreToolUse",
        timestamp: at,
        session_id: toNullableString(payload.session_id),
        tool_name: toNullableString(payload.tool_name),
        tool_use_id: toNullableString(payload.tool_use_id),
        operation: toNullableString(payload.tool_name),
        file_path: files[0] ?? null,
        files,
        status: "proposed",
        origin: "claude_code"
      });
      return;
    }

    if (hookName === "posttooluse") {
      const files = extractRelevantTargets(payload.tool_input, workspacePath);
      await appendEventLine(workspacePath, {
        id: buildEventId("post_tool_use", payload, at, "base"),
        type: "post_tool_use",
        hook_event_name: "PostToolUse",
        timestamp: at,
        session_id: toNullableString(payload.session_id),
        tool_name: toNullableString(payload.tool_name),
        tool_use_id: toNullableString(payload.tool_use_id),
        operation: toNullableString(payload.tool_name),
        file_path: files[0] ?? null,
        files,
        status: "completed",
        result_status: derivePostStatus(payload),
        result: derivePostResult(payload),
        origin: "claude_code"
      });
      return;
    }

    if (hookName === "stop") {
      await appendEventLine(workspacePath, {
        id: buildEventId("stop", payload, at, "base"),
        type: "stop",
        hook_event_name: "Stop",
        timestamp: at,
        session_id: toNullableString(payload.session_id),
        stop_hook_active: Boolean(payload.stop_hook_active),
        origin: "claude_code"
      });

      const transcriptPath = toNullableString(payload.transcript_path);
      if (!transcriptPath) {
        return;
      }

      const normalizedTranscriptPath = normalizeTranscriptPath(transcriptPath);
      const blocks = await extractStructuredBlocksFromTranscript(normalizedTranscriptPath);
      for (let index = 0; index < blocks.length; index += 1) {
        const block = blocks[index];
        const fenceName = block.eventType === "session_spine" ? "SESSION_SPINE" : "HOLD_STATE";
        await appendEventLine(workspacePath, {
          id: buildEventId(block.eventType, payload, at, `${index}`),
          type: block.eventType,
          hook_event_name: "Stop",
          timestamp: at,
          session_id: toNullableString(payload.session_id),
          source: "claude_code_stop_parser",
          transcript_path: normalizedTranscriptPath,
          content: `\`\`\`${fenceName}\n${JSON.stringify(block.payload, null, 2)}\n\`\`\``
        });
      }
      return;
    }

    if (hookName === "sessionend") {
      await appendEventLine(workspacePath, {
        id: buildEventId("session_end", payload, at, "base"),
        type: "session_end",
        hook_event_name: "SessionEnd",
        timestamp: at,
        session_id: toNullableString(payload.session_id),
        reason: toNullableString(payload.reason),
        origin: "claude_code"
      });
    }
  } catch {
    // Hook errors are non-fatal by design to preserve local workflow continuity.
  }
}

async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function normalizeHookName(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, "").toLowerCase();
}

function resolveWorkspacePath(payload) {
  const cwd = toNullableString(payload.cwd);
  return path.resolve(cwd ?? process.cwd());
}

function normalizeTranscriptPath(rawPath) {
  if (rawPath.startsWith("~/")) {
    return path.join(os.homedir(), rawPath.slice(2));
  }
  return path.resolve(rawPath);
}

function toIsoTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString();
}

function toNullableString(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function derivePostStatus(payload) {
  if (typeof payload.error === "string" && payload.error.trim()) {
    return "failed";
  }
  if (typeof payload.status === "string" && payload.status.trim()) {
    return payload.status.trim();
  }
  if (typeof payload.decision === "string" && payload.decision.trim()) {
    return payload.decision.trim();
  }
  return "completed";
}

function derivePostResult(payload) {
  const candidates = [
    payload.result,
    payload.tool_result,
    payload.message,
    payload.last_assistant_message
  ];

  for (const value of candidates) {
    const normalized = toNullableString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function buildEventId(prefix, payload, at, suffix) {
  const base = [
    prefix,
    toNullableString(payload.session_id) ?? "session",
    toNullableString(payload.tool_use_id) ?? "tool",
    at,
    suffix
  ].join("|");

  const digest = createHash("sha1").update(base).digest("hex").slice(0, 14);
  return `cc-${prefix}-${digest}`;
}

async function appendEventLine(workspacePath, event) {
  const eventsFile = path.join(workspacePath, HOOK_EVENTS_RELATIVE_PATH);
  await fs.mkdir(path.dirname(eventsFile), { recursive: true });
  await fs.appendFile(eventsFile, `${JSON.stringify(event)}\n`, "utf8");
}

function extractRelevantTargets(toolInput, workspacePath) {
  if (!toolInput || typeof toolInput !== "object") {
    return [];
  }

  const candidates = [];
  const directKeys = [
    "file_path",
    "path",
    "target_file",
    "target_path",
    "source_path",
    "destination_path",
    "old_path",
    "new_path"
  ];

  const objectInput = toolInput;
  for (const key of directKeys) {
    const value = objectInput[key];
    if (typeof value === "string") {
      candidates.push(value);
    }
  }

  const walk = (value, keyHint, depth) => {
    if (depth > 4 || value === null || value === undefined) {
      return;
    }

    if (typeof value === "string") {
      if (/(file|path|target|source|destination)/i.test(keyHint)) {
        candidates.push(value);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item, keyHint, depth + 1);
      }
      return;
    }

    if (typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        walk(child, key, depth + 1);
      }
    }
  };

  walk(toolInput, "", 0);

  const normalized = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const target = normalizeTargetPath(candidate, workspacePath);
    if (!target) {
      continue;
    }
    const dedupeKey = target.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    normalized.push(target);
    if (normalized.length >= MAX_PATHS) {
      break;
    }
  }

  return normalized;
}

function normalizeTargetPath(rawPath, workspacePath) {
  if (typeof rawPath !== "string") {
    return null;
  }

  const trimmed = rawPath.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed || trimmed.length > 260) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("file://")) {
    return null;
  }

  if (path.isAbsolute(trimmed)) {
    const relative = path.relative(workspacePath, trimmed);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      return null;
    }
    return toSlash(path.normalize(relative));
  }

  const hasPathSeparators = trimmed.includes("/") || trimmed.includes("\\");
  const looksFileName = /[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,8}$/.test(trimmed);
  if (!hasPathSeparators && !looksFileName) {
    return null;
  }

  const normalized = toSlash(path.normalize(trimmed)).replace(/^\.\//, "");
  if (!normalized || normalized === "." || normalized.startsWith("../")) {
    return null;
  }

  return normalized;
}

function toSlash(value) {
  return value.replace(/\\/g, "/");
}

async function extractStructuredBlocksFromTranscript(transcriptPath) {
  let content;
  try {
    content = await fs.readFile(transcriptPath, "utf8");
  } catch {
    return [];
  }

  const textCandidates = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > MAX_JSONL_LINE_LENGTH) {
      continue;
    }

    const parsed = safeParseJson(trimmed);
    if (!parsed) {
      textCandidates.push(trimmed);
      continue;
    }

    collectTextCandidates(parsed, textCandidates);
  }

  const discovered = [];
  const seen = new Set();

  for (const text of textCandidates) {
    extractBlocksFromText(text, "SESSION_SPINE", "session_spine", discovered, seen);
    extractBlocksFromText(text, "HOLD_STATE", "hold_state", discovered, seen);
  }

  return discovered;
}

function collectTextCandidates(value, sink) {
  if (typeof value === "string") {
    if (value.length > 0 && value.length <= 50_000) {
      sink.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextCandidates(item, sink);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      collectTextCandidates(child, sink);
    }
  }
}

function extractBlocksFromText(text, blockName, eventType, sink, seen) {
  const regex = new RegExp("```" + blockName + "\\s*([\\s\\S]*?)```", "gi");
  let match;

  while ((match = regex.exec(text)) !== null) {
    const jsonText = match[1]?.trim();
    if (!jsonText) {
      continue;
    }

    const parsed = safeParseJson(jsonText);
    if (!parsed || typeof parsed !== "object") {
      continue;
    }

    const dedupeKey = `${eventType}:${JSON.stringify(parsed)}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    sink.push({ eventType, payload: parsed });
  }
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
