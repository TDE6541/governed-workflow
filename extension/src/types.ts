export type SessionState = "Draft" | "Reviewed" | "Approved" | "Executed" | "Closed";

export type SessionSource = "manual" | "hook" | "mixed";

export type SignoffStatus = "not_signed_off" | "signed_off";

export type GitState = {
  repoDetected: boolean;
  branch: string | null;
  dirty: boolean | null;
  message: string;
};

export type PreflightState = {
  workspacePath: string;
  workspaceName: string;
  workspaceWritable: boolean;
  git: GitState;
};

export type SessionHold = {
  active: boolean;
  reason: string | null;
  raised_at: string | null;
  cleared_at: string | null;
  state_when_raised: SessionState | null;
  proof_needed: string[];
  options_next_step: string[];
};

export type HoldHistoryEntry = {
  event: "raised" | "cleared";
  at: string;
  reason: string | null;
  proof_needed: string[];
  options_next_step: string[];
  source: "hook" | "manual";
  resolution_event: "raised" | "cleared";
  event_id: string | null;
};

export type ContractRiskHint = {
  path: string;
  category: string;
  reason: string;
  advisory: boolean;
};

export type HookEventCapture = {
  id: string;
  event_type: string;
  at: string;
  summary: string;
  files: string[];
  operation: string | null;
  status: "proposed" | "completed" | "n/a";
};

export type SessionCloseout = {
  summary: string | null;
  verification: string | null;
  risk_notes: string | null;
  next_action: string | null;
};

export type SessionSignoff = {
  signed_off: boolean;
  signed_off_by: string | null;
  signed_off_at: string | null;
};

export type SessionArtifact = {
  session_id: string;
  state: SessionState;
  source: SessionSource;
  created_at: string;
  updated_at: string;
  goal: string;
  truth_sources: string[];
  contract_risk: boolean;
  workspace: {
    name: string;
    path: string;
  };
  name: string;
  path: string;
  git: {
    summary: string;
    detail: string;
    repo_detected: boolean;
    branch: string | null;
    dirty: boolean | null;
  };
  summary: string;
  detail: string;
  hold: SessionHold;
  holds: string[];
  hold_history: HoldHistoryEntry[];
  hook_events_captured: HookEventCapture[];
  reviewed_at: string | null;
  approved_at: string | null;
  executed_at: string | null;
  closed_at: string | null;
  execution_notes: string | null;
  verification_summary: string | null;
  risk_notes: string | null;
  signoff_by: string | null;
  signoff_status: SignoffStatus;
  files_touched: string[];
  contract_risks_detected: ContractRiskHint[];
  closeout: SessionCloseout;
  next_action: string | null;
  signoff: SessionSignoff;
};

export type ActiveSessionLoad = {
  artifact: SessionArtifact | null;
  sessionPath: string | null;
  message: string;
};

export type SessionSpineBlock = {
  goal: string | null;
  truth_sources: string[];
  contract_risk: boolean | null;
  execution_notes: string | null;
  closeout_summary: string | null;
  verification_summary: string | null;
  risk_notes: string | null;
  next_action: string | null;
  signoff_by: string | null;
  signoff_status: SignoffStatus | null;
};

export type HoldStateBlock = {
  hold_active: boolean;
  reason: string | null;
  proof_needed: string[];
  options_next_step: string[];
  resolution_event: "raised" | "cleared";
  resolved_at: string | null;
};

export type NormalizedHookEvent = {
  id: string;
  eventType: "pre_tool_use" | "post_tool_use" | "session_spine" | "hold_state" | "stop" | "unknown";
  at: string;
  summary: string;
  files: string[];
  operation: string | null;
  status: "proposed" | "completed" | "n/a";
  sessionSpine: SessionSpineBlock | null;
  holdState: HoldStateBlock | null;
};

export type PanelPreflightView = {
  workspaceName: string;
  workspacePath: string;
  workspaceWritable: boolean;
  gitSummary: string;
  gitDetail: string;
};

export type PanelHoldView = {
  active: boolean;
  reason: string | null;
  raisedAt: string | null;
  clearedAt: string | null;
  stateWhenRaised: SessionState | null;
  proofNeeded: string[];
  optionsNextStep: string[];
};

export type PanelSignoffView = {
  signedOff: boolean;
  signedOffBy: string | null;
  signedOffAt: string | null;
};

export type PanelSessionView = {
  sessionId: string;
  state: SessionState;
  source: SessionSource;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
  closedAt: string | null;
  sessionPath: string;
  goal: string;
  truthSources: string[];
  contractRisk: boolean;
  executionNotes: string | null;
  verificationSummary: string | null;
  riskNotes: string | null;
  signoffBy: string | null;
  signoffStatus: SignoffStatus;
  filesTouched: string[];
  contractRisksDetected: ContractRiskHint[];
  holdHistory: HoldHistoryEntry[];
  hookEventsCaptured: HookEventCapture[];
  hold: PanelHoldView;
  reviewedAt: string | null;
  approvedAt: string | null;
  nextAction: string | null;
  closeoutSummary: string | null;
  signoff: PanelSignoffView;
  gitSummary: string;
  gitDetail: string;
};

export type PanelHistoryItem = {
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

export type PanelReportView = {
  sessionCount: number;
  holdActiveCount: number;
  signedOffCount: number;
  fileTouchTotal: number;
  contractRiskTotal: number;
  recentSessions: string[];
};

export type ActionResult = {
  type: "actionResult";
  success: boolean;
  message: string;
  preflight: PanelPreflightView;
  session: PanelSessionView | null;
  history: PanelHistoryItem[];
  report: PanelReportView;
  selectedHistorySession: PanelSessionView | null;
};