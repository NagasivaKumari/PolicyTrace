import re

RULES = [
    {
        "type": "data_sharing",
        "patterns": [r"share (your|user) data", r"third[- ]party (partners|services|providers)", r"affiliates and subsidiaries", r"business partners", r"advertising partners", r"marketing partners", r"we may disclose", r"we may transfer your data", r"for business purposes", r"for commercial purposes"],
        "severity": "high",
        "message": "Your data may be shared with external companies"
    },
    {
        "type": "consent",
        "patterns": [r"by using (this|our) (service|app|website), you agree", r"you consent to", r"you acknowledge and agree", r"continued use means acceptance", r"we may use your data", r"we reserve the right"],
        "severity": "high",
        "message": "You may not have explicit control over how your data is used"
    },
    {
        "type": "retention",
        "patterns": [r"retain.*as long as necessary", r"retain.*for business purposes", r"retain.*to comply with legal obligations", r"no fixed retention period", r"we may store.*indefinitely", r"as long as your account is active"],
        "severity": "high",
        "message": "No clear limit on how long your data is stored"
    },
    {
        "type": "tracking",
        "patterns": [r"track (your|user) activity", r"collect usage data", r"behavioral data", r"analytics tools", r"cookies and similar technologies", r"device information", r"ip address", r"location data", r"unique identifiers", r"advertising identifiers"],
        "severity": "medium",
        "message": "Your behavior and activity may be tracked continuously"
    },
    {
        "type": "monetization",
        "patterns": [r"sell.*data", r"monetize.*data", r"share.*for advertising", r"targeted advertising", r"personalized ads", r"commercial use of data"],
        "severity": "high",
        "message": "Your data is being monetized or sold"
    },
    {
        "type": "user_control",
        "patterns": [r"may deny your request", r"subject to legal obligations", r"subject to exceptions", r"we may not be able to delete", r"restricted rights", r"limited access"],
        "severity": "medium",
        "message": "You may not have full control over your data"
    },
    {
        "type": "automation",
        "patterns": [r"automated decision", r"profiling", r"algorithmic processing", r"personalization engine", r"recommendation systems"],
        "severity": "medium",
        "message": "AI or automated systems are making decisions about you"
    },
    {
        "type": "sensitive_data",
        "patterns": [r"precise location", r"contacts", r"biometric", r"financial information", r"payment data", r"government id", r"aadhaar", r"pan card"],
        "severity": "high",
        "message": "Highly sensitive personal data may be collected"
    },
    {
        "type": "children",
        "patterns": [r"children under", r"under the age of", r"parental consent", r"minor"],
        "severity": "medium",
        "message": "Practices regarding children's data are flagged"
    },
    {
        "type": "refunds",
        "patterns": [r"no refunds", r"non-refundable", r"unilateral cancellation", r"return window", r"within 7 days", r"no returns", r"restocking fee", r"shipping costs for returns"],
        "severity": "high",
        "message": "Refund or cancellation policies may be restrictive or unfair"
    },
    {
        "type": "governance",
        "patterns": [r"governing law", r"exclusive jurisdiction", r"arbitration clause", r"waive jury trial", r"limitation of liability", r"class action waiver", r"disclaim all warranties"],
        "severity": "medium",
        "message": "Complex legal governance or liability limits detected"
    }
]

SCORES = {
    "high": 25,
    "medium": 15,
    "low": 5
}

class DPDPClassifier:
    def __init__(self):
        pass

    def classify_clause(self, clause: str) -> list[dict]:
        """Returns list of violations found in a clause using regex rules."""
        results = []
        for rule in RULES:
            for pattern in rule["patterns"]:
                if re.search(pattern, clause, re.IGNORECASE):
                    results.append({
                        "dpdp_section": rule["type"],
                        "severity": rule["severity"],
                        "explanation": rule["message"],
                        "excerpt": clause,
                        "recommendation": f"Ensure transparency regarding {rule['type'].replace('_', ' ')}."
                    })
                    break  # Hit one pattern per rule per clause
        return results

    def analyze(self, policy_text: str, historical_context: str = "") -> dict:
        """Full policy analysis with optional historical comparison."""
        # Simple clause splitting
        clauses = [p.strip() for p in policy_text.split('\n\n') if len(p.strip()) > 50]
        
        all_violations = []
        seen_types = set()

        for clause in clauses:
            violations = self.classify_clause(clause)
            for v in violations:
                if v["dpdp_section"] not in seen_types:
                    seen_types.add(v["dpdp_section"])
                    all_violations.append({
                        "clause_text": clause[:500],
                        "excerpt": clause[:150].strip() + "...",
                        "dpdp_section": v["dpdp_section"],
                        "severity": v["severity"],
                        "explanation": v["explanation"],
                        "recommendation": v["recommendation"]
                    })

        # Calculate score
        raw_score = sum(SCORES[v["severity"]] for v in all_violations)
        risk_score = min(raw_score, 100)
        risk_level = "low" if risk_score <= 33 else "medium" if risk_score <= 66 else "high"

        # Generate Historical Insights if memory exists
        historical_insights = []
        if historical_context:
            # Logic: If we found new 'high' severity risks that weren't in memory
            for v in all_violations:
                if v["severity"] == "high" and v["dpdp_section"].lower() not in historical_context.lower():
                    historical_insights.append({
                        "type": "regression",
                        "message": f"Critical Change: New '{v['dpdp_section'].replace('_', ' ')}' vulnerability detected since last scan."
                    })
            if not historical_insights:
                historical_insights.append({
                    "type": "stable",
                    "message": "Compliance Status: No significant regressions found since last memory anchor."
                })

        # Section scores (including new consumer protection categories)
        section_scores = [
            {"section": "consent", "label": "Consent", "score": 100 if "consent" not in seen_types else 20},
            {"section": "data_sharing", "label": "Data Sharing", "score": 100 if "data_sharing" not in seen_types else 15},
            {"section": "retention", "label": "Data Retention", "score": 100 if "retention" not in seen_types else 30},
            {"section": "user_rights", "label": "Consumer Rights", "score": 100 if "refunds" not in seen_types else 40},
            {"section": "governance", "label": "Term Governance", "score": 100 if "governance" not in seen_types else 55},
            {"section": "children", "label": "Children Data", "score": 100 if "children" not in seen_types else 50},
        ]

        return {
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "total_violations": len(all_violations),
            "flagged_clauses": all_violations,
            "section_scores": section_scores,
            "historical_insights": historical_insights
        }
