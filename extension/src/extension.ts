import { execFileSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import {
  ACTIVE_SESSION_PATH_KEY,
  RuntimeDraftFields,
  applyRuntimeContext,
  buildRuntimeDraftFields,
  createDraftArtifact,
  ensureGovernedLayout,
  formatSessionTimestamp,
  getActiveSession,
  getDefaultTruthSources,
  getUniqueSessionFolder,
  loadSessionById,
  listHistory,
  mergeSessionSource,
  parseTruthSources,
  readSessionArtifact,
  setActiveSessionPath,
  slugifyGoal,
  toNullableTrimmedString,
  writeSessionArtifact,
  exportSession
} from "./artifactStore";
import { applyHoldState, applyHookEventToArtifact, applySessionSpine, parseHookEventLine } from "./hookEvents";
import { renderPreflightHtml } from "./panelHtml";
import { buildActionResult, toPanelSessionView } from "./panelViews";
import {
  ActionResult,
  ActiveSessionLoad,
  PanelSessionView,
  PreflightState
} from "./types";

const HOOK_EVENTS_RELATIVE_PATH = path.join(".governed", "hooks", "events.jsonl");

type SessionInputMessage = {
  goal: string;
  truthSourcesText: string;
  contractRisk: boolean;
  executionNotes: string;
  closeoutSummary: string;
  verificationSummary: string;
  riskNotes: string;
  nextAction: string;
  historyQuery?: string;
};

type SaveDraftMessage = SessionInputMessage & { type: "saveDraft" };
type UpdateSessionMessage = SessionInputMessage & { type: "updateSession" };
type MarkReviewedMessage = { type: "markReviewed"; historyQuery?: string };
type ApproveSessionMessage = { type: "approveSession"; historyQuery?: string };
type MarkExecutedMessage = { type: "markExecuted"; executionNotes: string; historyQuery?: string };
type CloseSessionMessage = {
  type: "closeSession";
  closeoutSummary: string;
  verificationSummary: string;
  riskNotes: string;
  nextAction: string;
  historyQuery?: string;
};
type SignOffMessage = { type: "signOff"; signedOffBy: string; historyQuery?: string };
type RaiseHoldMessage = { type: "raiseHold"; reason: string; historyQuery?: string };
type ClearHoldMessage = { type: "clearHold"; historyQuery?: string };
type LoadHistoryMessage = { type: "loadHistory"; historyQuery?: string };
type SelectHistorySessionMessage = { type: "selectHistorySession"; sessionId: string; historyQuery?: string };
type ExportSessionMessage = {
  type: "exportSession";
  sessionId: string;
  format: "markdown" | "json";
  historyQuery?: string;
};

type PanelMessage =
  | SaveDraftMessage
  | UpdateSessionMessage
  | MarkReviewedMessage
  | ApproveSessionMessage
  | MarkExecutedMessage
  | CloseSessionMessage
  | SignOffMessage
  | RaiseHoldMessage
  | ClearHoldMessage
  | LoadHistoryMessage
  | SelectHistorySessionMessage
  | ExportSessionMessage;

type HookPump = {
  workspacePath: string;
  watcher: vscode.FileSystemWatcher;
  timer: NodeJS.Timeout;
  offset: number;
  remainder: string;
  lineNumber: number;
  processing: boolean;
};

let hookPump: HookPump | null = null;
const openPanels = new Set<vscode.WebviewPanel>();

export function activate(context: vscode.ExtensionContext): void {
  const openPanelDisposable = vscode.commands.registerCommand("governance.openPreflight", async () => {
    const state = getPreflightState();
    const activeSession = await getActiveSession(context, state);
    const historyQuery = "";
    const historyData = await loadHistoryData(state, historyQuery);

    const panel = vscode.window.createWebviewPanel(
      "governancePreflight",
      "Governed Workflow",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    openPanels.add(panel);

    panel.webview.html = renderPreflightHtml(
      {
        preflight: {
          workspaceName: state.workspaceName,
          workspacePath: state.workspacePath,
          workspaceWritable: state.workspaceWritable,
          gitSummary: state.git.repoDetected ? `${state.git.branch ?? "(unknown branch)"} | ${state.git.dirty ? "dirty" : "clean"}` : "git repo not detected",
          gitDetail: state.git.message
        },
        session:
          activeSession.artifact && activeSession.sessionPath
            ? toPanelSessionView(activeSession.artifact, activeSession.sessionPath)
            : null,
        history: historyData.history,
        report: historyData.report,
        selectedHistorySession: null,
        statusMessage: activeSession.message
      },
      panel.webview
    );

    const messageDisposable = panel.webview.onDidReceiveMessage(async (message: unknown) => {
      const latestState = getPreflightState();
      const result = await handlePanelMessage(context, latestState, message);
      await panel.webview.postMessage(result);
    });

    panel.onDidDispose(() => {
      openPanels.delete(panel);
      messageDisposable.dispose();
    });
  });

  context.subscriptions.push(openPanelDisposable);

  startHookPump(context);

  const workspaceChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    startHookPump(context);
  });

  context.subscriptions.push(workspaceChangeDisposable);
}

