import ast
import json
import pandas as pd

# =====================================
# LOAD DATA
# =====================================

users = pd.read_csv("risk_scored_users.csv")
events = pd.read_csv("event_anomalies.csv")

print(f"Loaded {len(users)} scored users")
print(f"Loaded {len(events)} anomalies")

# =====================================
# EVENT AGGREGATION & FINDINGS PARSING
# =====================================

event_summary = (
    events.groupby("user_id")
    .agg(
        total_anomalies=("user_id", "count"),
        event_risk_score=("rule_score", "sum")
    )
    .reset_index()
)

findings_map = {}
for _, row in events.iterrows():
    uid = row["user_id"]
    findings = row["findings"]

    if uid not in findings_map:
        findings_map[uid] = set()

    if isinstance(findings, str):
        try:
            parsed = ast.literal_eval(findings)
            if isinstance(parsed, list):
                for item in parsed:
                    findings_map[uid].add(item)
            else:
                findings_map[uid].add(findings)
        except (ValueError, SyntaxError):
            findings_map[uid].add(findings)

# =====================================
# MERGE & SCORE PIPELINE
# =====================================

alerts = users.merge(event_summary, on="user_id", how="left")
alerts.fillna({"event_risk_score": 0, "total_anomalies": 0}, inplace=True)

# Normalize event scores and compute the combined weighted matrix
max_event = alerts["event_risk_score"].max()
alerts["event_score_normalized"] = (
    (alerts["event_risk_score"] / max_event) * 100 if max_event > 0 else 0
)

alerts["combined_score"] = (
    alerts["risk_score"] * 0.6 +
    alerts["event_score_normalized"] * 0.4
).round(2)


# =====================================
# PRIORITY CALCULATION
# =====================================

def calculate_priority_level(score):
    if score >= 90:
        return "P1"
    elif score >= 75:
        return "P2"
    elif score >= 50:
        return "P3"
    return "P4"


# Assign priority levels directly to the DataFrame before JSON construction
alerts["priority"] = alerts["combined_score"].apply(calculate_priority_level)

# =====================================
# BUILD JSON PAYLOAD
# =====================================

output = []
for _, row in alerts.iterrows():
    uid = row["user_id"]
    
    output.append({
        "user_id": uid,
        "username": row["username"],
        "risk_score": float(row["risk_score"]),
        "event_risk_score": float(row["event_risk_score"]),
        "combined_score": float(row["combined_score"]),
        "risk_level": row["risk_level"],
        "priority": row["priority"],
        "total_anomalies": int(row["total_anomalies"]),
        "confidence": float(row["confidence"]),
        "findings": list(findings_map.get(uid, [])),
        "recommendations": row.get("recommendations", ""),
        "explanation": row.get("explanation", "")
    })

# Sort structural array list by combined tracking matrix
output = sorted(output, key=lambda x: x["combined_score"], reverse=True)

# =====================================
# SAVE & PREVIEW
# =====================================

with open("alerts.json", "w") as f:
    json.dump(output, f, indent=4)

print("\n========== TOP 10 ALERTS ==========\n")
for alert in output[:10]:
    print(
        f"{alert['user_id']} | "
        f"{alert['username']} | "
        f"{alert['combined_score']} | "
        f"{alert['priority']}"
    )

print("\nSaved -> alerts.json")