from flask import Flask, jsonify
from flask_cors import CORS
import csv
import json
import subprocess
import os
import sys
import time
from collections import Counter, defaultdict
from flask import send_file

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# =====================================
# PIPELINE EXECUTION
# =====================================

def run_pipeline():

    try:

        print("\n========== RUNNING PIPELINE ==========\n")

        subprocess.run(
            [sys.executable, "risk_scorer.py"],
            check=True,
            cwd=BASE_DIR
        )

        subprocess.run(
            [sys.executable, "rule_engine.py"],
            check=True,
            cwd=BASE_DIR
        )

        subprocess.run(
            [sys.executable, "alert_generator.py"],
            check=True,
            cwd=BASE_DIR
        )
        subprocess.run(
            [sys.executable, "graph.py"],
            check=True,
            cwd=BASE_DIR
        )

        if os.path.exists(
            os.path.join(BASE_DIR, "narrative_gen.py")
        ):

            subprocess.run(
                [sys.executable, "narrative_gen.py"],
                check=True,
                cwd=BASE_DIR
            )

        print(
            "\nPipeline completed successfully\n"
        )

        return True

    except Exception as e:

        print(
            f"Pipeline failed: {e}"
        )

        return False


# =====================================
# LOAD ALERTS
# =====================================

def load_alerts():
    enriched_path = os.path.join(
        BASE_DIR,
        "alerts_enriched.json"
    )

    if os.path.exists(
        enriched_path
    ):

        file_name = (
            enriched_path
        )

    else:

        file_name = (
            os.path.join(BASE_DIR, "alerts.json")
        )

    with open(
        file_name,
        "r"
    ) as f:

        return json.load(f)


def load_user_lookup():
    file_name = os.path.join(
        BASE_DIR,
        "risk_scored_users.csv"
    )

    if not os.path.exists(file_name):
        return {}

    with open(
        file_name,
        "r",
        newline=""
    ) as f:
        return {
            row.get("user_id"): row
            for row in csv.DictReader(f)
            if row.get("user_id")
        }


def load_users():
    return list(load_user_lookup().values())


def load_events():
    file_name = os.path.join(
        BASE_DIR,
        "identity_events.csv"
    )

    if not os.path.exists(file_name):
        return []

    with open(
        file_name,
        "r",
        newline=""
    ) as f:
        return list(csv.DictReader(f))


def get_joined_records():
    alerts = load_alerts()
    users = load_user_lookup()

    return [
        {
            **alert,
            **{
                "department": alert.get("department") or users.get(alert.get("user_id"), {}).get("department", "Unknown"),
                "job_title": users.get(alert.get("user_id"), {}).get("job_title", "Employee"),
                "privilege_level": users.get(alert.get("user_id"), {}).get("privilege_level", "user"),
                "systems_access": users.get(alert.get("user_id"), {}).get("systems_access", "")
            }
        }
        for alert in alerts
    ]


def split_systems(value):
    if not value:
        return []

    return [
        item.strip()
        for item in value.split("|")
        if item.strip()
    ]


def classify_behavior(alert):
    findings = set(alert.get("findings", []))

    if {
        "SENSITIVE_DATA_EXPORT",
        "OFF_HOURS_DATA_EXPORT",
        "NIGHT_SENSITIVE_ACCESS"
    } & findings:
        return "Data exfiltration pattern"

    if {
        "WEEKEND_ADMIN_OPERATION",
        "PRIVILEGE_MODIFICATION"
    } & findings:
        return "Privilege misuse pattern"

    if {
        "FAILED_LOGINS",
        "AFTER_HOURS_ACTIVITY"
    } & findings:
        return "Suspicious authentication pattern"

    return "Access hygiene pattern"