export function deactivate(): void {
  stopHookPump();
}

function getPreflightState(): PreflightState {
  const folder = vscode.workspace.workspaceFolders?.[0];

  if (!folder) {
    return {
      workspacePath: "(no workspace folder detected)",
      workspaceName: "no workspace folder",
      workspaceWritable: false,
      git: {
        repoDetected: false,
        branch: null,
        dirty: null,
        message: "No workspace folder is open."
      }
    };
  }

  const workspacePath = folder.uri.fsPath;
  const workspaceName = path.basename(workspacePath);
  const git = getGitState(workspacePath);

  return { workspacePath, workspaceName, workspaceWritable: true, git };
}

function getPreflightStateForWorkspace(workspacePath: string): PreflightState {
  return {
    workspacePath,
    workspaceName: path.basename(workspacePath),
    workspaceWritable: true,
    git: getGitState(workspacePath)
  };
}

function getGitState(cwd: string): PreflightState["git"] {
  try {
    const inside = runGit(cwd, ["rev-parse", "--is-inside-work-tree"]);

    if (inside !== "true") {
      return {
        repoDetected: false,
        branch: null,
        dirty: null,
        message: "Workspace is not inside a git work tree."
      };
    }

    let branch = runGit(cwd, ["branch", "--show-current"]);
    if (!branch) {
      branch = runGit(cwd, ["rev-parse", "--short", "HEAD"]);
      branch = branch ? `detached@${branch}` : "detached HEAD";
    }

    const porcelain = runGit(cwd, ["status", "--porcelain"]);
    const dirty = porcelain.length > 0;

    return {
      repoDetected: true,
      branch,
      dirty,
      message: dirty ? "Working tree has uncommitted changes." : "Working tree is clean."
    };
  } catch (error) {
    return {
      repoDetected: false,
      branch: null,
      dirty: null,
      message: formatError(error)
    };
  }
}

