import json

with open("alerts.json") as f:
    alerts = json.load(f)

with open("feedback.json") as f:
    feedback = json.load(f)

verified = {
    x["user_id"]
    for x in feedback
    if x["label"] == "true_positive"
}

reviewed_alerts = [
    a for a in alerts
    if a["user_id"] in verified
]

tp = len(reviewed_alerts)

precision = tp / len(reviewed_alerts)

print("Reviewed Alerts:", len(reviewed_alerts))
print("True Positives :", tp)
print("Precision:", round(precision * 100, 2), "%")