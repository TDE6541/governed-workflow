import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import {
  ActiveSessionLoad,
  ContractRiskHint,
  GitState,
  HoldHistoryEntry,
  HookEventCapture,
  PreflightState,
  SessionArtifact,
  SessionCloseout,
  SessionHold,
  SessionSignoff,
  SessionSource,
  SessionState,
  SignoffStatus
} from "./types";

export const ACTIVE_SESSION_PATH_KEY = "governance.activeSessionPath";

const DEFAULT_TRUTH_SOURCE_CANDIDATES = [
  "README.md",
  "TEAM_CHARTER.md",
  "AI_EXECUTION_DOCTRINE.md",
  "CONTRIBUTING.md",
  "MIGRATIONS.md",
  "skills/fire-team-session-SKILL.md",
  "skills/hold-doctrine-SKILL.md"
];

const MAX_HOOK_EVENTS_CAPTURED = 250;
const MAX_HOLD_HISTORY = 120;

export type RuntimeDraftFields = {
  execution_notes: string | null;
  closeout_summary: string | null;
  verification_summary: string | null;
  risk_notes: string | null;
  next_action: string | null;
  signoff_by: string | null;
  signoff_status: SignoffStatus;
};

export function parseTruthSources(text: string): string[] {
  const parsed = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) =>
      line.includes(",")
        ? line
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [line]
    );

  return dedupeCaseInsensitive(parsed);
}

export function toNullableTrimmedString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildRuntimeDraftFields(input: {
  executionNotes: string;
  closeoutSummary: string;
  verificationSummary: string;
  riskNotes: string;
  nextAction: string;
  signoffBy?: string;
  signoffStatus?: SignoffStatus;
}): RuntimeDraftFields {
  const nextAction = toNullableTrimmedString(input.nextAction);

  return {
    execution_notes: toNullableTrimmedString(input.executionNotes),
    closeout_summary: toNullableTrimmedString(input.closeoutSummary),
    verification_summary: toNullableTrimmedString(input.verificationSummary),
    risk_notes: toNullableTrimmedString(input.riskNotes),
    next_action: nextAction,
    signoff_by: toNullableTrimmedString(input.signoffBy ?? ""),
    signoff_status: input.signoffStatus ?? "not_signed_off"
  };
}

export function formatSessionTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function slugifyGoal(goal: string): string {
  const slug = goal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug || "session";
}

export function getGitSummary(git: GitState): string {
  return git.repoDetected ? `${git.branch ?? "(unknown branch)"} | ${git.dirty ? "dirty" : "clean"}` : "git repo not detected";
}