function runGit(cwd: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

async function handlePanelMessage(
  context: vscode.ExtensionContext,
  state: PreflightState,
  message: unknown
): Promise<ActionResult> {
  if (!message || typeof message !== "object") {
    return buildResult(context, state, false, "Unsupported action payload.", "", null);
  }

  const typed = message as Partial<PanelMessage>;
  const historyQuery = typeof typed.historyQuery === "string" ? typed.historyQuery : "";

  if (typed.type === "saveDraft") {
    return saveDraftSession(context, state, typed as SaveDraftMessage, historyQuery);
  }

  if (typed.type === "updateSession") {
    return updateActiveSession(context, state, typed as UpdateSessionMessage, historyQuery);
  }

  if (typed.type === "markReviewed") {
    return transitionSession(context, state, "Reviewed", historyQuery);
  }

  if (typed.type === "approveSession") {
    return transitionSession(context, state, "Approved", historyQuery);
  }

  if (typed.type === "markExecuted") {
    return markExecuted(context, state, typed as MarkExecutedMessage, historyQuery);
  }

  if (typed.type === "closeSession") {
    return closeSession(context, state, typed as CloseSessionMessage, historyQuery);
  }

  if (typed.type === "signOff") {
    return signOffSession(context, state, typed as SignOffMessage, historyQuery);
  }

  if (typed.type === "raiseHold") {
    return raiseHold(context, state, typed as RaiseHoldMessage, historyQuery);
  }

  if (typed.type === "clearHold") {
    return clearHold(context, state, historyQuery);
  }

  if (typed.type === "loadHistory") {
    return buildResult(context, state, true, "History refreshed.", historyQuery, null);
  }

  if (typed.type === "selectHistorySession") {
    if (typeof typed.sessionId !== "string" || !typed.sessionId.trim()) {
      return buildResult(context, state, false, "Session ID is required.", historyQuery, null);
    }

    return buildResult(context, state, true, `History session selected: ${typed.sessionId}.`, historyQuery, typed.sessionId);
  }

  if (typed.type === "exportSession") {
    return exportSelectedSession(context, state, typed as ExportSessionMessage, historyQuery);
  }

  return buildResult(context, state, false, "Unsupported action received from panel.", historyQuery, null);
}

async function saveDraftSession(
  context: vscode.ExtensionContext,
  state: PreflightState,
  payload: SaveDraftMessage,
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);

  if (!state.workspaceWritable) {
    return buildResult(context, state, false, "Cannot save draft because no workspace folder is open.", historyQuery, null);
  }

  if (active.artifact && active.sessionPath) {
    return buildResult(context, state, false, "Active session already exists. Use Update Session.", historyQuery, active.artifact.session_id);
  }

  const goal = payload.goal.trim();
  if (!goal) {
    return buildResult(context, state, false, "Goal is required.", historyQuery, null);
  }

  const truthSources = parseTruthSources(payload.truthSourcesText);
  if (truthSources.length === 0) {
    return buildResult(context, state, false, "At least one truth source is required.", historyQuery, null);
  }

  try {
    await ensureGovernedLayout(state.workspacePath);

    const now = new Date();
    const nowIso = now.toISOString();
    const timestamp = formatSessionTimestamp(now);
    const slug = slugifyGoal(goal);
    const sessionFolder = await getUniqueSessionFolder(state.workspacePath, timestamp, slug);
    const sessionId = path.basename(sessionFolder);

    const runtimeFields = buildRuntimeDraftFields(payload);
    const artifact = createDraftArtifact(state, sessionId, nowIso, goal, truthSources, payload.contractRisk, runtimeFields, "manual");

    await writeSessionArtifact(sessionFolder, artifact);
    await setActiveSessionPath(context, sessionFolder);

    return buildResult(context, state, true, `Draft saved at ${sessionFolder}.`, historyQuery, sessionId);
  } catch (error) {
    return buildResult(context, state, false, `Failed to save draft (${formatError(error)}).`, historyQuery, null);
  }
}

async function updateActiveSession(
  context: vscode.ExtensionContext,
  state: PreflightState,
  payload: UpdateSessionMessage,
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);

  if (!state.workspaceWritable) {
    return buildResult(context, state, false, "Cannot update session because no workspace folder is open.", historyQuery, null);
  }

  if (!active.artifact || !active.sessionPath) {
    return buildResult(context, state, false, "No active session found. Save Draft first.", historyQuery, null);
  }

  const goal = payload.goal.trim();
  if (!goal) {
    return buildResult(context, state, false, "Goal is required.", historyQuery, active.artifact.session_id);
  }

  const truthSources = parseTruthSources(payload.truthSourcesText);
  if (truthSources.length === 0) {
    return buildResult(context, state, false, "At least one truth source is required.", historyQuery, active.artifact.session_id);
  }

  const runtime = buildRuntimeDraftFields(payload);
  const updated = applyRuntimeContext(
    {
      ...active.artifact,
      source: mergeSessionSource(active.artifact.source, "manual"),
      goal,
      truth_sources: truthSources,
      contract_risk: payload.contractRisk,
      execution_notes: runtime.execution_notes,
      verification_summary: runtime.verification_summary,
      risk_notes: runtime.risk_notes,
      closeout: {
        ...active.artifact.closeout,
        summary: runtime.closeout_summary,
        verification: runtime.verification_summary,
        risk_notes: runtime.risk_notes,
        next_action: runtime.next_action
      },
      next_action: runtime.next_action,
      signoff_by: runtime.signoff_by ?? active.artifact.signoff_by,
      updated_at: new Date().toISOString()
    },
    state
  );

  try {
    await writeSessionArtifact(active.sessionPath, updated);
    return buildResult(context, state, true, "Session updated.", historyQuery, updated.session_id);
  } catch (error) {
    return buildResult(context, state, false, `Failed to update session (${formatError(error)}).`, historyQuery, active.artifact.session_id);
  }
}