def calculate_impact(alert):
    systems = split_systems(alert.get("systems_access", ""))
    sensitive_systems = [
        system
        for system in systems
        if system in {
            "PROD_DB",
            "ADMIN_SYS",
            "AWS_IAM",
            "Azure_AD",
            "SIEM",
            "GCP"
        }
    ]
    score = alert.get("combined_score", alert.get("risk_score", 0))
    multiplier = 1 + len(sensitive_systems) * 0.18
    blast_radius = min(100, round(score * multiplier, 2))

    return {
        "user_id": alert.get("user_id", ""),
        "username": alert.get("username", ""),
        "blast_radius_score": blast_radius,
        "systems_at_risk": systems[:8],
        "sensitive_systems": sensitive_systems,
        "likely_impact": (
            "Privileged data exposure and identity-plane compromise"
            if blast_radius >= 90
            else "Sensitive workflow interruption and lateral movement risk"
            if blast_radius >= 65
            else "Localized account misuse with contained system exposure"
        )
    }


# =====================================
# HEALTH CHECK
# =====================================

@app.route("/")
def home():

    return jsonify({

        "status": "running",

        "service":
            "Identity Risk Engine",

        "endpoints": [

            "/api/refresh",

            "/api/alerts",

            "/api/alerts/<user_id>",

            "/api/summary"
        ]
    })


# =====================================
# REFRESH PIPELINE
# =====================================

@app.route("/api/refresh")
def refresh():

    success = run_pipeline()

    if success:

        alerts = load_alerts()

        return jsonify({

            "status":
                "success",

            "message":
                "Pipeline refreshed",

            "alerts_generated":
                len(alerts)
        })

    return jsonify({

        "status":
            "failed"

    }), 500


# =====================================
# TOP 20 ALERTS
# =====================================

@app.route("/api/alerts")
def get_alerts():

    alerts = load_alerts()

    alerts = sorted(

        alerts,

        key=lambda x:
            x.get(
                "combined_score",
                0
            ),

        reverse=True
    )

    return jsonify(
        alerts[:20]
    )


# =====================================
# ALL ALERTS
# =====================================

@app.route("/api/alerts/all")
def get_all_alerts():

    alerts = load_alerts()

    alerts = sorted(

        alerts,

        key=lambda x:
            x.get(
                "combined_score",
                0
            ),

        reverse=True
    )

    return jsonify(
        alerts
    )


# =====================================
# SINGLE USER ALERT
# =====================================

@app.route("/api/alerts/<user_id>")
def get_alert(user_id):

    alerts = load_alerts()

    for alert in alerts:

        if (
            alert["user_id"]
            == user_id
        ):

            return jsonify(
                alert
            )

    return jsonify({

        "error":
            "User not found"

    }), 404


# =====================================
# SUMMARY
# =====================================

@app.route("/api/summary")
def summary():

    alerts = load_alerts()

    p1 = sum(
        1
        for a in alerts
        if a.get(
            "priority"
        ) == "P1"
    )

    p2 = sum(
        1
        for a in alerts
        if a.get(
            "priority"
        ) == "P2"
    )

    p3 = sum(
        1
        for a in alerts
        if a.get(
            "priority"
        ) == "P3"
    )

    p4 = sum(
        1
        for a in alerts
        if a.get(
            "priority"
        ) == "P4"
    )

    critical = sum(
        1
        for a in alerts
        if a.get(
            "risk_level"
        ) == "CRITICAL"
    )

    high = sum(
        1
        for a in alerts
        if a.get(
            "risk_level"
        ) == "HIGH"
    )

    medium = sum(
        1
        for a in alerts
        if a.get(
            "risk_level"
        ) == "MEDIUM"
    )

    low = sum(
        1
        for a in alerts
        if a.get(
            "risk_level"
        ) == "LOW"
    )

    return jsonify({

        "total_alerts":
            len(alerts),

        "priority_distribution": {

            "P1": p1,
            "P2": p2,
            "P3": p3,
            "P4": p4
        },

        "risk_distribution": {

            "CRITICAL":
                critical,

            "HIGH":
                high,

            "MEDIUM":
                medium,

            "LOW":
                low
        }
    })


# =====================================
# TOP RISKS
# =====================================

@app.route("/api/top-risks")
def top_risks():

    alerts = load_alerts()

    alerts = sorted(

        alerts,

        key=lambda x:
            x.get(
                "combined_score",
                0
            ),

        reverse=True
    )

    return jsonify(

        alerts[:10]

    )


# =====================================
# HELPER FUNCTION: Transform to RiskAccount
# =====================================