export function mergeSessionSource(existing: SessionSource, incoming: SessionSource): SessionSource {
  if (existing === incoming) {
    return existing;
  }

  if (existing === "mixed" || incoming === "mixed") {
    return "mixed";
  }

  return "mixed";
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function isPathInsideWorkspace(targetPath: string, workspacePath: string): boolean {
  const workspaceResolved = path.resolve(workspacePath).toLowerCase();
  const workspaceWithSep = workspaceResolved.endsWith(path.sep) ? workspaceResolved : `${workspaceResolved}${path.sep}`;
  const targetResolved = path.resolve(targetPath).toLowerCase();
  return targetResolved === workspaceResolved || targetResolved.startsWith(workspaceWithSep);
}

export async function ensureGovernedLayout(workspacePath: string): Promise<void> {
  await Promise.all([
    fs.mkdir(path.join(workspacePath, ".governed", "sessions"), { recursive: true }),
    fs.mkdir(path.join(workspacePath, ".governed", "hooks"), { recursive: true }),
    fs.mkdir(path.join(workspacePath, ".governed", "exports"), { recursive: true })
  ]);
}

export async function getUniqueSessionFolder(workspacePath: string, timestamp: string, slug: string): Promise<string> {
  const base = path.join(workspacePath, ".governed", "sessions");
  let counter = 0;

  while (true) {
    const suffix = counter === 0 ? "" : `-${counter}`;
    const sessionId = `${timestamp}-${slug}${suffix}`;
    const sessionFolder = path.join(base, sessionId);

    if (!(await pathExists(sessionFolder))) {
      return sessionFolder;
    }

    counter += 1;
  }
}

export async function getDefaultTruthSources(workspacePath: string): Promise<string[]> {
  const detected: string[] = [];

  for (const candidate of DEFAULT_TRUTH_SOURCE_CANDIDATES) {
    const absolute = path.join(workspacePath, candidate);
    if (await pathExists(absolute)) {
      detected.push(candidate.replace(/\\/g, "/"));
    }
  }

  return detected.length > 0 ? detected : ["README.md"];
}

export function createDraftArtifact(
  state: PreflightState,
  sessionId: string,
  createdAt: string,
  goal: string,
  truthSources: string[],
  contractRisk: boolean,
  runtime: RuntimeDraftFields,
  source: SessionSource
): SessionArtifact {
  const gitSummary = getGitSummary(state.git);
  const signoff: SessionSignoff = {
    signed_off: runtime.signoff_status === "signed_off",
    signed_off_by: runtime.signoff_by,
    signed_off_at: runtime.signoff_status === "signed_off" ? createdAt : null
  };

  return normalizeArtifactForWrite({
    session_id: sessionId,
    state: "Draft",
    source,
    created_at: createdAt,
    updated_at: createdAt,
    goal,
    truth_sources: dedupeCaseInsensitive(truthSources),
    contract_risk: contractRisk,
    workspace: {
      name: state.workspaceName,
      path: state.workspacePath
    },
    name: state.workspaceName,
    path: state.workspacePath,
    git: {
      summary: gitSummary,
      detail: state.git.message,
      repo_detected: state.git.repoDetected,
      branch: state.git.branch,
      dirty: state.git.dirty
    },
    summary: gitSummary,
    detail: state.git.message,
    hold: {
      active: false,
      reason: null,
      raised_at: null,
      cleared_at: null,
      state_when_raised: null,
      proof_needed: [],
      options_next_step: []
    },
    holds: [],
    hold_history: [],
    hook_events_captured: [],
    reviewed_at: null,
    approved_at: null,
    executed_at: null,
    closed_at: null,
    execution_notes: runtime.execution_notes,
    verification_summary: runtime.verification_summary,
    risk_notes: runtime.risk_notes,
    signoff_by: runtime.signoff_by,
    signoff_status: runtime.signoff_status,
    files_touched: [],
    contract_risks_detected: [],
    closeout: {
      summary: runtime.closeout_summary,
      verification: runtime.verification_summary,
      risk_notes: runtime.risk_notes,
      next_action: runtime.next_action
    },
    next_action: runtime.next_action,
    signoff
  });
}

export function applyRuntimeContext(artifact: SessionArtifact, state: PreflightState): SessionArtifact {
  const gitSummary = getGitSummary(state.git);

  return normalizeArtifactForWrite({
    ...artifact,
    workspace: {
      name: state.workspaceName,
      path: state.workspacePath
    },
    name: state.workspaceName,
    path: state.workspacePath,
    git: {
      summary: gitSummary,
      detail: state.git.message,
      repo_detected: state.git.repoDetected,
      branch: state.git.branch,
      dirty: state.git.dirty
    },
    summary: gitSummary,
    detail: state.git.message
  });
}

export function normalizeArtifactForWrite(input: SessionArtifact): SessionArtifact {
  const nextAction = input.next_action ?? input.closeout.next_action ?? null;
  const verificationSummary = input.verification_summary ?? input.closeout.verification ?? null;
  const riskNotes = input.risk_notes ?? input.closeout.risk_notes ?? null;
  const signoffStatus: SignoffStatus = input.signoff.signed_off || input.signoff_status === "signed_off" ? "signed_off" : "not_signed_off";
  const signoffBy = input.signoff_by ?? input.signoff.signed_off_by ?? null;
  const signoffAt = signoffStatus === "signed_off" ? input.signoff.signed_off_at ?? input.updated_at : null;

  const holdReason = toNullableString(input.hold.reason);
  const holds = input.hold.active && holdReason ? [holdReason] : [];

  return {
    ...input,
    source: parseSource(input.source) ?? "manual",
    truth_sources: dedupeCaseInsensitive(input.truth_sources),
    hold: {
      ...input.hold,
      reason: holdReason,
      proof_needed: dedupeCaseInsensitive(input.hold.proof_needed),
      options_next_step: dedupeCaseInsensitive(input.hold.options_next_step)
    },
    holds,
    hold_history: trimArray(input.hold_history, MAX_HOLD_HISTORY),
    hook_events_captured: trimArray(input.hook_events_captured, MAX_HOOK_EVENTS_CAPTURED),
    signoff_by: signoffBy,
    signoff_status: signoffStatus,
    signoff: {
      signed_off: signoffStatus === "signed_off",
      signed_off_by: signoffBy,
      signed_off_at: signoffAt
    },
    execution_notes: toNullableString(input.execution_notes),
    verification_summary: toNullableString(verificationSummary),
    risk_notes: toNullableString(riskNotes),
    files_touched: dedupeCaseInsensitive(input.files_touched).map((entry) => entry.replace(/\\/g, "/")),
    contract_risks_detected: dedupeContractRiskHints(input.contract_risks_detected),
    closeout: {
      summary: toNullableString(input.closeout.summary),
      verification: toNullableString(verificationSummary),
      risk_notes: toNullableString(riskNotes),
      next_action: toNullableString(nextAction)
    },
    next_action: toNullableString(nextAction)
  };
}

export async function writeSessionArtifact(sessionFolder: string, artifact: SessionArtifact): Promise<void> {
  const artifactForWrite = normalizeArtifactForWrite(artifact);
  const markdown = renderSessionMarkdown(artifactForWrite);
  const json = `${JSON.stringify(artifactForWrite, null, 2)}\n`;

  await fs.mkdir(sessionFolder, { recursive: true });

  const sessionMdPath = path.join(sessionFolder, "session.md");
  const sessionJsonPath = path.join(sessionFolder, "session.json");

  await Promise.all([fs.writeFile(sessionMdPath, markdown, "utf8"), fs.writeFile(sessionJsonPath, json, "utf8")]);
}

export async function readSessionArtifact(sessionFolder: string): Promise<SessionArtifact> {
  const sessionJsonPath = path.join(sessionFolder, "session.json");
  const rawText = await fs.readFile(sessionJsonPath, "utf8");
  const parsed = JSON.parse(rawText) as unknown;
  const normalized = normalizeSessionArtifact(parsed, sessionFolder);

  if (!normalized) {
    throw new Error("session.json is invalid or unsupported.");
  }

  return normalized;
}

export async function getActiveSession(context: vscode.ExtensionContext, state: PreflightState): Promise<ActiveSessionLoad> {
  if (!state.workspaceWritable) {
    return {
      artifact: null,
      sessionPath: null,
      message: "No workspace folder is open. Session actions are disabled."
    };
  }

  const configuredPath = context.workspaceState.get<string>(ACTIVE_SESSION_PATH_KEY);

  if (!configuredPath) {
    return {
      artifact: null,
      sessionPath: null,
      message: "No active session loaded. Save Draft or run hook events to create one."
    };
  }

  if (!isPathInsideWorkspace(configuredPath, state.workspacePath)) {
    await context.workspaceState.update(ACTIVE_SESSION_PATH_KEY, undefined);
    return {
      artifact: null,
      sessionPath: null,
      message: "Stored active session path was outside this workspace and was cleared."
    };
  }

  if (!(await pathExists(configuredPath))) {
    await context.workspaceState.update(ACTIVE_SESSION_PATH_KEY, undefined);
    return {
      artifact: null,
      sessionPath: null,
      message: "Stored active session path no longer exists and was cleared."
    };
  }

  try {
    const artifact = await readSessionArtifact(configuredPath);
    return {
      artifact,
      sessionPath: configuredPath,
      message: `Active session loaded: ${artifact.session_id}.`
    };
  } catch (error) {
    await context.workspaceState.update(ACTIVE_SESSION_PATH_KEY, undefined);
    return {
      artifact: null,
      sessionPath: null,
      message: `Stored active session could not be loaded (${formatError(error)}). Path was cleared.`
    };
  }
}

export async function setActiveSessionPath(context: vscode.ExtensionContext, sessionPath: string | null): Promise<void> {
  if (!sessionPath) {
    await context.workspaceState.update(ACTIVE_SESSION_PATH_KEY, undefined);
    return;
  }

  await context.workspaceState.update(ACTIVE_SESSION_PATH_KEY, sessionPath);
}

export function renderSessionMarkdown(artifact: SessionArtifact): string {
  const truthSources = artifact.truth_sources.length > 0 ? artifact.truth_sources.map((source) => `- ${source}`).join("\n") : "- []";
  const filesTouched = artifact.files_touched.length > 0 ? artifact.files_touched.map((filePath) => `- ${filePath}`).join("\n") : "- []";
  const contractRisks = artifact.contract_risks_detected.length > 0
    ? artifact.contract_risks_detected.map((risk) => `- ${risk.path} | ${risk.category} | ${risk.reason}`).join("\n")
    : "- []";
  const holdHistory = artifact.hold_history.length > 0
    ? artifact.hold_history.map((entry) => `- ${entry.event} | ${entry.at} | ${entry.reason ?? "null"}`).join("\n")
    : "- []";
  const hookEvents = artifact.hook_events_captured.length > 0
    ? artifact.hook_events_captured.map((entry) => `- ${entry.id} | ${entry.event_type} | ${entry.summary}`).join("\n")
    : "- []";

  return `# Session ${artifact.session_id}

## Session ID
${artifact.session_id}

## State
${artifact.state}

## Source
${artifact.source}

## Created At
${artifact.created_at}

## Updated At
${artifact.updated_at}

## Executed At
${artifact.executed_at ?? "null"}

## Closed At
${artifact.closed_at ?? "null"}

## Goal
${artifact.goal}

## Truth Sources
${truthSources}

## Contract Risk
${artifact.contract_risk}

## Execution Notes
${artifact.execution_notes ?? "null"}

## Verification Summary
${artifact.verification_summary ?? "null"}

## Risk Notes
${artifact.risk_notes ?? "null"}

## Signoff By
${artifact.signoff_by ?? "null"}

## Signoff Status
${artifact.signoff_status}

## Files Touched
${filesTouched}

## Contract Risks Detected
${contractRisks}

## HOLD History
${holdHistory}

## Hook Events Captured
${hookEvents}

## Workspace Context
- Name: ${artifact.workspace.name}
- Path: ${artifact.workspace.path}

## Git Context
- Summary: ${artifact.git.summary}
- Detail: ${artifact.git.detail}

## HOLD Status
- Active: ${artifact.hold.active}
- Reason: ${artifact.hold.reason ?? "null"}
- Raised At: ${artifact.hold.raised_at ?? "null"}
- Cleared At: ${artifact.hold.cleared_at ?? "null"}
- State When Raised: ${artifact.hold.state_when_raised ?? "null"}

## Reviewed At
${artifact.reviewed_at ?? "null"}

## Approved At
${artifact.approved_at ?? "null"}

## Closeout Summary
${artifact.closeout.summary ?? "null"}

## Next Action
${artifact.next_action ?? "null"}
`;
}
export async function loadSessionById(workspacePath: string, sessionId: string): Promise<{ artifact: SessionArtifact; sessionPath: string } | null> {
  const sessionFolder = path.join(workspacePath, ".governed", "sessions", sessionId);
  if (!(await pathExists(sessionFolder))) {
    return null;
  }

  try {
    const artifact = await readSessionArtifact(sessionFolder);
    return { artifact, sessionPath: sessionFolder };
  } catch {
    return null;
  }
}

export type HistorySummary = {
  sessionId: string;
  state: SessionState;
  source: SessionSource;
  updatedAt: string;
  goal: string;
  holdActive: boolean;
  signoffStatus: SignoffStatus;
  filesTouchedCount: number;
  contractRiskCount: number;
  sessionPath: string;
};

export type HistoryReport = {
  sessionCount: number;
  holdActiveCount: number;
  signedOffCount: number;
  fileTouchTotal: number;
  contractRiskTotal: number;
  recentSessions: string[];
};

export async function listHistory(workspacePath: string, query: string): Promise<{ history: HistorySummary[]; report: HistoryReport }> {
  const sessionsDir = path.join(workspacePath, ".governed", "sessions");

  if (!(await pathExists(sessionsDir))) {
    return {
      history: [],
      report: emptyReport()
    };
  }

  const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
  const artifacts: Array<{ artifact: SessionArtifact; sessionPath: string }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const sessionPath = path.join(sessionsDir, entry.name);
    try {
      const artifact = await readSessionArtifact(sessionPath);
      artifacts.push({ artifact, sessionPath });
    } catch {
      // Skip corrupted entries.
    }
  }

  artifacts.sort((left, right) => right.artifact.updated_at.localeCompare(left.artifact.updated_at));

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery.length === 0
    ? artifacts
    : artifacts.filter(({ artifact }) => {
        const haystack = [artifact.session_id, artifact.goal, artifact.state, artifact.source].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      });

  return {
    history: filtered.map(({ artifact, sessionPath }) => ({
      sessionId: artifact.session_id,
      state: artifact.state,
      source: artifact.source,
      updatedAt: artifact.updated_at,
      goal: artifact.goal,
      holdActive: artifact.hold.active,
      signoffStatus: artifact.signoff_status,
      filesTouchedCount: artifact.files_touched.length,
      contractRiskCount: artifact.contract_risks_detected.length,
      sessionPath
    })),
    report: buildReport(filtered.map((entry) => entry.artifact))
  };
}

