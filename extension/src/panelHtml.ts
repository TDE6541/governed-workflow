import * as vscode from "vscode";
import { PanelHistoryItem, PanelPreflightView, PanelReportView, PanelSessionView } from "./types";

export function renderPreflightHtml(
  initial: {
    preflight: PanelPreflightView;
    session: PanelSessionView | null;
    history: PanelHistoryItem[];
    report: PanelReportView;
    selectedHistorySession: PanelSessionView | null;
    statusMessage: string;
  },
  webview: vscode.Webview
): string {
  const nonce = getNonce();
  const initialDataLiteral = JSON.stringify(initial).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <title>Governed Workflow</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #111827;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --ok: #22c55e;
      --warn: #f59e0b;
      --err: #ef4444;
      --line: rgba(148, 163, 184, 0.25);
      --chip: rgba(30, 41, 59, 0.75);
    }
    body {
      margin: 0;
      padding: 16px;
      font-family: "Segoe UI", sans-serif;
      background: radial-gradient(circle at top right, #1f2937, var(--bg));
      color: var(--text);
    }
    .card {
      max-width: 980px;
      margin: 0 auto;
      padding: 16px;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(17, 24, 39, 0.95), rgba(2, 6, 23, 0.95));
      border: 1px solid var(--line);
    }
    h1 { margin: 0 0 10px; font-size: 20px; }
    h2 {
      margin: 14px 0 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      border-top: 1px solid var(--line);
      padding-top: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 8px;
    }
    .line {
      margin: 0;
      padding: 6px 8px;
      border-radius: 8px;
      background: var(--chip);
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 12px;
    }
    .label {
      min-width: 124px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 11px;
      font-weight: 700;
    }
    .value { word-break: break-word; }
    .code { font-family: Consolas, "Courier New", monospace; color: var(--muted); }
    .status { margin-top: 6px; min-height: 16px; font-size: 12px; }
    .status.info { color: var(--muted); }
    .status.success { color: var(--ok); }
    .status.error { color: var(--err); }
    .validation { min-height: 16px; color: var(--warn); margin-top: 6px; font-size: 12px; }
    input[type="text"], textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0b1220;
      color: var(--text);
      padding: 8px 10px;
      font-size: 12px;
      font-family: "Segoe UI", sans-serif;
      margin-top: 4px;
    }
    textarea { min-height: 80px; resize: vertical; }
    .actions {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }
    button {
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: linear-gradient(180deg, #1f2937, #111827);
      color: var(--text);
      cursor: pointer;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 600;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .hold-active { color: var(--err); font-weight: 700; }
    .pill { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 11px; }
    .draft { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .reviewed { background: rgba(234, 179, 8, 0.2); color: #fcd34d; }
    .approved { background: rgba(34, 197, 94, 0.2); color: #86efac; }
    .executed { background: rgba(6, 182, 212, 0.2); color: #67e8f9; }
    .closed { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }
    .history-row {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px;
      margin-top: 6px;
      background: rgba(15, 23, 42, 0.7);
      cursor: pointer;
      font-size: 12px;
    }
    .history-row.active { border-color: rgba(56, 189, 248, 0.8); }
    .history-title { font-weight: 700; margin-bottom: 4px; }
    .mini { color: var(--muted); font-size: 11px; }
    .history-controls {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) auto;
      gap: 8px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Governed Workflow Dashboard</h1>

    <h2>Workspace Context</h2>
    <div class="grid">
      <div class="line"><span class="label">Workspace</span><span id="workspaceName" class="value"></span></div>
      <div class="line"><span class="label">Path</span><span id="workspacePath" class="value code"></span></div>
      <div class="line"><span class="label">Git Summary</span><span id="gitSummary" class="value"></span></div>
      <div class="line"><span class="label">Git Detail</span><span id="gitDetail" class="value"></span></div>
    </div>

    <h2>Active Session</h2>
    <div class="grid">
      <div class="line"><span class="label">Session</span><span id="sessionId" class="value"></span></div>
      <div class="line"><span class="label">State</span><span id="sessionState" class="value"></span></div>
      <div class="line"><span class="label">Source</span><span id="sessionSource" class="value"></span></div>
      <div class="line"><span class="label">Artifact</span><span id="sessionPath" class="value code"></span></div>
      <div class="line"><span class="label">HOLD</span><span id="holdStatus" class="value"></span></div>
      <div class="line"><span class="label">Signoff</span><span id="signoffStatus" class="value"></span></div>
    </div>

    <h2>Session Inputs</h2>
    <label>Goal (required)</label>
    <input id="goal" type="text" placeholder="Describe the session goal" />

    <label>Truth Sources (required, one per line or comma separated)</label>
    <textarea id="truthSources" placeholder="README.md&#10;TEAM_CHARTER.md"></textarea>

    <div style="margin-top:8px;">
      <input id="contractRisk" type="checkbox" />
      <label for="contractRisk">Contract Risk</label>
    </div>

    <label>Execution Notes</label>
    <textarea id="executionNotes"></textarea>

    <label>Closeout Summary</label>
    <textarea id="closeoutSummary"></textarea>

    <label>Verification Summary</label>
    <textarea id="verificationSummary"></textarea>

    <label>Risk Notes</label>
    <textarea id="riskNotes"></textarea>

    <label>Next Action</label>
    <input id="nextAction" type="text" />

    <label>Signoff By</label>
    <input id="signoffBy" type="text" />

    <label>HOLD Reason (required for Raise HOLD)</label>
    <input id="holdReason" type="text" />

    <div class="actions">
      <button id="saveDraft">Save Draft</button>
      <button id="updateSession">Update Session</button>
      <button id="markReviewed">Mark Reviewed</button>
      <button id="approveSession">Approve</button>
      <button id="markExecuted">Mark Executed</button>
      <button id="closeSession">Close Session</button>
      <button id="signOff">Sign Off</button>
      <button id="raiseHold">Raise HOLD</button>
      <button id="clearHold">Clear HOLD</button>
    </div>

    <div id="validation" class="validation"></div>
    <div id="status" class="status info"></div>

    <h2>Receipts + Reporting</h2>
    <div class="history-controls">
      <input id="historyQuery" type="text" placeholder="Filter by id, goal, state, source" />
      <button id="refreshHistory">Refresh History</button>
    </div>

    <div class="grid">
      <div class="line"><span class="label">Sessions</span><span id="reportSessions" class="value"></span></div>
      <div class="line"><span class="label">Active HOLDs</span><span id="reportHolds" class="value"></span></div>
      <div class="line"><span class="label">Signed Off</span><span id="reportSignoff" class="value"></span></div>
      <div class="line"><span class="label">File Touches</span><span id="reportFiles" class="value"></span></div>
      <div class="line"><span class="label">Contract Risks</span><span id="reportRisks" class="value"></span></div>
      <div class="line"><span class="label">Recent Sessions</span><span id="reportRecent" class="value"></span></div>
    </div>

    <div style="margin-top:8px;" id="historyList"></div>

    <div class="actions" style="margin-top:10px;">
      <button id="exportSelectedMarkdown">Export Selected Markdown</button>
      <button id="exportSelectedJson">Export Selected JSON</button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const initialData = ${initialDataLiteral};

    const model = {
      preflight: initialData.preflight,
      session: initialData.session,
      history: initialData.history || [],
      report: initialData.report,
      selectedHistorySession: initialData.selectedHistorySession,
      busy: false
    };

    const sessionEls = {
      workspaceName: document.getElementById("workspaceName"),
      workspacePath: document.getElementById("workspacePath"),
      gitSummary: document.getElementById("gitSummary"),
      gitDetail: document.getElementById("gitDetail"),
      sessionId: document.getElementById("sessionId"),
      sessionState: document.getElementById("sessionState"),
      sessionSource: document.getElementById("sessionSource"),
      sessionPath: document.getElementById("sessionPath"),
      holdStatus: document.getElementById("holdStatus"),
      signoffStatus: document.getElementById("signoffStatus")
    };

    const inputs = {
      goal: document.getElementById("goal"),
      truthSources: document.getElementById("truthSources"),
      contractRisk: document.getElementById("contractRisk"),
      executionNotes: document.getElementById("executionNotes"),
      closeoutSummary: document.getElementById("closeoutSummary"),
      verificationSummary: document.getElementById("verificationSummary"),
      riskNotes: document.getElementById("riskNotes"),
      nextAction: document.getElementById("nextAction"),
      signoffBy: document.getElementById("signoffBy"),
      holdReason: document.getElementById("holdReason"),
      historyQuery: document.getElementById("historyQuery")
    };

    const buttons = {
      saveDraft: document.getElementById("saveDraft"),
      updateSession: document.getElementById("updateSession"),
      markReviewed: document.getElementById("markReviewed"),
      approveSession: document.getElementById("approveSession"),
      markExecuted: document.getElementById("markExecuted"),
      closeSession: document.getElementById("closeSession"),
      signOff: document.getElementById("signOff"),
      raiseHold: document.getElementById("raiseHold"),
      clearHold: document.getElementById("clearHold"),
      refreshHistory: document.getElementById("refreshHistory"),
      exportSelectedMarkdown: document.getElementById("exportSelectedMarkdown"),
      exportSelectedJson: document.getElementById("exportSelectedJson")
    };

    const historyListEl = document.getElementById("historyList");
    const validationEl = document.getElementById("validation");
    const statusEl = document.getElementById("status");

    const reportEls = {
      sessions: document.getElementById("reportSessions"),
      holds: document.getElementById("reportHolds"),
      signoff: document.getElementById("reportSignoff"),
      files: document.getElementById("reportFiles"),
      risks: document.getElementById("reportRisks"),
      recent: document.getElementById("reportRecent")
    };

    const setStatus = (message, kind) => {
      statusEl.textContent = message;
      statusEl.className = "status " + kind;
    };

    const setValidation = (message) => {
      validationEl.textContent = message;
    };

    const nullable = (value, fallback = "not recorded") => value && value.length > 0 ? value : fallback;

    const parseTruthSources = (text) => {
      const parsed = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .flatMap((line) => line.includes(",")
          ? line.split(",").map((item) => item.trim()).filter((item) => item.length > 0)
          : [line]
        );

      const deduped = [];
      const seen = new Set();
      for (const source of parsed) {
        const key = source.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        deduped.push(source);
      }
      return deduped;
    };

    const collectInput = () => ({
      goal: inputs.goal.value.trim(),
      truthSourcesText: inputs.truthSources.value,
      truthSources: parseTruthSources(inputs.truthSources.value),
      contractRisk: inputs.contractRisk.checked,
      executionNotes: inputs.executionNotes.value,
      closeoutSummary: inputs.closeoutSummary.value,
      verificationSummary: inputs.verificationSummary.value,
      riskNotes: inputs.riskNotes.value,
      nextAction: inputs.nextAction.value,
      signoffBy: inputs.signoffBy.value.trim(),
      holdReason: inputs.holdReason.value.trim()
    });

    const postAction = (payload, pendingMessage) => {
      model.busy = true;
      renderButtons();
      setValidation("");
      setStatus(pendingMessage, "info");
      vscode.postMessage(payload);
    };

    const syncFormFromSession = () => {
      if (!model.session) {
        return;
      }

      inputs.goal.value = model.session.goal;
      inputs.truthSources.value = model.session.truthSources.join("\n");
      inputs.contractRisk.checked = model.session.contractRisk;
      inputs.executionNotes.value = model.session.executionNotes || "";
      inputs.closeoutSummary.value = model.session.closeoutSummary || "";
      inputs.verificationSummary.value = model.session.verificationSummary || "";
      inputs.riskNotes.value = model.session.riskNotes || "";
      inputs.nextAction.value = model.session.nextAction || "";
      inputs.signoffBy.value = model.session.signoffBy || "";
    };

    const renderPreflight = () => {
      sessionEls.workspaceName.textContent = model.preflight.workspaceName;
      sessionEls.workspacePath.textContent = model.preflight.workspacePath;
      sessionEls.gitSummary.textContent = model.preflight.gitSummary;
      sessionEls.gitDetail.textContent = model.preflight.gitDetail;
    };

    const renderSession = () => {
      if (!model.session) {
        sessionEls.sessionId.textContent = "no active session";
        sessionEls.sessionState.textContent = "no active session";
        sessionEls.sessionState.className = "value";
        sessionEls.sessionSource.textContent = "none";
        sessionEls.sessionPath.textContent = "no artifact";
        sessionEls.holdStatus.textContent = "no HOLD active";
        sessionEls.holdStatus.className = "value";
        sessionEls.signoffStatus.textContent = "not signed off";
        return;
      }

      sessionEls.sessionId.textContent = model.session.sessionId;
      sessionEls.sessionState.innerHTML = "<span class=\"pill " + model.session.state.toLowerCase() + "\">" + model.session.state + "</span>";
      sessionEls.sessionSource.textContent = model.session.source;
      sessionEls.sessionPath.textContent = model.session.sessionPath;

      const holdText = model.session.hold.active
        ? "HOLD ACTIVE | " + nullable(model.session.hold.reason, "no reason")
        : "no HOLD active | last reason: " + nullable(model.session.hold.reason, "none");

      sessionEls.holdStatus.textContent = holdText;
      sessionEls.holdStatus.className = model.session.hold.active ? "value hold-active" : "value";

      sessionEls.signoffStatus.textContent = model.session.signoffStatus + " | by: " + nullable(model.session.signoffBy, "not set");
    };

    const renderHistory = () => {
      historyListEl.innerHTML = "";

      if (!model.history || model.history.length === 0) {
        historyListEl.innerHTML = '<div class="mini">No sessions found for current filter.</div>';
      } else {
        for (const item of model.history) {
          const row = document.createElement("div");
          row.className = "history-row" + (model.selectedHistorySession && model.selectedHistorySession.sessionId === item.sessionId ? " active" : "");
          row.dataset.sessionId = item.sessionId;
          row.innerHTML = [
            "<div class=\"history-title\">" + item.sessionId + "</div>",
            "<div class=\"mini\">" + item.state + " | " + item.source + " | updated: " + item.updatedAt + "</div>",
            "<div class=\"mini\">files: " + item.filesTouchedCount + " | contract risks: " + item.contractRiskCount + " | hold active: " + item.holdActive + "</div>",
            "<div>" + item.goal + "</div>"
          ].join("");
          row.addEventListener("click", () => {
            postAction({ type: "selectHistorySession", sessionId: item.sessionId, historyQuery: inputs.historyQuery.value }, "Loading history session...");
          });
          historyListEl.appendChild(row);
        }
      }

      reportEls.sessions.textContent = String(model.report.sessionCount);
      reportEls.holds.textContent = String(model.report.holdActiveCount);
      reportEls.signoff.textContent = String(model.report.signedOffCount);
      reportEls.files.textContent = String(model.report.fileTouchTotal);
      reportEls.risks.textContent = String(model.report.contractRiskTotal);
      reportEls.recent.textContent = model.report.recentSessions.join(" | ") || "none";
    };

    const renderButtons = () => {
      const hasSession = !!model.session;
      const holdActive = hasSession && model.session.hold.active;
      const workspaceWritable = model.preflight.workspaceWritable;
      const state = hasSession ? model.session.state : null;

      buttons.saveDraft.disabled = model.busy || !workspaceWritable || hasSession;
      buttons.updateSession.disabled = model.busy || !workspaceWritable || !hasSession;
      buttons.markReviewed.disabled = model.busy || !workspaceWritable || !hasSession || holdActive || state !== "Draft";
      buttons.approveSession.disabled = model.busy || !workspaceWritable || !hasSession || holdActive || state !== "Reviewed";
      buttons.markExecuted.disabled = model.busy || !workspaceWritable || !hasSession || holdActive || state !== "Approved";
      buttons.closeSession.disabled = model.busy || !workspaceWritable || !hasSession || holdActive || state !== "Executed";
      buttons.signOff.disabled = model.busy || !workspaceWritable || !hasSession || holdActive || state !== "Closed";
      buttons.raiseHold.disabled = model.busy || !workspaceWritable || !hasSession || holdActive;
      buttons.clearHold.disabled = model.busy || !workspaceWritable || !hasSession || !holdActive;
      buttons.refreshHistory.disabled = model.busy;

      const selectedId = model.selectedHistorySession ? model.selectedHistorySession.sessionId : null;
      buttons.exportSelectedMarkdown.disabled = model.busy || !selectedId;
      buttons.exportSelectedJson.disabled = model.busy || !selectedId;
    };

    buttons.saveDraft.addEventListener("click", () => {
      const input = collectInput();
      const errors = [];
      if (!model.preflight.workspaceWritable) {
        errors.push("No workspace folder is open.");
      }
      if (!input.goal) {
        errors.push("Goal is required.");
      }
      if (input.truthSources.length === 0) {
        errors.push("At least one truth source is required.");
      }
      if (model.session) {
        errors.push("Active session already exists.");
      }
      if (errors.length > 0) {
        setValidation(errors.join(" "));
        setStatus("Draft was not saved.", "error");
        return;
      }
      postAction({ type: "saveDraft", ...input, historyQuery: inputs.historyQuery.value }, "Saving draft...");
    });

    buttons.updateSession.addEventListener("click", () => {
      const input = collectInput();
      const errors = [];
      if (!model.session) {
        errors.push("No active session.");
      }
      if (!input.goal) {
        errors.push("Goal is required.");
      }
      if (input.truthSources.length === 0) {
        errors.push("At least one truth source is required.");
      }
      if (errors.length > 0) {
        setValidation(errors.join(" "));
        setStatus("Session was not updated.", "error");
        return;
      }
      postAction({ type: "updateSession", ...input, historyQuery: inputs.historyQuery.value }, "Updating session...");
    });

    buttons.markReviewed.addEventListener("click", () => postAction({ type: "markReviewed", historyQuery: inputs.historyQuery.value }, "Marking reviewed..."));
    buttons.approveSession.addEventListener("click", () => postAction({ type: "approveSession", historyQuery: inputs.historyQuery.value }, "Approving session..."));
    buttons.markExecuted.addEventListener("click", () => {
      const input = collectInput();
      if (!input.executionNotes.trim()) {
        setValidation("Execution notes are required.");
        setStatus("Session was not marked executed.", "error");
        return;
      }
      postAction({ type: "markExecuted", executionNotes: input.executionNotes, historyQuery: inputs.historyQuery.value }, "Marking executed...");
    });

    buttons.closeSession.addEventListener("click", () => {
      const input = collectInput();
      if (!input.closeoutSummary.trim() || !input.verificationSummary.trim()) {
        setValidation("Closeout summary and verification summary are required.");
        setStatus("Session was not closed.", "error");
        return;
      }
      postAction(
        {
          type: "closeSession",
          closeoutSummary: input.closeoutSummary,
          verificationSummary: input.verificationSummary,
          riskNotes: input.riskNotes,
          nextAction: input.nextAction,
          historyQuery: inputs.historyQuery.value
        },
        "Closing session..."
      );
    });

    buttons.signOff.addEventListener("click", () => {
      const input = collectInput();
      if (!input.signoffBy) {
        setValidation("Signoff by is required.");
        setStatus("Session was not signed off.", "error");
        return;
      }
      postAction({ type: "signOff", signedOffBy: input.signoffBy, historyQuery: inputs.historyQuery.value }, "Signing off...");
    });

    buttons.raiseHold.addEventListener("click", () => {
      const reason = collectInput().holdReason;
      if (!reason) {
        setValidation("HOLD reason is required.");
        setStatus("HOLD was not raised.", "error");
        return;
      }
      postAction({ type: "raiseHold", reason, historyQuery: inputs.historyQuery.value }, "Raising HOLD...");
    });

    buttons.clearHold.addEventListener("click", () => {
      postAction({ type: "clearHold", historyQuery: inputs.historyQuery.value }, "Clearing HOLD...");
    });

    buttons.refreshHistory.addEventListener("click", () => {
      postAction({ type: "loadHistory", historyQuery: inputs.historyQuery.value }, "Refreshing history...");
    });

    buttons.exportSelectedMarkdown.addEventListener("click", () => {
      if (!model.selectedHistorySession) {
        return;
      }
      postAction({ type: "exportSession", sessionId: model.selectedHistorySession.sessionId, format: "markdown", historyQuery: inputs.historyQuery.value }, "Exporting markdown...");
    });

    buttons.exportSelectedJson.addEventListener("click", () => {
      if (!model.selectedHistorySession) {
        return;
      }
      postAction({ type: "exportSession", sessionId: model.selectedHistorySession.sessionId, format: "json", historyQuery: inputs.historyQuery.value }, "Exporting json...");
    });

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (!message || message.type !== "actionResult") {
        return;
      }

      model.busy = false;
      model.preflight = message.preflight;
      model.session = message.session;
      model.history = message.history || [];
      model.report = message.report;
      model.selectedHistorySession = message.selectedHistorySession;

      renderPreflight();
      renderSession();
      renderHistory();
      renderButtons();

      if (message.success && model.session) {
        syncFormFromSession();
      }

      setStatus(message.message, message.success ? "success" : "error");
    });

    renderPreflight();
    renderSession();
    renderHistory();
    renderButtons();

    if (model.session) {
      syncFormFromSession();
    }

    setStatus(initialData.statusMessage, "info");
  </script>
</body>
</html>`;
}

function getNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let index = 0; index < 32; index += 1) {
    nonce += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return nonce;
}

