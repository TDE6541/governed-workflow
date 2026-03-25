import {
  ActionResult,
  ActiveSessionLoad,
  PanelHistoryItem,
  PanelPreflightView,
  PanelReportView,
  PanelSessionView,
  PreflightState,
  SessionArtifact
} from "./types";

export function toPanelPreflightView(state: PreflightState): PanelPreflightView {
  return {
    workspaceName: state.workspaceName,
    workspacePath: state.workspacePath,
    workspaceWritable: state.workspaceWritable,
    gitSummary: state.git.repoDetected ? `${state.git.branch ?? "(unknown branch)"} | ${state.git.dirty ? "dirty" : "clean"}` : "git repo not detected",
    gitDetail: state.git.message
  };
}

export function toPanelSessionView(artifact: SessionArtifact, sessionPath: string): PanelSessionView {
  return {
    sessionId: artifact.session_id,
    state: artifact.state,
    source: artifact.source,
    createdAt: artifact.created_at,
    updatedAt: artifact.updated_at,
    executedAt: artifact.executed_at,
    closedAt: artifact.closed_at,
    sessionPath,
    goal: artifact.goal,
    truthSources: artifact.truth_sources,
    contractRisk: artifact.contract_risk,
    executionNotes: artifact.execution_notes,
    verificationSummary: artifact.verification_summary,
    riskNotes: artifact.risk_notes,
    signoffBy: artifact.signoff_by,
    signoffStatus: artifact.signoff_status,
    filesTouched: artifact.files_touched,
    contractRisksDetected: artifact.contract_risks_detected,
    holdHistory: artifact.hold_history,
    hookEventsCaptured: artifact.hook_events_captured,
    hold: {
      active: artifact.hold.active,
      reason: artifact.hold.reason,
      raisedAt: artifact.hold.raised_at,
      clearedAt: artifact.hold.cleared_at,
      stateWhenRaised: artifact.hold.state_when_raised,
      proofNeeded: artifact.hold.proof_needed,
      optionsNextStep: artifact.hold.options_next_step
    },
    reviewedAt: artifact.reviewed_at,
    approvedAt: artifact.approved_at,
    nextAction: artifact.next_action,
    closeoutSummary: artifact.closeout.summary,
    signoff: {
      signedOff: artifact.signoff.signed_off,
      signedOffBy: artifact.signoff.signed_off_by,
      signedOffAt: artifact.signoff.signed_off_at
    },
    gitSummary: artifact.git.summary,
    gitDetail: artifact.git.detail
  };
}

export function buildActionResult(
  state: PreflightState,
  success: boolean,
  message: string,
  active: ActiveSessionLoad,
  history: PanelHistoryItem[],
  report: PanelReportView,
  selectedHistorySession: PanelSessionView | null
): ActionResult {
  return {
    type: "actionResult",
    success,
    message,
    preflight: toPanelPreflightView(state),
    session: active.artifact && active.sessionPath ? toPanelSessionView(active.artifact, active.sessionPath) : null,
    history,
    report,
    selectedHistorySession
  };
}