export async function exportSession(
  workspacePath: string,
  artifact: SessionArtifact,
  format: "markdown" | "json"
): Promise<string> {
  await ensureGovernedLayout(workspacePath);

  const exportsDir = path.join(workspacePath, ".governed", "exports");
  const safeId = artifact.session_id.replace(/[^a-zA-Z0-9_-]/g, "-");

  if (format === "json") {
    const target = path.join(exportsDir, `${safeId}.json`);
    await fs.writeFile(target, `${JSON.stringify(normalizeArtifactForWrite(artifact), null, 2)}\n`, "utf8");
    return target;
  }

  const target = path.join(exportsDir, `${safeId}.md`);
  await fs.writeFile(target, renderSessionMarkdown(normalizeArtifactForWrite(artifact)), "utf8");
  return target;
}

function normalizeSessionArtifact(raw: unknown, sessionFolder: string): SessionArtifact | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;

  const sessionId = readString(data.session_id) ?? path.basename(sessionFolder);
  const state = parseSessionState(data.state) ?? "Draft";
  const createdAt = readString(data.created_at);
  const updatedAt = readString(data.updated_at);
  const goal = readString(data.goal);

  if (!createdAt || !updatedAt || !goal) {
    return null;
  }

  const truthSources = normalizeStringArray(data.truth_sources);
  const contractRisk = typeof data.contract_risk === "boolean" ? data.contract_risk : false;

  const workspace = normalizeWorkspace(data, sessionFolder);
  const git = normalizeGit(data);

  const summary = readString(data.summary) ?? git.summary;
  const detail = readString(data.detail) ?? git.detail;

  const legacyHolds = normalizeStringArray(data.holds);
  const hold = normalizeHold(data.hold, legacyHolds, state);

  const closeout = normalizeCloseout(data.closeout, readNullableString(data.next_action));
  const signoff = normalizeSignoff(data.signoff, data);
  const signoffStatus = parseSignoffStatus(data.signoff_status) ?? (signoff.signed_off ? "signed_off" : "not_signed_off");
  const signoffBy = readNullableString(data.signoff_by) ?? signoff.signed_off_by;

  const verificationSummary =
    readNullableString(data.verification_summary) ?? readNullableString(closeout.verification) ?? null;
  const riskNotes = readNullableString(data.risk_notes) ?? readNullableString(closeout.risk_notes) ?? null;

  const source =
    parseSource(data.source) ??
    (Array.isArray(data.hook_events_captured) && data.hook_events_captured.length > 0 ? "mixed" : "manual");

  const artifact: SessionArtifact = {
    session_id: sessionId,
    state,
    source,
    created_at: createdAt,
    updated_at: updatedAt,
    goal,
    truth_sources: truthSources,
    contract_risk: contractRisk,
    workspace,
    name: workspace.name,
    path: workspace.path,
    git,
    summary,
    detail,
    hold,
    holds: hold.active && hold.reason ? [hold.reason] : [],
    hold_history: normalizeHoldHistory(data.hold_history, hold),
    hook_events_captured: normalizeHookEvents(data.hook_events_captured),
    reviewed_at: readNullableString(data.reviewed_at),
    approved_at: readNullableString(data.approved_at),
    executed_at: readNullableString(data.executed_at),
    closed_at: readNullableString(data.closed_at),
    execution_notes: readNullableString(data.execution_notes),
    verification_summary: verificationSummary,
    risk_notes: riskNotes,
    signoff_by: signoffBy,
    signoff_status: signoffStatus,
    files_touched: normalizeStringArray(data.files_touched),
    contract_risks_detected: normalizeContractRisks(data.contract_risks_detected),
    closeout,
    next_action: closeout.next_action,
    signoff
  };

  return normalizeArtifactForWrite(artifact);
}

