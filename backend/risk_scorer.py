import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# =====================================================
# LOAD DATA
# =====================================================

users = pd.read_csv("identity_users.csv")
events = pd.read_csv("identity_events.csv")

print(f"Loaded {len(users)} users")
print(f"Loaded {len(events)} events")

# =====================================================
# EVENT FEATURE ENGINEERING
# =====================================================

event_features = (
    events.groupby("user_id")
    .agg(
        total_events=("user_id", "count"),
        high_sensitivity_access=(
            "resource_sensitivity",
            lambda x: (x == "high").sum()
        ),
        failed_logins=(
            "status",
            lambda x: (x == "failure").sum()
        ),
        night_events=(
            "time_classification",
            lambda x: x.isin(["night", "unusual_hours"]).sum()
        ),
        weekend_events=(
            "time_classification",
            lambda x: x.isin(["weekend", "week_end"]).sum()
        ),
        admin_operations=(
            "action",
            lambda x: (
                x.astype(str).str.contains("admin", case=False, na=False)
            ).sum()
        )
    )
    .reset_index()
)

users = users.merge(event_features, on="user_id", how="left")
users.fillna(0, inplace=True)

# =====================================================
# PRIVILEGE WEIGHTS & CONFIGURATIONS
# =====================================================

PRIVILEGE_SCORES = {
    "user": 10,
    "power-user": 25,
    "admin": 40
}


# =====================================================
# RISK ENGINE FUNCTIONS
# =====================================================

def calculate_raw_score(row):
    score = 0
    days = row["days_inactive"]
    privilege = str(row["privilege_level"]).lower()

    # Inactivity score
    score += min(days * 0.7, 40)

    # Privilege score
    score += PRIVILEGE_SCORES.get(privilege, 10)

    # Stale admin bonus
    if privilege == "admin" and days > 30:
        score += 25

    # Breadth of access
    systems = str(row.get("systems_access", ""))
    system_count = len([s for s in systems.split("|") if s.strip()])
    score += min(system_count * 2, 15)

    # Service account check
    username = str(row["username"]).lower()
    service_keywords = ["svc", "service", "bot", "system", "automation"]
    if any(x in username for x in service_keywords):
        score += 15

    # Behavioral signals (capped to avoid inflation)
    score += min(row["high_sensitivity_access"] * 4, 20)
    score += min(row["failed_logins"] * 5, 15)
    score += min(row["night_events"] * 3, 15)
    score += min(row["weekend_events"] * 2, 10)
    score += min(row["admin_operations"] * 5, 20)

    # Executive exception
    role = str(row.get("job_title", "")).lower()
    if any(x in role for x in ["cto", "ciso", "chief"]):
        score -= 10

    return max(score, 0)


def generate_findings(row):
    findings = []
    
    if row["days_inactive"] > 30:
        findings.append("STALE_ACCOUNT")
    if str(row["privilege_level"]).lower() == "admin":
        findings.append("ADMIN_PRIVILEGES")
    if row["high_sensitivity_access"] > 0:
        findings.append("SENSITIVE_ACCESS")
    if row["failed_logins"] > 0:
        findings.append("FAILED_LOGINS")
    if row["night_events"] > 0:
        findings.append("AFTER_HOURS_ACTIVITY")
    if row["admin_operations"] > 0:
        findings.append("PRIVILEGE_MODIFICATION")
        
    return ", ".join(findings)


def calculate_confidence(row):
    confidence = 0
    
    if row["days_inactive"] > 30:
        confidence += 20
    if row["high_sensitivity_access"] > 0:
        confidence += 25
    if row["failed_logins"] > 0:
        confidence += 15
    if row["night_events"] > 0:
        confidence += 20
    if row["admin_operations"] > 0:
        confidence += 20
        
    return round(confidence / 100, 2)


def generate_recommendations(row):
    actions = []
    findings = row["findings"]

    if "STALE_ACCOUNT" in findings:
        actions.append("Disable or review inactive account")
    if "ADMIN_PRIVILEGES" in findings:
        actions.append("Review privileged access assignments")
    if "SENSITIVE_ACCESS" in findings:
        actions.append("Validate access to critical resources")
    if "FAILED_LOGINS" in findings:
        actions.append("Reset password and investigate")
    if "AFTER_HOURS_ACTIVITY" in findings:
        actions.append("Verify after-hours access")
    if "PRIVILEGE_MODIFICATION" in findings:
        actions.append("Audit privilege changes")

    return " | ".join(actions)


def generate_explanation(row):
    return (
        f"This account is classified as {row['risk_level']} risk. "
        f"Indicators include {row['findings']}. "
        f"Recommended actions: {row['recommendations']}."
    )


def map_risk_level(score):
    if score >= 85:
        return "CRITICAL"
    elif score >= 70:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    return "LOW"


# =====================================================
# PIPELINE EXECUTION & ENRICHMENT
# =====================================================

# Compute and scale user risk scores
users["raw_score"] = users.apply(calculate_raw_score, axis=1)

scaler = MinMaxScaler(feature_range=(0, 100))
users["risk_score"] = scaler.fit_transform(users[["raw_score"]])
users["risk_score"] = users["risk_score"].round(2)
users["risk_level"] = users["risk_score"].apply(map_risk_level)

# Generate contextual risk tracking data
users["findings"] = users.apply(generate_findings, axis=1)
users["confidence"] = users.apply(calculate_confidence, axis=1)
users["recommendations"] = users.apply(generate_recommendations, axis=1)
users["explanation"] = users.apply(generate_explanation, axis=1)

# Sort dataset pipeline-wide
users = users.sort_values(by="risk_score", ascending=False)
users.to_csv("risk_scored_users.csv", index=False)


# =====================================================
# DISPLAY OUTPUTS
# =====================================================

print("\n========== TOP 20 RISKS ==========\n")
print(users[["user_id", "username", "risk_score", "risk_level", "confidence"]].head(20))

print("\n========== TOP 10 FINDINGS ==========\n")
for _, row in users.head(10).iterrows():
    print(f"{row['user_id']} | {row['risk_score']} | {row['risk_level']}")
    print(f"Confidence: {row['confidence']}")
    print(f"Findings: {row['findings']}")
    print(f"Recommendations: {row['recommendations']}")
    print("-" * 80)

print("\n========== RISK DISTRIBUTION ==========\n")
print(users["risk_level"].value_counts())
print("\nSaved -> risk_scored_users.csv")