import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# =====================================================================
# 1. LOAD DATA
# =====================================================================
users = pd.read_csv("identity_users.csv")
events = pd.read_csv("identity_events.csv")

print(f"Loaded {len(users)} users")
print(f"Loaded {len(events)} events")

# =====================================================================
# 2. EVENT FEATURES ENGINE
# =====================================================================
event_features = (
    events.groupby("user_id")
    .agg(
        total_events=("user_id", "count"),
        high_sensitivity_access=("resource_sensitivity", lambda x: (x == "high").sum()),
        failed_logins=("status", lambda x: (x == "failure").sum()),
        night_events=("time_classification", lambda x: x.isin(["night", "unusual_hours"]).sum()),
        weekend_events=("time_classification", lambda x: x.isin(["weekend", "week_end"]).sum()),
        admin_operations=("action", lambda x: x.astype(str).str.contains("admin", case=False, na=False).sum()),
    )
    .reset_index()
)

# Merge behavioral features back to core user profiles
users = users.merge(event_features, on="user_id", how="left")
users.fillna(0, inplace=True)

# =====================================================================
# 3. RISK SCORING MECHANISM
# =====================================================================
PRIVILEGE_SCORES = {"user": 10, "power-user": 25, "admin": 40}


def calculate_raw_score(row):
    score = 0
    days = row["days_inactive"]
    privilege = str(row["privilege_level"]).lower()

    # Inactivity assessment
    if days < 7:
        score += 0
    elif days < 30:
        score += 10
    elif days < 60:
        score += 25
    else:
        score += 40

    # Privilege level weight
    score += PRIVILEGE_SCORES.get(privilege, 0)

    # Stale administrator risk
    if privilege == "admin" and days > 30:
        score += 25

    # System access breadth (Max 15 points)
    systems = str(row.get("systems_access", ""))
    system_count = len([s for s in systems.split("|") if s.strip()])
    score += min(system_count * 2, 15)

    # Service / Automation account check
    username = str(row["username"]).lower()
    if any(x in username for x in ["svc", "service", "bot", "system", "automation"]):
        score += 15

    # Behavioral anomalies
    score += row["high_sensitivity_access"] * 8
    score += row["failed_logins"] * 6
    score += row["night_events"] * 5
    score += row["weekend_events"] * 3
    score += row["admin_operations"] * 10

    # Executive protection exception (Risk reduction)
    role = str(row.get("job_title", "")).lower()
    if any(x in role for x in ["cto", "ciso", "chief"]):
        score -= 10

    return max(score, 0)


def get_risk_level(score):
    if score >= 90:
        return "CRITICAL"
    elif score >= 70:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    return "LOW"


# =====================================================================
# 4. FINDINGS & CONTEXT GENERATION
# =====================================================================
def generate_findings(row):
    f = []
    if row["days_inactive"] > 30:
        f.append("STALE_ACCOUNT")
    if str(row["privilege_level"]).lower() == "admin":
        f.append("ADMIN_PRIVILEGES")
    if row["high_sensitivity_access"] > 0:
        f.append("SENSITIVE_ACCESS")
    if row["failed_logins"] > 0:
        f.append("FAILED_LOGINS")
    if row["night_events"] > 0:
        f.append("AFTER_HOURS_ACTIVITY")
    if row["admin_operations"] > 0:
        f.append("PRIVILEGE_MODIFICATION")
    return ", ".join(f)


def calculate_confidence(row):
    weights = 0
    if row["days_inactive"] > 30:
        weights += 20
    if row["high_sensitivity_access"] > 0:
        weights += 25
    if row["failed_logins"] > 0:
        weights += 15
    if row["night_events"] > 0:
        weights += 20
    if row["admin_operations"] > 0:
        weights += 20
    return round(weights / 100, 2)


def generate_recommendations(row):
    actions = []
    findings_text = row["findings"]

    if "STALE_ACCOUNT" in findings_text:
        actions.append("Review account status and disable if inactive")
    if "ADMIN_PRIVILEGES" in findings_text:
        actions.append("Audit privileged access assignments")
    if "SENSITIVE_ACCESS" in findings_text:
        actions.append("Review access to sensitive resources")
    if "FAILED_LOGINS" in findings_text:
        actions.append("Force password reset and investigate login attempts")
    if "AFTER_HOURS_ACTIVITY" in findings_text:
        actions.append("Verify legitimacy of after-hours access")
    if "PRIVILEGE_MODIFICATION" in findings_text:
        actions.append("Review recent privilege changes")

    return " | ".join(actions)


def generate_explanation(row):
    return (
        f"This account is classified as {row['risk_level']} risk. "
        f"Risk indicators detected include: {row['findings']}. "
        f"The account should be reviewed by the security team "
        f"to validate business justification and ensure least-privilege access."
    )


# =====================================================================
# 5. PIPELINE EXECUTION
# =====================================================================
# Compute scores
users["raw_score"] = users.apply(calculate_raw_score, axis=1)

# Normalize scores to 0-100 range
scaler = MinMaxScaler(feature_range=(0, 100))
users["risk_score"] = scaler.fit_transform(users[["raw_score"]]).round(2)

# Categorize and context map (Order optimized to prevent KeyErrors)
users["risk_level"] = users["risk_score"].apply(get_risk_level)
users["confidence"] = users.apply(calculate_confidence, axis=1)
users["findings"] = users.apply(generate_findings, axis=1)
users["recommendations"] = users.apply(generate_recommendations, axis=1)
users["explanation"] = users.apply(generate_explanation, axis=1)

# Sort from highest risk to lowest
users = users.sort_values(by="risk_score", ascending=False)

# Save results
users.to_csv("risk_scored_users.csv", index=False)

# =====================================================================
# 6. REPORTING & DASHBOARD
# =====================================================================
print("\nTOP 20 RISKS\n")
print(users[["user_id", "username", "risk_score", "risk_level", "confidence"]].head(20))

print("\nTOP 10 FINDINGS\n")
for _, row in users.head(10).iterrows():
    print("=" * 80)
    print(f"User: {row['user_id']} ({row['username']})")
    print(f"Risk Score: {row['risk_score']} | Risk Level: {row['risk_level']}")
    print(f"Confidence: {row['confidence']}")
    print(f"Findings: {row['findings']}")
    print(f"Recommendations: {row['recommendations']}")
    print(f"Explanation: {row['explanation']}")
    print("=" * 80)

print("\nRISK DISTRIBUTION\n")
print(users["risk_level"].value_counts())

print("\nSaved -> risk_scored_users.csv")