function normalizeWorkspace(data: Record<string, unknown>, sessionFolder: string): { name: string; path: string } {
  const workspaceCandidate = data.workspace;

  if (workspaceCandidate && typeof workspaceCandidate === "object") {
    const workspace = workspaceCandidate as Record<string, unknown>;
    const name = readString(workspace.name);
    const workspacePath = readString(workspace.path);

    if (name && workspacePath) {
      return { name, path: workspacePath };
    }
  }

  const fallbackPath = readString(data.path) ?? path.resolve(sessionFolder, "..", "..", "..");
  const fallbackName = readString(data.name) ?? path.basename(fallbackPath);

  return {
    name: fallbackName,
    path: fallbackPath
  };
}

function normalizeGit(data: Record<string, unknown>): SessionArtifact["git"] {
  const defaultSummary = readString(data.summary) ?? "not a git repository";
  const defaultDetail = readString(data.detail) ?? "Git context unavailable.";

  const candidate = data.git;
  if (!candidate || typeof candidate !== "object") {
    return {
      summary: defaultSummary,
      detail: defaultDetail,
      repo_detected: false,
      branch: null,
      dirty: null
    };
  }

  const git = candidate as Record<string, unknown>;

  return {
    summary: readString(git.summary) ?? defaultSummary,
    detail: readString(git.detail) ?? defaultDetail,
    repo_detected: typeof git.repo_detected === "boolean" ? git.repo_detected : false,
    branch: readNullableString(git.branch),
    dirty: readNullableBoolean(git.dirty)
  };
}