async function transitionSession(
  context: vscode.ExtensionContext,
  state: PreflightState,
  target: "Reviewed" | "Approved",
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);

  if (!active.artifact || !active.sessionPath) {
    return buildResult(context, state, false, "No active session found. Save Draft first.", historyQuery, null);
  }

  if (active.artifact.hold.active) {
    return buildResult(context, state, false, "Cannot progress while HOLD is active.", historyQuery, active.artifact.session_id);
  }

  const requiredState = target === "Reviewed" ? "Draft" : "Reviewed";
  if (active.artifact.state !== requiredState) {
    return buildResult(
      context,
      state,
      false,
      `${target} requires state ${requiredState}. Current state is ${active.artifact.state}.`,
      historyQuery,
      active.artifact.session_id
    );
  }

  const now = new Date().toISOString();
  const updated = applyRuntimeContext(
    {
      ...active.artifact,
      source: mergeSessionSource(active.artifact.source, "manual"),
      state: target,
      reviewed_at: target === "Reviewed" ? now : active.artifact.reviewed_at,
      approved_at: target === "Approved" ? now : active.artifact.approved_at,
      updated_at: now
    },
    state
  );

  await writeSessionArtifact(active.sessionPath, updated);
  return buildResult(context, state, true, `Session moved to ${target}.`, historyQuery, updated.session_id);
}

async function markExecuted(
  context: vscode.ExtensionContext,
  state: PreflightState,
  payload: MarkExecutedMessage,
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);
  if (!active.artifact || !active.sessionPath) {
    return buildResult(context, state, false, "No active session found.", historyQuery, null);
  }

  if (active.artifact.hold.active) {
    return buildResult(context, state, false, "Cannot mark executed while HOLD is active.", historyQuery, active.artifact.session_id);
  }

  if (active.artifact.state !== "Approved") {
    return buildResult(context, state, false, "Mark Executed requires state Approved.", historyQuery, active.artifact.session_id);
  }

  const notes = toNullableTrimmedString(payload.executionNotes);
  if (!notes) {
    return buildResult(context, state, false, "Execution notes are required.", historyQuery, active.artifact.session_id);
  }

  const now = new Date().toISOString();
  const updated = applyRuntimeContext(
    {
      ...active.artifact,
      source: mergeSessionSource(active.artifact.source, "manual"),
      state: "Executed",
      executed_at: now,
      execution_notes: notes,
      updated_at: now
    },
    state
  );

  await writeSessionArtifact(active.sessionPath, updated);
  return buildResult(context, state, true, "Session moved to Executed.", historyQuery, updated.session_id);
}

