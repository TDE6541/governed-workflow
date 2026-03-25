import { createHash } from "crypto";
import * as path from "path";
import {
  ContractRiskHint,
  HoldHistoryEntry,
  HoldStateBlock,
  HookEventCapture,
  NormalizedHookEvent,
  PreflightState,
  SessionArtifact,
  SessionSpineBlock,
  SignoffStatus
} from "./types";
import {
  applyRuntimeContext,
  dedupeContractRiskHints,
  detectContractRiskHints,
  mergeSessionSource
} from "./artifactStore";

const MAX_HOOK_EVENTS_CAPTURED = 250;
const MAX_HOLD_HISTORY = 120;

export function parseHookEventLine(line: string, workspacePath: string, lineNumber: number): NormalizedHookEvent | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const parsedJson = safeParseJson(trimmed);
  const textCandidates = parsedJson ? collectTextCandidates(parsedJson) : [trimmed];

  let sessionSpine: SessionSpineBlock | null = null;
  let holdState: HoldStateBlock | null = null;

  for (const text of textCandidates) {
    if (!sessionSpine) {
      sessionSpine = extractSessionSpineFromText(text);
    }

    if (!holdState) {
      holdState = extractHoldStateFromText(text);
    }
  }

  const eventName = readStringFromAny(parsedJson, ["type", "event", "hook", "name", "kind"])?.toLowerCase() ?? "";
  let eventType: NormalizedHookEvent["eventType"] = "unknown";

  if (sessionSpine) {
    eventType = "session_spine";
  } else if (holdState) {
    eventType = "hold_state";
  } else if (matchesEvent(eventName, ["pretooluse", "pre_tool_use", "pre-tool-use"])) {
    eventType = "pre_tool_use";
  } else if (matchesEvent(eventName, ["posttooluse", "post_tool_use", "post-tool-use", "tool_result", "toolusecomplete"])) {
    eventType = "post_tool_use";
  } else if (matchesEvent(eventName, ["stop", "end", "session_end", "sessionstop", "close"])) {
    eventType = "stop";
  }

  const at = parseTimestamp(readStringFromAny(parsedJson, ["timestamp", "at", "created_at", "time"])) ?? new Date().toISOString();
  const files = parsedJson ? extractFilePaths(parsedJson, workspacePath) : [];
  const operation = toNullableString(readStringFromAny(parsedJson, ["tool_name", "tool", "action", "operation"]));

  const status: NormalizedHookEvent["status"] = eventType === "pre_tool_use"
    ? "proposed"
    : eventType === "post_tool_use"
      ? "completed"
      : "n/a";

  const idCandidate = readStringFromAny(parsedJson, ["id", "event_id", "uuid"]);
  const id = idCandidate ?? buildHookEventId(trimmed, lineNumber);

  return {
    id,
    eventType,
    at,
    summary: summarizeHookEvent(eventType, operation, files),
    files,
    operation,
    status,
    sessionSpine,
    holdState
  };
}

export function applyHookEventToArtifact(artifact: SessionArtifact, state: PreflightState, event: NormalizedHookEvent): SessionArtifact {
  const eventAlreadyCaptured = artifact.hook_events_captured.some((entry) => entry.id === event.id);
  if (eventAlreadyCaptured) {
    return artifact;
  }

  const updatedAt = event.at;
  const source = mergeSessionSource(artifact.source, "hook");

  let nextArtifact: SessionArtifact = {
    ...artifact,
    source,
    updated_at: updatedAt,
    hook_events_captured: appendHookEventCapture(artifact.hook_events_captured, {
      id: event.id,
      event_type: event.eventType,
      at: event.at,
      summary: event.summary,
      files: event.files,
      operation: event.operation,
      status: event.status
    })
  };

  if (event.files.length > 0) {
    nextArtifact = {
      ...nextArtifact,
      files_touched: dedupeCaseInsensitive([...nextArtifact.files_touched, ...event.files]),
      contract_risks_detected: dedupeContractRiskHints([
        ...nextArtifact.contract_risks_detected,
        ...detectContractRiskHints(event.files)
      ])
    };
  }

  if (event.sessionSpine) {
    nextArtifact = applySessionSpine(nextArtifact, event.sessionSpine);
  }

  if (event.holdState) {
    nextArtifact = applyHoldState(nextArtifact, event.holdState, event.at, "hook", event.id);
  }

  if (event.eventType === "stop") {
    nextArtifact = {
      ...nextArtifact,
      state: "Closed",
      executed_at: nextArtifact.executed_at ?? event.at,
      closed_at: event.at,
      closeout: {
        ...nextArtifact.closeout,
        summary: nextArtifact.closeout.summary ?? "Closed from stop/end hook event.",
        verification: nextArtifact.closeout.verification ?? nextArtifact.verification_summary ?? "Stop/end hook event captured."
      },
      verification_summary:
        nextArtifact.verification_summary ?? nextArtifact.closeout.verification ?? "Stop/end hook event captured."
    };
  }

  return applyRuntimeContext(nextArtifact, state);
}