function normalizeHold(rawHold: unknown, legacyHolds: string[], state: SessionState): SessionHold {
  if (!rawHold || typeof rawHold !== "object") {
    if (legacyHolds.length > 0) {
      return {
        active: true,
        reason: legacyHolds[0],
        raised_at: null,
        cleared_at: null,
        state_when_raised: state,
        proof_needed: [],
        options_next_step: []
      };
    }

    return {
      active: false,
      reason: null,
      raised_at: null,
      cleared_at: null,
      state_when_raised: null,
      proof_needed: [],
      options_next_step: []
    };
  }

  const hold = rawHold as Record<string, unknown>;
  const parsedStateWhenRaised = parseSessionState(hold.state_when_raised);

  return {
    active: typeof hold.active === "boolean" ? hold.active : false,
    reason: readNullableString(hold.reason),
    raised_at: readNullableString(hold.raised_at),
    cleared_at: readNullableString(hold.cleared_at),
    state_when_raised: parsedStateWhenRaised,
    proof_needed: normalizeStringArray(hold.proof_needed),
    options_next_step: normalizeStringArray(hold.options_next_step)
  };
}

function normalizeCloseout(rawCloseout: unknown, fallbackNextAction: string | null): SessionCloseout {
  if (!rawCloseout || typeof rawCloseout !== "object") {
    const legacySummary = readNullableString(rawCloseout);
    return {
      summary: legacySummary,
      verification: null,
      risk_notes: null,
      next_action: fallbackNextAction
    };
  }

  const closeout = rawCloseout as Record<string, unknown>;
  return {
    summary: readNullableString(closeout.summary),
    verification: readNullableString(closeout.verification),
    risk_notes: readNullableString(closeout.risk_notes),
    next_action: readNullableString(closeout.next_action) ?? fallbackNextAction
  };
}

