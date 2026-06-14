import pandas as pd
import json
import ast

# =====================================
# LOAD DATA
# =====================================

users = pd.read_csv("risk_scored_users.csv")
events = pd.read_csv("event_anomalies.csv")

print(f"Loaded {len(users)} scored users")
print(f"Loaded {len(events)} anomalies")

# =====================================
# EVENT AGGREGATION
# =====================================

event_summary = events.groupby("user_id").agg(
    total_anomalies=("user_id", "count"),
    event_risk_score=("rule_score", "sum")
).reset_index()

# =====================================
# COLLECT UNIQUE FINDINGS
# =====================================

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
        except:
            findings_map[uid].add(findings)

# =====================================
# MERGE
# =====================================

alerts = users.merge(event_summary, on="user_id", how="left")

alerts.fillna(
    {
        "event_risk_score": 0, 
        "total_anomalies": 0
    }, 
    inplace=True
)

# =====================================
# COMBINED SCORE
# =====================================

alerts["combined_score"] = alerts["risk_score"] + alerts["event_risk_score"] * 0.25
alerts["combined_score"] = alerts["combined_score"].round(2)

# =====================================
# PRIORITY
# =====================================

def priority(score):
    if score >= 110:
        return "P1"
    elif score >= 90:
        return "P2"
    elif score >= 60:
        return "P3"
    return "P4"

alerts["priority"] = alerts["combined_score"].apply(priority)

# =====================================
# BUILD JSON
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

# =====================================
# SORT
# =====================================

output = sorted(output, key=lambda x: x["combined_score"], reverse=True)

# =====================================
# SAVE JSON
# =====================================

with open("alerts.json", "w") as f:
    json.dump(output, f, indent=4)

# =====================================
# PREVIEW
# =====================================

print("\n========== TOP 10 ALERTS ==========\n")

for alert in output[:10]:
    print(
        f"{alert['user_id']} | "
        f"{alert['username']} | "
        f"{alert['combined_score']} | "
        f"{alert['priority']}"
    )

print("\nSaved -> alerts.json")