export function applySessionSpine(artifact: SessionArtifact, spine: SessionSpineBlock): SessionArtifact {
  return {
    ...artifact,
    goal: spine.goal ?? artifact.goal,
    truth_sources: spine.truth_sources.length > 0 ? spine.truth_sources : artifact.truth_sources,
    contract_risk: spine.contract_risk ?? artifact.contract_risk,
    execution_notes: spine.execution_notes ?? artifact.execution_notes,
    verification_summary: spine.verification_summary ?? artifact.verification_summary,
    risk_notes: spine.risk_notes ?? artifact.risk_notes,
    signoff_by: spine.signoff_by ?? artifact.signoff_by,
    signoff_status: spine.signoff_status ?? artifact.signoff_status,
    closeout: {
      ...artifact.closeout,
      summary: spine.closeout_summary ?? artifact.closeout.summary,
      verification: spine.verification_summary ?? artifact.closeout.verification,
      risk_notes: spine.risk_notes ?? artifact.closeout.risk_notes,
      next_action: spine.next_action ?? artifact.closeout.next_action
    },
    next_action: spine.next_action ?? artifact.next_action
  };
}

export function applyHoldState(
  artifact: SessionArtifact,
  holdState: HoldStateBlock,
  at: string,
  source: "hook" | "manual",
  eventId: string | null
): SessionArtifact {
  const holdReason = holdState.reason;

  const nextHold = holdState.hold_active
    ? {
        ...artifact.hold,
        active: true,
        reason: holdReason,
        raised_at: artifact.hold.active ? artifact.hold.raised_at : at,
        cleared_at: null,
        state_when_raised: artifact.hold.active ? artifact.hold.state_when_raised : artifact.state,
        proof_needed: holdState.proof_needed,
        options_next_step: holdState.options_next_step
      }
    : {
        ...artifact.hold,
        active: false,
        reason: holdReason ?? artifact.hold.reason,
        cleared_at: holdState.resolved_at ?? at,
        proof_needed: holdState.proof_needed.length > 0 ? holdState.proof_needed : artifact.hold.proof_needed,
        options_next_step: holdState.options_next_step.length > 0 ? holdState.options_next_step : artifact.hold.options_next_step
      };

  const historyEntry: HoldHistoryEntry = {
    event: holdState.resolution_event,
    at: holdState.resolution_event === "cleared" ? holdState.resolved_at ?? at : at,
    reason: holdReason,
    proof_needed: holdState.proof_needed,
    options_next_step: holdState.options_next_step,
    source,
    resolution_event: holdState.resolution_event,
    event_id: eventId
  };

  return {
    ...artifact,
    hold: nextHold,
    hold_history: trimArray([...artifact.hold_history, historyEntry], MAX_HOLD_HISTORY)
  };
}

function extractSessionSpineFromText(text: string): SessionSpineBlock | null {
  const jsonText = extractFencedJsonBlock(text, "SESSION_SPINE");
  if (!jsonText) {
    return null;
  }

  const parsed = safeParseJson(jsonText);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const payload = parsed as Record<string, unknown>;

  return {
    goal: readNullableString(payload.goal),
    truth_sources: normalizeStringArray(payload.truth_sources),
    contract_risk: typeof payload.contract_risk === "boolean" ? payload.contract_risk : null,
    execution_notes: readNullableString(payload.execution_notes),
    closeout_summary: readNullableString(payload.closeout_summary),
    verification_summary: readNullableString(payload.verification_summary),
    risk_notes: readNullableString(payload.risk_notes),
    next_action: readNullableString(payload.next_action),
    signoff_by: readNullableString(payload.signoff_by),
    signoff_status: parseSignoffStatus(payload.signoff_status)
  };
}

function extractHoldStateFromText(text: string): HoldStateBlock | null {
  const jsonText = extractFencedJsonBlock(text, "HOLD_STATE");
  if (!jsonText) {
    return null;
  }

  const parsed = safeParseJson(jsonText);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const payload = parsed as Record<string, unknown>;
  const holdActive = typeof payload.hold_active === "boolean" ? payload.hold_active : null;

  if (holdActive === null) {
    return null;
  }

  const resolutionEvent = payload.resolution_event === "cleared" ? "cleared" : "raised";

  return {
    hold_active: holdActive,
    reason: readNullableString(payload.reason),
    proof_needed: normalizeStringArray(payload.proof_needed),
    options_next_step: normalizeStringArray(payload.options_next_step),
    resolution_event: resolutionEvent,
    resolved_at: parseTimestamp(readNullableString(payload.resolved_at))
  };
}