function normalizeSignoff(rawSignoff: unknown, rootData: Record<string, unknown>): SessionSignoff {
  if (!rawSignoff || typeof rawSignoff !== "object") {
    return {
      signed_off: typeof rootData.signed_off === "boolean" ? rootData.signed_off : false,
      signed_off_by: readNullableString(rootData.signed_off_by),
      signed_off_at: readNullableString(rootData.signed_off_at)
    };
  }

  const signoff = rawSignoff as Record<string, unknown>;
  return {
    signed_off: typeof signoff.signed_off === "boolean" ? signoff.signed_off : false,
    signed_off_by: readNullableString(signoff.signed_off_by),
    signed_off_at: readNullableString(signoff.signed_off_at)
  };
}

function normalizeHoldHistory(rawHistory: unknown, hold: SessionHold): HoldHistoryEntry[] {
  if (!Array.isArray(rawHistory)) {
    const derived: HoldHistoryEntry[] = [];

    if (hold.raised_at) {
      derived.push({
        event: "raised",
        at: hold.raised_at,
        reason: hold.reason,
        proof_needed: hold.proof_needed,
        options_next_step: hold.options_next_step,
        source: "manual",
        resolution_event: "raised",
        event_id: null
      });
    }

    if (hold.cleared_at) {
      derived.push({
        event: "cleared",
        at: hold.cleared_at,
        reason: hold.reason,
        proof_needed: hold.proof_needed,
        options_next_step: hold.options_next_step,
        source: "manual",
        resolution_event: "cleared",
        event_id: null
      });
    }

    return derived;
  }

  const normalized: HoldHistoryEntry[] = [];

  for (const candidate of rawHistory) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const entry = candidate as Record<string, unknown>;
    const event = entry.event === "cleared" ? "cleared" : "raised";
    const at = parseTimestamp(readNullableString(entry.at)) ?? null;

    if (!at) {
      continue;
    }

    normalized.push({
      event,
      at,
      reason: readNullableString(entry.reason),
      proof_needed: normalizeStringArray(entry.proof_needed),
      options_next_step: normalizeStringArray(entry.options_next_step),
      source: entry.source === "hook" ? "hook" : "manual",
      resolution_event: entry.resolution_event === "cleared" ? "cleared" : "raised",
      event_id: readNullableString(entry.event_id)
    });
  }

  return trimArray(normalized, MAX_HOLD_HISTORY);
}

