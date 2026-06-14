import json

# ==========================
# LOAD ALERTS
# ==========================

with open("alerts.json", "r") as f:
    alerts = json.load(f)

# ==========================
# EXPLANATION RULES
# ==========================

EXPLANATIONS = {
    "NIGHT_SENSITIVE_ACCESS":
        "accessed sensitive resources during non-business hours",

    "OFF_HOURS_DATA_EXPORT":
        "performed data exports outside approved operating windows",

    "SENSITIVE_DATA_EXPORT":
        "exported information from high-value systems",

    "WEEKEND_ADMIN_OPERATION":
        "executed privileged administrative actions during weekends",

    "FAILED_ADMIN_ACTIVITY":
        "generated failed privileged authentication attempts"
}

RECOMMENDATIONS = {
    "NIGHT_SENSITIVE_ACCESS":
        "verify business justification for after-hours access",

    "OFF_HOURS_DATA_EXPORT":
        "review exported data and confirm legitimacy",

    "SENSITIVE_DATA_EXPORT":
        "audit access to sensitive resources",

    "WEEKEND_ADMIN_OPERATION":
        "review recent privilege changes and approvals",

    "FAILED_ADMIN_ACTIVITY":
        "force password reset and investigate authentication activity"
}

# ==========================
# BUILD NARRATIVES
# ==========================

for alert in alerts:

    findings = alert.get(
        "findings",
        []
    )

    explanation_parts = []
    recommendation_parts = []

    for finding in findings:

        if finding in EXPLANATIONS:
            explanation_parts.append(
                EXPLANATIONS[finding]
            )

        if finding in RECOMMENDATIONS:
            recommendation_parts.append(
                RECOMMENDATIONS[finding]
            )

    if explanation_parts:

        explanation = (
            f"User {alert['username']} "
            f"triggered multiple risk indicators and "
            f"{', '.join(explanation_parts)}."
        )

    else:

        explanation = (
            f"User {alert['username']} "
            f"has elevated risk based on account posture analysis."
        )

    if recommendation_parts:

        recommendation = (
            "Recommended actions: "
            +
            "; ".join(
                set(recommendation_parts)
            )
            +
            "."
        )

    else:

        recommendation = (
            "Recommended actions: "
            "review account privileges."
        )

    alert["generated_explanation"] = explanation
    alert["generated_recommendation"] = recommendation

# ==========================
# SAVE
# ==========================

with open(
    "alerts_enriched.json",
    "w"
) as f:

    json.dump(
        alerts,
        f,
        indent=4
    )

print(
    "Saved -> alerts_enriched.json"
)