async function closeSession(
  context: vscode.ExtensionContext,
  state: PreflightState,
  payload: CloseSessionMessage,
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);
  if (!active.artifact || !active.sessionPath) {
    return buildResult(context, state, false, "No active session found.", historyQuery, null);
  }

  if (active.artifact.hold.active) {
    return buildResult(context, state, false, "Cannot close session while HOLD is active.", historyQuery, active.artifact.session_id);
  }

  if (active.artifact.state !== "Executed") {
    return buildResult(context, state, false, "Close Session requires state Executed.", historyQuery, active.artifact.session_id);
  }

  const closeoutSummary = toNullableTrimmedString(payload.closeoutSummary);
  const verificationSummary = toNullableTrimmedString(payload.verificationSummary);
  if (!closeoutSummary || !verificationSummary) {
    return buildResult(context, state, false, "Closeout and verification summaries are required.", historyQuery, active.artifact.session_id);
  }

  const now = new Date().toISOString();
  const updated = applyRuntimeContext(
    {
      ...active.artifact,
      source: mergeSessionSource(active.artifact.source, "manual"),
      state: "Closed",
      closed_at: now,
      verification_summary: verificationSummary,
      risk_notes: toNullableTrimmedString(payload.riskNotes),
      closeout: {
        ...active.artifact.closeout,
        summary: closeoutSummary,
        verification: verificationSummary,
        risk_notes: toNullableTrimmedString(payload.riskNotes),
        next_action: toNullableTrimmedString(payload.nextAction)
      },
      next_action: toNullableTrimmedString(payload.nextAction),
      updated_at: now
    },
    state
  );

  await writeSessionArtifact(active.sessionPath, updated);
  return buildResult(context, state, true, "Session moved to Closed.", historyQuery, updated.session_id);
}

async function signOffSession(
  context: vscode.ExtensionContext,
  state: PreflightState,
  payload: SignOffMessage,
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);
  if (!active.artifact || !active.sessionPath) {
    return buildResult(context, state, false, "No active session found.", historyQuery, null);
  }

  if (active.artifact.hold.active) {
    return buildResult(context, state, false, "Cannot sign off while HOLD is active.", historyQuery, active.artifact.session_id);
  }

  if (active.artifact.state !== "Closed") {
    return buildResult(context, state, false, "Sign Off requires state Closed.", historyQuery, active.artifact.session_id);
  }

  const signedOffBy = toNullableTrimmedString(payload.signedOffBy);
  if (!signedOffBy) {
    return buildResult(context, state, false, "Signoff By is required.", historyQuery, active.artifact.session_id);
  }

  const now = new Date().toISOString();
  const updated = applyRuntimeContext(
    {
      ...active.artifact,
      source: mergeSessionSource(active.artifact.source, "manual"),
      signoff_by: signedOffBy,
      signoff_status: "signed_off",
      signoff: {
        signed_off: true,
        signed_off_by: signedOffBy,
        signed_off_at: now
      },
      updated_at: now
    },
    state
  );

  await writeSessionArtifact(active.sessionPath, updated);
  return buildResult(context, state, true, "Session signoff recorded.", historyQuery, updated.session_id);
}

async function raiseHold(
  context: vscode.ExtensionContext,
  state: PreflightState,
  payload: RaiseHoldMessage,
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);
  if (!active.artifact || !active.sessionPath) {
    return buildResult(context, state, false, "No active session found.", historyQuery, null);
  }

  if (active.artifact.hold.active) {
    return buildResult(context, state, false, "HOLD is already active.", historyQuery, active.artifact.session_id);
  }

  const reason = toNullableTrimmedString(payload.reason);
  if (!reason) {
    return buildResult(context, state, false, "HOLD reason is required.", historyQuery, active.artifact.session_id);
  }

  const now = new Date().toISOString();
  const updated = applyRuntimeContext(
    applyHoldState(
      {
        ...active.artifact,
        source: mergeSessionSource(active.artifact.source, "manual"),
        updated_at: now
      },
      {
        hold_active: true,
        reason,
        proof_needed: [],
        options_next_step: [],
        resolution_event: "raised",
        resolved_at: null
      },
      now,
      "manual",
      null
    ),
    state
  );

  await writeSessionArtifact(active.sessionPath, updated);
  return buildResult(context, state, true, "HOLD raised.", historyQuery, updated.session_id);
}

