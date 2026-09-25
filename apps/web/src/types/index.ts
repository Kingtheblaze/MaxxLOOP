export type LoopStage = "track" | "understand" | "act" | "measure" | "improve";

export interface DriverItem {
  kind: string;
  contribution: number;
  label: string;
  z_score: number;
}

export interface SparklinePoint {
  ts: string;
  score: number;
  baseline: number;
  is_drop: boolean;
}

export interface CapacityData {
  score: number;
  baseline: number;
  delta: number;
  is_drop: boolean;
  status_label: string;
  drivers: DriverItem[];
  sparkline: SparklinePoint[];
  last_updated: string;
}

export interface ActionData {
  id: string;
  title: string;
  one_line_why: string;
  steps: string[];
  duration_min: number;
  category: string;
  target_drivers: string[];
  caution_note: string;
  prior_effect: number;
  risk_level: string;
}

export interface ExplanationData {
  headline: string;
  why: string;
  action_intro: string;
  encouragement: string;
}

export interface OutcomeData {
  id: number;
  intervention_id: number;
  pre_score: number;
  post_score: number;
  observed_delta: number;
  expected_delta_no_action: number;
  net_effect: number;
  confidence: "Low" | "Medium" | "High";
  user_helpful: boolean | null;
  note?: string;
}

export interface ActiveLoopState {
  has_active_loop: boolean;
  stage: LoopStage;
  snapshot_id?: number;
  intervention_id?: number;
  action?: ActionData;
  explanation?: ExplanationData;
  explainer_provider?: string;
  started_at?: string;
  window_seconds_remaining?: number;
  is_timewarped?: boolean;
  latest_outcome?: OutcomeData;
  drivers?: DriverItem[];
}

export interface ActionInsight {
  action_id: string;
  title: string;
  category: string;
  n_uses: number;
  mean_net_effect: number;
  ci_lower: number;
  ci_upper: number;
  helpful_ratio: number;
}

export interface InsightsData {
  total_loops_closed: number;
  current_streak: number;
  pct_helpful: number;
  avg_score_improvement: number;
  top_actions: ActionInsight[];
  top_recurring_drivers: { kind: string; count: number; label: string }[];
  time_of_day_distribution: Record<string, number>;
  weekly_trend: { day: string; date: string; score: number }[];
}

export interface LLMPayloadInspection {
  last_payload_sent: Record<string, any>;
  last_response_received: Record<string, any>;
  provider_used: string;
  sanitized: boolean;
  raw_personal_data_excluded: string[];
}

export interface CrisisInfo {
  country: string;
  primary_helpline: string;
  toll_free_number: string;
  secondary_helpline: string;
  international_resource: string;
  support_message: string;
  disclaimer: string;
}
