export interface Finding {
  finding: string;
  details: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFORMATIONAL';
  recommendation: string;
}

export interface RiskAccount {
  user_id: string;
  username: string;
  department: string;
  role_title: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_score: number;
  confidence: number;
  findings: Finding[];
  suggested_actions: string[];
  next_escalation: string;
  risk_narrative?: string;
}

export interface DashboardMetrics {
  total_users: number;
  risks_detected: number;
  avg_precision: number;
  critical_alerts: number;
}

export interface BonusInsights {
  generated_at: number;
  live_alerts: Array<{
    id: string;
    username: string;
    risk_level: string;
    message: string;
    score: number;
  }>;
  graph: {
    nodes: Array<{
      id: string;
      label: string;
      type: 'user' | 'system';
      risk: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      weight: number;
    }>;
  };
  clusters: Array<{
    name: string;
    count: number;
    average_score: number;
    top_findings: string[];
  }>;
  impact_simulations: Array<{
    user_id: string;
    username: string;
    blast_radius_score: number;
    systems_at_risk: string[];
    sensitive_systems: string[];
    likely_impact: string;
  }>;
  feedback_summary: {
    reviewed: number;
    false_positive_rate: number;
    learning_mode: string;
  };
  integrations: Array<{
    provider: string;
    status: string;
    signal: string;
  }>;
  org_anomalies: Array<{
    department: string;
    average_risk: number;
    flagged_users: number;
    signal: string;
  }>;
  sod_violations: Array<{
    user_id: string;
    username: string;
    department: string;
    conflicts: string[];
  }>;
  compliance_gaps: Array<{
    system: string;
    flagged_users: number;
    high_risk_users: number;
    gap: string;
  }>;
  dlp_actions: Array<{
    user_id: string;
    username: string;
    resource: string;
    action: string;
    risk_level: string;
  }>;
  correlated_systems: Array<{
    system: string;
    linked_risks: number;
    high_risk_users: number;
    correlation: string;
  }>;
}