async function clearHold(
  context: vscode.ExtensionContext,
  state: PreflightState,
  historyQuery: string
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);
  if (!active.artifact || !active.sessionPath) {
    return buildResult(context, state, false, "No active session found.", historyQuery, null);
  }

  if (!active.artifact.hold.active) {
    return buildResult(context, state, false, "No active HOLD to clear.", historyQuery, active.artifact.session_id);
  }

  const now = new Date().toISOString();
  const updated = applyRuntimeContext(
    applyHoldState(
      {
        ...active.artifact,
        source: mergeSessionSource(active.artifact.source, "manual"),
        updated_at: now
      },
      {
        hold_active: false,
        reason: active.artifact.hold.reason,
        proof_needed: active.artifact.hold.proof_needed,
        options_next_step: active.artifact.hold.options_next_step,
        resolution_event: "cleared",
        resolved_at: now
      },
      now,
      "manual",
      null
    ),
    state
  );

  await writeSessionArtifact(active.sessionPath, updated);
  return buildResult(context, state, true, "HOLD cleared.", historyQuery, updated.session_id);
}

async function exportSelectedSession(
  context: vscode.ExtensionContext,
  state: PreflightState,
  payload: ExportSessionMessage,
  historyQuery: string
): Promise<ActionResult> {
  if (!state.workspaceWritable) {
    return buildResult(context, state, false, "No workspace folder is open.", historyQuery, null);
  }

  const loaded = await loadSessionById(state.workspacePath, payload.sessionId);
  if (!loaded) {
    return buildResult(context, state, false, `Session ${payload.sessionId} not found.`, historyQuery, null);
  }

  try {
    const exportPath = await exportSession(state.workspacePath, loaded.artifact, payload.format);
    return buildResult(context, state, true, `Exported ${payload.format} to ${exportPath}.`, historyQuery, payload.sessionId);
  } catch (error) {
    return buildResult(context, state, false, `Export failed (${formatError(error)}).`, historyQuery, payload.sessionId);
  }
}

async function buildResult(
  context: vscode.ExtensionContext,
  state: PreflightState,
  success: boolean,
  message: string,
  historyQuery: string,
  selectedHistorySessionId: string | null
): Promise<ActionResult> {
  const active = await getActiveSession(context, state);
  const historyData = await loadHistoryData(state, historyQuery);

  let selectedHistorySession: PanelSessionView | null = null;
  if (selectedHistorySessionId && state.workspaceWritable) {
    const selected = await loadSessionById(state.workspacePath, selectedHistorySessionId);
    if (selected) {
      selectedHistorySession = toPanelSessionView(selected.artifact, selected.sessionPath);
    }
  }

  return buildActionResult(state, success, message, active, historyData.history, historyData.report, selectedHistorySession);
}

async function loadHistoryData(state: PreflightState, historyQuery: string): Promise<Awaited<ReturnType<typeof listHistory>>> {
  if (!state.workspaceWritable) {
    return {
      history: [],
      report: {
        sessionCount: 0,
        holdActiveCount: 0,
        signedOffCount: 0,
        fileTouchTotal: 0,
        contractRiskTotal: 0,
        recentSessions: []
      }
    };
  }

  return listHistory(state.workspacePath, historyQuery);
}

function startHookPump(context: vscode.ExtensionContext): void {
  stopHookPump();

  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    return;
  }

  const workspacePath = folder.uri.fsPath;
  const pattern = new vscode.RelativePattern(workspacePath, HOOK_EVENTS_RELATIVE_PATH);
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  hookPump = {
    workspacePath,
    watcher,
    timer: setInterval(() => {
      void processHookEvents(context);
    }, 4000),
    offset: 0,
    remainder: "",
    lineNumber: 0,
    processing: false
  };

  watcher.onDidCreate(() => void processHookEvents(context));
  watcher.onDidChange(() => void processHookEvents(context));

  context.subscriptions.push(watcher);

  void processHookEvents(context);
}

function stopHookPump(): void {
  if (!hookPump) {
    return;
  }

  clearInterval(hookPump.timer);
  hookPump.watcher.dispose();
  hookPump = null;
}