function extractFencedJsonBlock(text: string, blockName: string): string | null {
  const regex = new RegExp("```" + blockName + "\\s*([\\s\\S]*?)```", "i");
  const match = regex.exec(text);
  if (!match || !match[1]) {
    return null;
  }

  return match[1].trim();
}

function safeParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function collectTextCandidates(raw: unknown): string[] {
  const candidates: string[] = [];

  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      if (value.length > 0 && value.length <= 32000) {
        candidates.push(value);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (value && typeof value === "object") {
      const objectValue = value as Record<string, unknown>;
      for (const item of Object.values(objectValue)) {
        walk(item);
      }
    }
  };

  walk(raw);
  return candidates;
}

function matchesEvent(value: string, candidates: string[]): boolean {
  return candidates.includes(value.replace(/\s+/g, "").toLowerCase());
}

function summarizeHookEvent(
  eventType: NormalizedHookEvent["eventType"],
  operation: string | null,
  files: string[]
): string {
  const suffix = files.length > 0 ? ` (${files.length} file${files.length === 1 ? "" : "s"})` : "";
  const operationPrefix = operation ? `${operation}: ` : "";

  switch (eventType) {
    case "pre_tool_use":
      return `${operationPrefix}pre-tool-use captured${suffix}`;
    case "post_tool_use":
      return `${operationPrefix}post-tool-use captured${suffix}`;
    case "session_spine":
      return "SESSION_SPINE block captured";
    case "hold_state":
      return "HOLD_STATE block captured";
    case "stop":
      return "Stop/end hook event captured";
    default:
      return "Hook event captured";
  }
}

function extractFilePaths(raw: unknown, workspacePath: string): string[] {
  const extracted: string[] = [];

  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      const normalized = normalizeMaybePath(value, workspacePath);
      if (normalized) {
        extracted.push(normalized);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (value && typeof value === "object") {
      const objectValue = value as Record<string, unknown>;
      for (const [key, child] of Object.entries(objectValue)) {
        if (key.toLowerCase().includes("password") || key.toLowerCase().includes("secret")) {
          continue;
        }
        walk(child);
      }
    }
  };

  walk(raw);

  return dedupeCaseInsensitive(extracted).slice(0, 80);
}

function normalizeMaybePath(value: string, workspacePath: string): string | null {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");

  if (!trimmed || trimmed.length > 260) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("file://")) {
    return null;
  }

  const hasPathSeparators = trimmed.includes("/") || trimmed.includes("\\");
  const looksFileName = /[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,8}$/.test(trimmed);

  if (!hasPathSeparators && !looksFileName) {
    return null;
  }

  let normalizedPath = trimmed;

  if (path.isAbsolute(trimmed)) {
    const relative = path.relative(workspacePath, trimmed);
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
      normalizedPath = relative;
    }
  }

  normalizedPath = path.normalize(normalizedPath).replace(/\\/g, "/");
  if (normalizedPath.startsWith("./")) {
    normalizedPath = normalizedPath.slice(2);
  }

  if (!normalizedPath || normalizedPath === "." || normalizedPath.startsWith("../")) {
    return null;
  }

  return normalizedPath;
}

function buildHookEventId(line: string, lineNumber: number): string {
  const hash = createHash("sha1").update(line).digest("hex").slice(0, 16);
  return `hook-${lineNumber}-${hash}`;
}

function readStringFromAny(source: unknown, keys: string[]): string | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const value = source as Record<string, unknown>;

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string") {
      return candidate;
    }
  }

  return null;
}

function parseTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function parseSignoffStatus(value: unknown): SignoffStatus | null {
  return value === "signed_off" || value === "not_signed_off" ? value : null;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function appendHookEventCapture(existing: HookEventCapture[], next: HookEventCapture): HookEventCapture[] {
  if (existing.some((entry) => entry.id === next.id)) {
    return existing;
  }

  return trimArray([...existing, next], MAX_HOOK_EVENTS_CAPTURED);
}

function trimArray<T>(values: T[], max: number): T[] {
  if (values.length <= max) {
    return values;
  }

  return values.slice(values.length - max);
}

function dedupeCaseInsensitive(values: string[]): string[] {
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(trimmed);
  }

  return deduped;
}

function toNullableString(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}