function normalizeHookEvents(rawHookEvents: unknown): HookEventCapture[] {
  if (!Array.isArray(rawHookEvents)) {
    return [];
  }

  const normalized: HookEventCapture[] = [];
  const seen = new Set<string>();

  for (const candidate of rawHookEvents) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const event = candidate as Record<string, unknown>;
    const id = readNullableString(event.id);
    const at = parseTimestamp(readNullableString(event.at));
    if (!id || !at || seen.has(id)) {
      continue;
    }

    seen.add(id);
    normalized.push({
      id,
      event_type: readNullableString(event.event_type) ?? "unknown",
      at,
      summary: readNullableString(event.summary) ?? "hook event captured",
      files: normalizeStringArray(event.files),
      operation: readNullableString(event.operation),
      status: parseHookCaptureStatus(event.status)
    });
  }

  return trimArray(normalized, MAX_HOOK_EVENTS_CAPTURED);
}

function normalizeContractRisks(rawRisks: unknown): ContractRiskHint[] {
  if (!Array.isArray(rawRisks)) {
    return [];
  }

  const normalized: ContractRiskHint[] = [];

  for (const candidate of rawRisks) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const risk = candidate as Record<string, unknown>;
    const riskPath = readNullableString(risk.path);
    const category = readNullableString(risk.category);
    const reason = readNullableString(risk.reason);

    if (!riskPath || !category || !reason) {
      continue;
    }

    normalized.push({
      path: riskPath.replace(/\\/g, "/"),
      category,
      reason,
      advisory: typeof risk.advisory === "boolean" ? risk.advisory : true
    });
  }

  return dedupeContractRiskHints(normalized);
}