async function processHookEvents(context: vscode.ExtensionContext): Promise<void> {
  const runtime = hookPump;
  if (!runtime || runtime.processing) {
    return;
  }

  runtime.processing = true;

  try {
    const eventsFile = path.join(runtime.workspacePath, HOOK_EVENTS_RELATIVE_PATH);
    if (!(await fileExists(eventsFile))) {
      return;
    }

    const buffer = await fs.readFile(eventsFile);
    if (buffer.length < runtime.offset) {
      runtime.offset = 0;
      runtime.remainder = "";
      runtime.lineNumber = 0;
    }

    const chunk = buffer.toString("utf8", runtime.offset);
    runtime.offset = buffer.length;

    const combined = runtime.remainder + chunk;
    const lines = combined.split(/\r?\n/);
    runtime.remainder = lines.pop() ?? "";

    if (lines.length === 0) {
      return;
    }

    let state = getPreflightStateForWorkspace(runtime.workspacePath);
    let active = await getActiveSession(context, state);
    let changed = false;

    for (const line of lines) {
      runtime.lineNumber += 1;
      const event = parseHookEventLine(line, runtime.workspacePath, runtime.lineNumber);
      if (!event) {
        continue;
      }

      if (!active.artifact || !active.sessionPath) {
        if (!shouldCreateAutoSession(event.eventType)) {
          continue;
        }

        await ensureGovernedLayout(runtime.workspacePath);
        const now = new Date(event.at);
        const goal = event.sessionSpine?.goal ?? "Hook-started governed session";
        const truthSources = event.sessionSpine?.truth_sources.length
          ? event.sessionSpine.truth_sources
          : await getDefaultTruthSources(runtime.workspacePath);

        const runtimeFields: RuntimeDraftFields = {
          execution_notes: event.sessionSpine?.execution_notes ?? null,
          closeout_summary: event.sessionSpine?.closeout_summary ?? null,
          verification_summary: event.sessionSpine?.verification_summary ?? null,
          risk_notes: event.sessionSpine?.risk_notes ?? null,
          next_action: event.sessionSpine?.next_action ?? null,
          signoff_by: event.sessionSpine?.signoff_by ?? null,
          signoff_status: event.sessionSpine?.signoff_status ?? "not_signed_off"
        };

        const timestamp = formatSessionTimestamp(now);
        const sessionFolder = await getUniqueSessionFolder(runtime.workspacePath, timestamp, slugifyGoal(goal));
        const sessionId = path.basename(sessionFolder);
        let artifact = createDraftArtifact(
          state,
          sessionId,
          now.toISOString(),
          goal,
          truthSources,
          event.sessionSpine?.contract_risk ?? false,
          runtimeFields,
          "hook"
        );

        if (event.sessionSpine) {
          artifact = applySessionSpine(artifact, event.sessionSpine);
        }

        artifact = applyHookEventToArtifact(artifact, state, event);

        await writeSessionArtifact(sessionFolder, artifact);
        await setActiveSessionPath(context, sessionFolder);

        active = { artifact, sessionPath: sessionFolder, message: "Auto-created hook session." };
        changed = true;
        continue;
      }

      const updated = applyHookEventToArtifact(active.artifact, state, event);
      if (updated !== active.artifact) {
        await writeSessionArtifact(active.sessionPath, updated);
        active = { artifact: updated, sessionPath: active.sessionPath, message: "Hook event applied." };
        changed = true;
      }
    }

    if (changed) {
      await pushRefreshToOpenPanels(context, "Hook events captured and applied.");
    }
  } catch {
    // Hook parsing errors are intentionally non-fatal to preserve manual fallback.
  } finally {
    runtime.processing = false;
  }
}

async function pushRefreshToOpenPanels(context: vscode.ExtensionContext, message: string): Promise<void> {
  if (openPanels.size === 0) {
    return;
  }

  const state = getPreflightState();
  const result = await buildResult(context, state, true, message, "", null);
  await Promise.all(
    Array.from(openPanels)
      .filter((panel) => panel.visible)
      .map((panel) => panel.webview.postMessage(result))
  );
}

function shouldCreateAutoSession(eventType: string): boolean {
  return eventType === "pre_tool_use" || eventType === "post_tool_use" || eventType === "session_spine" || eventType === "hold_state";
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? `Git unavailable or workspace is not a repository (${error.message}).` : "Git unavailable or workspace is not a repository.";
}
