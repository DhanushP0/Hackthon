import type { RiskAccount, DashboardMetrics } from './types';

export const MOCK_METRICS: DashboardMetrics = {
  total_users: 100,
  risks_detected: 14,
  avg_precision: 0.92,
  critical_alerts: 4
};

export const BUILT_IN_MOCK_ACCOUNTS: RiskAccount[] = [
  {
    user_id: "USR00000",
    username: "pooja.murphy",
    department: "Executive",
    role_title: "Developer",
    risk_level: "HIGH",
    risk_score: 74,
    confidence: 0.89,
    findings: [
      {
        finding: "STALE_ACCOUNT_INACTIVITY",
        details: "Account has been inactive for 59 days but retains Active Directory (AD) infrastructure access privileges.",
        severity: "HIGH",
        recommendation: "Flag for account suspension or initiate immediate active credential validation."
      },
      {
        finding: "ROLE_MISMATCH_PRIVILEGE",
        details: "Assigned to Executive department but holds standard Developer privileges with standalone AD access.",
        severity: "MEDIUM",
        recommendation: "Verify cross-department access requirements with team lead."
      }
    ],
    suggested_actions: [
      "Verify active employment status with HR",
      "Check cross-system access tracking logs for unrecorded modifications",
      "Temporarily lock AD access until confirmation is received"
    ],
    next_escalation: "IAM Ops Triage Tier-1"
  },
  {
    user_id: "USR00002",
    username: "kenneth.moore",
    department: "Sales",
    role_title: "Architect",
    risk_level: "CRITICAL",
    risk_score: 95,
    confidence: 0.96,
    findings: [
      {
        finding: "ORPHANED_SERVICE_ACCOUNT",
        details: "Account is classified explicitly as a 'service-account' but is assigned to a human name profile in Sales.",
        severity: "CRITICAL",
        recommendation: "Isolate immediate interactive terminal logins. Rotate secrets."
      },
      {
        finding: "HIGH_RISK_DATA_ACCESS",
        details: "Holds direct system clearance for non-segmented production infrastructure: EMAIL and PROD_DB.",
        severity: "HIGH",
        recommendation: "Implement Principle of Least Privilege (PoLP) and migrate to IAM Role keys."
      }
    ],
    suggested_actions: [
      "Audit PROD_DB transactional query logs for any rogue read statements",
      "Convert credential schema from human-associated to system managed service identity",
      "Revoke direct interactive shell login permissions"
    ],
    next_escalation: "Incident Response Team Escalation"
  },
  {
    user_id: "USR00001",
    username: "daniel.singh",
    department: "Compliance",
    role_title: "Lead",
    risk_level: "MEDIUM",
    risk_score: 42,
    confidence: 0.85,
    findings: [
      {
        finding: "PRIVILEGE_DRIFT",
        details: "Compliance role holds direct write authorization profiles across Azure_AD and Salesforce environments.",
        severity: "MEDIUM",
        recommendation: "Downgrade access permissions to read-only compliance auditing views."
      }
    ],
    suggested_actions: [
      "Conduct automated quarterly privilege attestation review",
      "Restrict Azure_AD global administration settings to specialized IT roles"
    ],
    next_escalation: "Internal GRC Review"
  },
  {
    user_id: "USR00003",
    username: "marcus.vance",
    department: "Engineering",
    role_title: "DevOps Engineer",
    risk_level: "CRITICAL",
    risk_score: 89,
    confidence: 0.94,
    findings: [
      {
        finding: "GEOGRAPHIC_IMPOSSIBILITY",
        details: "Concurrent session authentication handshake requests recorded from London, UK and Seoul, South Korea within a 12-minute window.",
        severity: "CRITICAL",
        recommendation: "Terminate all active infrastructure sessions and enforce step-up hardware token verification."
      },
      {
        finding: "API_KEY_LEAK",
        details: "Live deployment secrets matching this profile signature detected in an unencrypted public GitHub repository block.",
        severity: "CRITICAL",
        recommendation: "Invalidate standard programmatic API token strings immediately."
      }
    ],
    suggested_actions: [
      "Cycle AWS and production cluster credentials",
      "Notify user to submit a formal local endpoint compromise check log",
      "Quarantine affected cloud compute nodes"
    ],
    next_escalation: "SecOps Center Tier-3 Incident Command"
  },
  {
    user_id: "USR00004",
    username: "elena.rostova",
    department: "Human Resources",
    role_title: "HR Specialist",
    risk_level: "LOW",
    risk_score: 18,
    confidence: 0.78,
    findings: [
      {
        finding: "UNUSUAL_HOURS_ACCESS",
        details: "Profile authorized multiple file system lookups on employee records at 03:14 AM local workstation time.",
        severity: "INFORMATIONAL",
        recommendation: "No urgent intervention required; append telemetry event payload to regular monthly review pipeline."
      }
    ],
    suggested_actions: [
      "Cross-check access window timestamp metadata against known platform maintenance or schedule configurations"
    ],
    next_escalation: "Self-Clearance Archive"
  }
];