function buildReport(artifacts: SessionArtifact[]): HistoryReport {
  if (artifacts.length === 0) {
    return emptyReport();
  }

  return {
    sessionCount: artifacts.length,
    holdActiveCount: artifacts.filter((artifact) => artifact.hold.active).length,
    signedOffCount: artifacts.filter((artifact) => artifact.signoff_status === "signed_off").length,
    fileTouchTotal: artifacts.reduce((sum, artifact) => sum + artifact.files_touched.length, 0),
    contractRiskTotal: artifacts.reduce((sum, artifact) => sum + artifact.contract_risks_detected.length, 0),
    recentSessions: artifacts.slice(0, 5).map((artifact) => artifact.session_id)
  };
}

function emptyReport(): HistoryReport {
  return {
    sessionCount: 0,
    holdActiveCount: 0,
    signedOffCount: 0,
    fileTouchTotal: 0,
    contractRiskTotal: 0,
    recentSessions: []
  };
}

function parseHookCaptureStatus(value: unknown): HookEventCapture["status"] {
  if (value === "proposed" || value === "completed") {
    return value;
  }
  return "n/a";
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

export function dedupeContractRiskHints(hints: ContractRiskHint[]): ContractRiskHint[] {
  const deduped: ContractRiskHint[] = [];
  const seen = new Set<string>();

  for (const hint of hints) {
    const key = `${hint.path.toLowerCase()}|${hint.category.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(hint);
  }

  return deduped;
}

function trimArray<T>(values: T[], max: number): T[] {
  if (values.length <= max) {
    return values;
  }

  return values.slice(values.length - max);
}

export function detectContractRiskHints(files: string[]): ContractRiskHint[] {
  const hints: ContractRiskHint[] = [];

  for (const file of files) {
    const normalized = file.replace(/\\/g, "/").toLowerCase();

    if (
      normalized.includes("migration") ||
      normalized.includes("docs/specs/") ||
      normalized.includes("docs/schemas/") ||
      normalized.includes("schema") ||
      normalized.includes("interface") ||
      normalized.includes("contract")
    ) {
      hints.push({
        path: file,
        category: "contract_surface",
        reason: "File path suggests schema/spec/interface/contract impact.",
        advisory: true
      });
    }

    if (
      normalized.includes("auth") ||
      normalized.includes("security") ||
      normalized.includes("credential") ||
      normalized.includes("token") ||
      normalized.includes("permission")
    ) {
      hints.push({
        path: file,
        category: "auth_security",
        reason: "File path suggests authentication/security impact.",
        advisory: true
      });
    }

    if (
      normalized.includes("deploy") ||
      normalized.includes("docker") ||
      normalized.includes("k8s") ||
      normalized.includes("helm") ||
      normalized.endsWith("package.json") ||
      normalized.includes("config")
    ) {
      hints.push({
        path: file,
        category: "deployment_config",
        reason: "File path suggests deployment/runtime configuration impact.",
        advisory: true
      });
    }

    if (normalized.includes("billing") || normalized.includes("payment") || normalized.includes("invoice") || normalized.includes("stripe")) {
      hints.push({
        path: file,
        category: "billing_payments",
        reason: "File path suggests billing/payment impact.",
        advisory: true
      });
    }

    if (
      normalized === "team_charter.md" ||
      normalized === "ai_execution_doctrine.md" ||
      normalized === "contributing.md" ||
      normalized === "migrations.md" ||
      normalized.startsWith("skills/")
    ) {
      hints.push({
        path: file,
        category: "canonical_governance",
        reason: "Canonical governance artifact changed.",
        advisory: true
      });
    }
  }

  return dedupeContractRiskHints(hints);
}

function parseSessionState(value: unknown): SessionState | null {
  return value === "Draft" || value === "Reviewed" || value === "Approved" || value === "Executed" || value === "Closed"
    ? value
    : null;
}

function parseSignoffStatus(value: unknown): SignoffStatus | null {
  return value === "signed_off" || value === "not_signed_off" ? value : null;
}

function parseSource(value: unknown): SessionSource | null {
  return value === "manual" || value === "hook" || value === "mixed" ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
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

function toNullableString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}