def transform_to_risk_account(alert, user_lookup=None):
    """Transform alert JSON to RiskAccount format"""
    user_lookup = user_lookup or {}
    user = user_lookup.get(alert.get("user_id"), {})
    explanation = (
        alert.get("generated_explanation")
        or alert.get("explanation")
        or "Telemetry indicates this account should be reviewed by the security team."
    )
    actions = extract_actions(
        alert.get("generated_recommendation")
        or alert.get("recommendations", "")
    )
    findings = []
    for finding_name in alert.get("findings", []):
        findings.append({
            "finding": finding_name,
            "details": build_finding_detail(finding_name, explanation),
            "severity": map_severity(alert.get("risk_level", "MEDIUM")),
            "recommendation": actions[0] if actions else "Review account immediately"
        })
    
    return {
        "user_id": alert.get("user_id", ""),
        "username": alert.get("username", ""),
        "department": alert.get("department") or user.get("department", "Unknown"),
        "role_title": alert.get("role_title") or user.get("job_title", "Employee"),
        "risk_level": alert.get("risk_level", "MEDIUM"),
        "risk_score": round(alert.get("combined_score", alert.get("risk_score", 0)), 2),
        "confidence": alert.get("confidence", 0),
        "findings": findings,
        "suggested_actions": actions,
        "next_escalation": determine_escalation(alert.get("risk_level", "MEDIUM")),
        "risk_narrative": explanation
    }


def build_finding_detail(finding_name, explanation):
    formatted_name = finding_name.replace("_", " ").lower()

    return (
        f"{formatted_name.capitalize()} was detected in backend telemetry. "
        f"{explanation}"
    )


def map_severity(risk_level):
    """Map risk_level to finding severity"""
    severity_map = {
        "CRITICAL": "CRITICAL",
        "HIGH": "HIGH",
        "MEDIUM": "MEDIUM",
        "LOW": "INFORMATIONAL"
    }
    return severity_map.get(risk_level, "INFORMATIONAL")


def extract_recommendation(recommendation_text):
    """Extract first actionable recommendation"""
    if not recommendation_text:
        return "Review account immediately"
    recommendations = recommendation_text.split(";")
    return recommendations[0].strip() if recommendations else "Review account immediately"


def extract_actions(recommendation_text):
    """Extract list of recommended actions"""
    if not recommendation_text:
        return ["Review account status", "Audit access patterns"]
    normalized_text = recommendation_text.replace(
        "Recommended actions:",
        ""
    )
    actions = normalized_text.replace(
        "|",
        ";"
    ).split(";")
    return [action.strip().capitalize() for action in actions if action.strip()][:5]


def determine_escalation(risk_level):
    """Determine escalation timeframe"""
    escalation_map = {
        "CRITICAL": "Immediate escalation required",
        "HIGH": "Within 24 hours",
        "MEDIUM": "Within 48 hours",
        "LOW": "Review within 1 week"
    }
    return escalation_map.get(risk_level, "Within 1 week")


# =====================================
# METRICS ENDPOINT
# =====================================

@app.route("/api/metrics")
def get_metrics():
    """Return dashboard metrics"""
    alerts = load_alerts()
    user_lookup = load_user_lookup()
    
    critical_count = sum(1 for a in alerts if a.get("risk_level") == "CRITICAL")
    high_count = sum(1 for a in alerts if a.get("risk_level") == "HIGH")
    medium_count = sum(1 for a in alerts if a.get("risk_level") == "MEDIUM")
    
    total_risks = critical_count + high_count + medium_count
    
    confidence_scores = [a.get("confidence", 0) for a in alerts]
    avg_precision = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    
    return jsonify({
        "total_users": len(user_lookup) or len(alerts),
        "risks_detected": total_risks,
        "avg_precision": round(avg_precision, 2),
        "critical_alerts": critical_count
    })


# =====================================
# RISKY ACCOUNTS ENDPOINT
# =====================================

@app.route("/api/risky-accounts")
def get_risky_accounts():
    """Return formatted risky accounts for frontend"""
    alerts = load_alerts()
    user_lookup = load_user_lookup()
    
    # Sort by combined_score (risk) in descending order
    sorted_alerts = sorted(
        alerts,
        key=lambda x: x.get("combined_score", 0),
        reverse=True
    )
    
    # Transform each alert to RiskAccount format
    risky_accounts = [
        transform_to_risk_account(alert, user_lookup)
        for alert in sorted_alerts
    ]
    
    return jsonify(risky_accounts)


