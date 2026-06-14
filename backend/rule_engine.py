import pandas as pd

# =====================================
# LOAD DATA
# =====================================

users = pd.read_csv("identity_users.csv")
events = pd.read_csv("identity_events.csv")

print(f"Loaded {len(users)} users")
print(f"Loaded {len(events)} events")


# =====================================
# RULE ENGINE
# =====================================

def detect_anomalies(row):
    findings = []
    score = 0

    action = str(row["action"]).lower()
    sensitivity = str(row["resource_sensitivity"]).lower()
    time_class = str(row["time_classification"]).lower()
    status = str(row["status"]).lower()

    # RULE 1: High Sensitivity + Night Access
    if sensitivity == "high" and time_class in ["night", "unusual_hours"]:
        findings.append("NIGHT_SENSITIVE_ACCESS")
        score += 40

    # RULE 2: Export Data Off Hours
    if action == "export_data" and time_class in ["night", "unusual_hours"]:
        findings.append("OFF_HOURS_DATA_EXPORT")
        score += 35

    # RULE 3: Admin Operation Weekend
    if action == "admin_operation" and time_class in ["weekend", "week_end"]:
        findings.append("WEEKEND_ADMIN_OPERATION")
        score += 30

    # RULE 4: Sensitive Export
    if action == "export_data" and sensitivity == "high":
        findings.append("SENSITIVE_DATA_EXPORT")
        score += 40

    # RULE 5: Failed Login + Admin Activity
    if status == "failure" and action == "admin_operation":
        findings.append("FAILED_ADMIN_ACTIVITY")
        score += 35

    return findings, score


# =====================================
# APPLY RULES
# =====================================

# Unpacking the tuple return from apply into two distinct series/columns
events[["findings", "rule_score"]] = events.apply(
    lambda row: pd.Series(detect_anomalies(row)), axis=1
)


# =====================================
# KEEP ONLY ANOMALIES
# =====================================

anomalies = events[events["rule_score"] > 0].copy()


# =====================================
# METRICS & ENRICHMENT
# =====================================

def calculate_severity(score):
    if score >= 70:
        return "CRITICAL"
    elif score >= 40:
        return "HIGH"
    elif score >= 20:
        return "MEDIUM"
    return "LOW"


def calculate_confidence(findings):
    return round(min(len(findings) * 0.3, 1.0), 2)


def generate_recommendation(findings):
    actions = []
    
    if "NIGHT_SENSITIVE_ACCESS" in findings:
        actions.append("Review access to sensitive resource")
    if "OFF_HOURS_DATA_EXPORT" in findings:
        actions.append("Investigate potential data exfiltration")
    if "WEEKEND_ADMIN_OPERATION" in findings:
        actions.append("Review privileged administrative activity")
    if "SENSITIVE_DATA_EXPORT" in findings:
        actions.append("Audit exported sensitive data")
    if "FAILED_ADMIN_ACTIVITY" in findings:
        actions.append("Review failed privileged access attempts")
        
    return " | ".join(actions)


def generate_explanation(row):
    findings_text = ", ".join(row["findings"])
    return (
        f"Event classified as {row['severity']} risk. "
        f"Detected indicators: {findings_text}. "
        f"Confidence score: {row['confidence']}. "
        f"Investigation recommended."
    )


# Apply metric and enrichment transformations
anomalies["severity"] = anomalies["rule_score"].apply(calculate_severity)
anomalies["confidence"] = anomalies["findings"].apply(calculate_confidence)
anomalies["recommendations"] = anomalies["findings"].apply(generate_recommendation)
anomalies["explanation"] = anomalies.apply(generate_explanation, axis=1)


# =====================================
# SORT & SAVE
# =====================================

anomalies = anomalies.sort_values(by="rule_score", ascending=False)
anomalies.to_csv("event_anomalies.csv", index=False)


# =====================================
# DISPLAY
# =====================================

print("\n========== TOP ANOMALIES ==========\n")

display_cols = [
    "timestamp", "user_id", "username", "action", 
    "resource", "rule_score", "severity", "confidence"
]
print(anomalies[display_cols].head(20))

print(f"\nTotal anomalies detected: {len(anomalies)}")
print("\nSeverity Distribution:\n")
print(anomalies["severity"].value_counts())
print("\nSaved -> event_anomalies.csv")