# =====================================
# BONUS FEATURES ENDPOINT
# =====================================

@app.route("/api/bonus-insights")
def bonus_insights():
    records = get_joined_records()
    users = load_users()
    events = load_events()
    now_ms = int(time.time() * 1000)

    department_scores = defaultdict(list)
    for record in records:
        department_scores[record.get("department", "Unknown")].append(
            record.get("combined_score", record.get("risk_score", 0))
        )

    org_anomalies = []
    for department, scores in department_scores.items():
        avg_score = sum(scores) / len(scores)
        if avg_score >= 50 or len(scores) >= 8:
            org_anomalies.append({
                "department": department,
                "average_risk": round(avg_score, 2),
                "flagged_users": len(scores),
                "signal": (
                    "Department risk concentration exceeds normal access baseline"
                    if avg_score >= 50
                    else "High volume of correlated user alerts"
                )
            })

    sod_violations = []
    for user in users:
        systems = set(split_systems(user.get("systems_access", "")))
        conflicts = []

        if {"PROD_DB", "ADMIN_SYS"} <= systems:
            conflicts.append("Production database plus admin console")

        if {"Azure_AD", "Salesforce"} <= systems:
            conflicts.append("Identity administration plus business application control")

        if user.get("privilege_level") == "service-account" and user.get("job_title"):
            conflicts.append("Service account mapped to human role title")

        if conflicts:
            sod_violations.append({
                "user_id": user.get("user_id"),
                "username": user.get("username"),
                "department": user.get("department"),
                "conflicts": conflicts[:3]
            })

    system_counts = Counter()
    high_risk_counts = Counter()
    for record in records:
        systems = split_systems(record.get("systems_access", ""))
        for system in systems:
            system_counts[system] += 1
            if record.get("risk_level") in {"CRITICAL", "HIGH"}:
                high_risk_counts[system] += 1

    compliance_gaps = [
        {
            "system": system,
            "flagged_users": system_counts[system],
            "high_risk_users": high_risk_counts[system],
            "gap": (
                "Privileged review overdue"
                if high_risk_counts[system] >= 5
                else "Access attestation needed"
            )
        }
        for system in system_counts
        if high_risk_counts[system] > 0
    ]
    compliance_gaps = sorted(
        compliance_gaps,
        key=lambda item: item["high_risk_users"],
        reverse=True
    )[:8]

    dlp_actions = []
    for event in events:
        if (
            event.get("action") == "export_data"
            and event.get("resource_sensitivity") in {"high", "medium"}
        ):
            matching_record = next(
                (
                    record
                    for record in records
                    if record.get("user_id") == event.get("user_id")
                ),
                None
            )

            if matching_record and matching_record.get("risk_level") in {"CRITICAL", "HIGH", "MEDIUM"}:
                dlp_actions.append({
                    "user_id": event.get("user_id"),
                    "username": event.get("username"),
                    "resource": event.get("resource"),
                    "action": "Block export and require manager approval",
                    "risk_level": matching_record.get("risk_level")
                })

    behavior_groups = defaultdict(list)
    for record in records:
        behavior_groups[classify_behavior(record)].append(record)

    clusters = []
    for name, cluster_records in behavior_groups.items():
        top_findings = Counter()
        for record in cluster_records:
            top_findings.update(record.get("findings", []))

        clusters.append({
            "name": name,
            "count": len(cluster_records),
            "average_score": round(
                sum(
                    record.get("combined_score", record.get("risk_score", 0))
                    for record in cluster_records
                ) / len(cluster_records),
                2
            ),
            "top_findings": [
                finding
                for finding, _ in top_findings.most_common(3)
            ]
        })

    graph_nodes = []
    graph_edges = []
    top_records = sorted(
        records,
        key=lambda item: item.get("combined_score", item.get("risk_score", 0)),
        reverse=True
    )[:12]
    seen_systems = set()

    for record in top_records:
        graph_nodes.append({
            "id": record.get("user_id"),
            "label": record.get("username"),
            "type": "user",
            "risk": record.get("risk_level", "MEDIUM")
        })

        for system in split_systems(record.get("systems_access", ""))[:4]:
            if system not in seen_systems:
                seen_systems.add(system)
                graph_nodes.append({
                    "id": system,
                    "label": system,
                    "type": "system",
                    "risk": "SYSTEM"
                })

            graph_edges.append({
                "source": record.get("user_id"),
                "target": system,
                "weight": round(record.get("combined_score", 0), 2)
            })

    impacts = [
        calculate_impact(record)
        for record in top_records[:6]
    ]

    correlated_systems = []
    for system, count in system_counts.most_common(8):
        correlated_systems.append({
            "system": system,
            "linked_risks": count,
            "high_risk_users": high_risk_counts[system],
            "correlation": (
                "Identity and data-plane risk overlap"
                if high_risk_counts[system] >= 3
                else "Shared access dependency"
            )
        })

    feedback_summary = {
        "reviewed": 0,
        "false_positive_rate": 0,
        "learning_mode": "Ready for analyst corrections"
    }
    feedback_file = os.path.join(BASE_DIR, "feedback.json")
    if os.path.exists(feedback_file):
        with open(feedback_file, "r") as f:
            feedback = json.load(f)
        reviewed = len(feedback)
        false_positive = sum(1 for item in feedback if item.get("label") == "false_positive")
        feedback_summary = {
            "reviewed": reviewed,
            "false_positive_rate": round(false_positive / reviewed, 2) if reviewed else 0,
            "learning_mode": "Calibrating risk score weights from analyst feedback"
        }

    integrations = [
        {
            "provider": "Okta",
            "status": "connected" if os.getenv("OKTA_API_TOKEN") else "mock-ready",
            "signal": "Users and group assignments"
        },
        {
            "provider": "Azure AD",
            "status": "connected" if os.getenv("AZURE_CLIENT_SECRET") else "mock-ready",
            "signal": "Directory roles and sign-in risk"
        }
    ]

    return jsonify({
        "generated_at": now_ms,
        "live_alerts": [
            {
                "id": f"{record.get('user_id')}-{index}",
                "username": record.get("username"),
                "risk_level": record.get("risk_level"),
                "message": record.get("generated_explanation") or record.get("explanation"),
                "score": round(record.get("combined_score", record.get("risk_score", 0)), 2)
            }
            for index, record in enumerate(top_records[:5])
        ],
        "graph": {
            "nodes": graph_nodes,
            "edges": graph_edges[:30]
        },
        "clusters": sorted(
            clusters,
            key=lambda item: item["average_score"],
            reverse=True
        ),
        "impact_simulations": impacts,
        "feedback_summary": feedback_summary,
        "integrations": integrations,
        "org_anomalies": sorted(
            org_anomalies,
            key=lambda item: item["average_risk"],
            reverse=True
        )[:6],
        "sod_violations": sod_violations[:6],
        "compliance_gaps": compliance_gaps,
        "dlp_actions": dlp_actions[:6],
        "correlated_systems": correlated_systems
    })


@app.route("/api/feedback/<user_id>/<label>", methods=["POST"])
def save_feedback(user_id, label):
    if label not in {"true_positive", "false_positive"}:
        return jsonify({
            "error": "Label must be true_positive or false_positive"
        }), 400

    feedback_file = os.path.join(BASE_DIR, "feedback.json")
    feedback = []

    if os.path.exists(feedback_file):
        with open(feedback_file, "r") as f:
            feedback = json.load(f)

    feedback.append({
        "user_id": user_id,
        "label": label,
        "timestamp": int(time.time())
    })

    with open(feedback_file, "w") as f:
        json.dump(feedback, f, indent=2)

    return jsonify({
        "status": "saved",
        "reviewed": len(feedback)
    })

@app.route("/api/graph")
def get_graph():

    graph_path = os.path.join(
        BASE_DIR,
        "identity_graph.png"
    )

    return send_file(
        graph_path,
        mimetype="image/png"
    )



if __name__ == "__main__":

    print(
        "\nIdentity Risk Engine Started"
    )

    app.run(

        host="0.0.0.0",

        port=8000,

        debug=True
    )
