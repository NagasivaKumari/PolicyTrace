import re
import logging

logger = logging.getLogger(__name__)

CATEGORY_WEIGHTS = {
    "consent": 0.25,
    "security": 0.20,
    "user_rights": 0.15,
    "purpose_limitation": 0.15,
    "transparency": 0.10,
    "data_minimization": 0.10,
    "children_data": 0.05
}

SEVERITY_MAP = {
    "critical": 1.0,
    "high": 0.75,
    "medium": 0.5,
    "low": 0.25
}

DPDP_SECTION_LINKS = {
    "Section 6 (Consent)": "https://dpdpa.com/section-6/",
    "Section 8 (Duties of Data Fiduciary)": "https://dpdpa.com/section-8/",
    "Section 11 (Right to Erasure)": "https://dpdpa.com/section-11/",
    "Section 4 (Notice)": "https://dpdpa.com/section-4/"
}

def get_risk_level(score: float) -> str:
    if score <= 20:
        return "low"
    if score <= 40:
        return "moderate"
    if score <= 60:
        return "high"
    if score <= 80:
        return "very_high"
    return "critical"

def calculate_section_score(violations: list[dict]) -> float:
    if not violations:
        return 0.0
    total = 0.0
    for v in violations:
        severity_value = SEVERITY_MAP.get(v.get("severity", "low"), 0.25)
        confidence = float(v.get("confidence", 0.5))
        total += severity_value * confidence
    max_possible = len(violations) * 1.0
    return total / max_possible if max_possible > 0 else 0.0

def calculate_risk_score(violations: list[dict], coverage_score: float) -> tuple[float, list[dict]]:
    grouped: dict[str, list[dict]] = {k: [] for k in CATEGORY_WEIGHTS.keys()}
    for v in violations:
        category = v.get("category")
        if category in grouped:
            grouped[category].append(v)

    final_score = 0.0
    section_scores = []
    for category, weight in CATEGORY_WEIGHTS.items():
        section_violations = grouped.get(category, [])
        section_score = calculate_section_score(section_violations)
        weighted_score = section_score * weight
        final_score += weighted_score
        section_scores.append({
            "section": category,
            "score": round(section_score * 100, 2),
            "weight": weight
        })

    base_score = final_score * 100
    coverage_penalty = (1 - min(max(coverage_score, 0.0), 1.0)) * 20
    risk_score = round(min(100.0, base_score + coverage_penalty), 2)
    return risk_score, section_scores

def analyze_policy(text: str, policy_url: str = ""):
    """
    Institutional Audit Engine: Extracts structured privacy insights 
    based on DPDP (Digital Personal Data Protection) Act principles.
    """
    if not text:
        return {
            "risk_score": 95,
            "risk_level": "critical",
            "data_collected": [],
            "data_shared_with": [],
            "user_rights": [],
            "total_violations": 1,
            "violations": [{
                "category": "transparency",
                "severity": "critical",
                "confidence": 0.9,
                "impact": 0.9,
                "evidence": "Policy document missing or inaccessible.",
                "section": "unknown",
                "explanation": "No policy content could be retrieved for analysis."
            }],
            "flagged_clauses": [
                {
                    "dpdp_section": "transparency",
                    "severity": "critical",
                    "message": "Missing Policy Document",
                    "excerpt": "Policy document missing or inaccessible.",
                    "explanation": "No policy content could be retrieved for analysis.",
                    "confidence": 0.9,
                    "source_url": policy_url
                }
            ],
            "section_scores": []
        }

    text_lower = text.lower()

    def extract_section_title(evidence: str) -> str:
        if not evidence:
            return "General Policy"
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        if not lines:
            return "General Policy"
        evidence_lower = evidence.lower()
        line_index = -1
        for i, line in enumerate(lines):
            if evidence_lower in line.lower():
                line_index = i
                break
        if line_index == -1:
            return "General Policy"

        keywords = ["privacy", "data", "information", "rights", "security", "sharing", "retention", "cookies", "consent"]
        for j in range(max(0, line_index - 5), line_index)[::-1]:
            candidate = lines[j]
            if len(candidate) <= 80 and (candidate.endswith(":") or any(k in candidate.lower() for k in keywords)):
                return candidate.rstrip(":")
        return "General Policy"

    def extract_categories_with_evidence(keywords):
        found = []
        # Split text into sentences for better context extraction
        sentences = [s.strip() for s in re.split(r'[.!?\n]', text) if len(s.strip()) > 10]
        
        for key, patterns in keywords.items():
            for p in patterns:
                # Find the exact sentence containing the evidence
                for sentence in sentences:
                    if re.search(r'\b' + p + r'\b', sentence.lower()):
                        found.append({
                            "category": key,
                            "excerpt": sentence[:300] + ("..." if len(sentence) > 300 else ""),
                            "trust_level": 10
                        })
                        break
                else:
                    # Fallback if no clean sentence found
                    if re.search(r'\b' + p + r'\b', text_lower):
                        found.append({
                            "category": key,
                            "excerpt": f"Directly identified via pattern '{p}' in legal dossier.",
                            "trust_level": 7
                        })
                
                # If we found evidence for this primary key, move to next key
                if any(f["category"] == key for f in found):
                    break
                    
        return found

    # 1. Data Collection Insights
    collection_map = {
        "Email Address": ["email", "e-mail"],
        "Phone Number": ["phone", "mobile", "contact number"],
        "Precise Location": ["gps", "location", "geolocation", "coordinates"],
        "Device Identifiers": ["device id", "imei", "advertising id", "device info"],
        "Browsing History": ["cookies", "browsing", "usage history", "pixel"],
        "Biometric Data": ["biometric", "fingerprint", "faceid", "facial"],
        "Financial Info": ["credit card", "payment", "bank account", "transaction"]
    }
    data_collected = extract_categories_with_evidence(collection_map)

    # 2. Third-Party Exposure
    sharing_map = {
        "Advertisers": ["advertising", "markers", "ad networks"],
        "Analytics Providers": ["analytics", "google analytics", "mixpanel"],
        "Government/Legal": ["law enforcement", "government", "legal request"],
        "Affiliates": ["affiliates", "subsidiaries", "parent company"]
    }
    data_shared = extract_categories_with_evidence(sharing_map)

    # 3. User Empowerment (Rights)
    rights_map = {
        "Data Deletion": ["delete", "erase", "erasure", "removal"],
        "Data Access": ["access", "request copy", "portability"],
        "Consent Withdrawal": ["withdraw", "opt-out", "unsubscribe"],
        "Correction": ["correct", "rectify", "update info"]
    }
    user_rights_raw = extract_categories_with_evidence(rights_map)
    user_rights = [r["category"] for r in user_rights_raw]

    # 4. Critical Risk Flagging
    risks = []
    if "third party" in text_lower and "consent" not in text_lower:
        risks.append("Third-party sharing detected without explicit consent mention.")
    
    if "retain" in text_lower and "period" not in text_lower:
        risks.append("Indefinite data retention: No clear storage period mentioned.")
        
    if not any(r in ["Data Deletion", "Consent Withdrawal"] for r in user_rights):
        risks.append("Lock-in Risk: No clear mechanism to delete data or withdraw consent.")

    if data_shared and not user_rights:
        risks.append("Exposure Risk: Data shared extensively but user has no control rights.")

    violations = []

    def add_violation(category: str, severity: str, confidence: float, evidence: str, section: str, explanation: str, dpdp_sections: list[str]):
        impact = SEVERITY_MAP.get(severity, 0.25) * confidence
        section_title = extract_section_title(evidence)
        violations.append({
            "category": category,
            "severity": severity,
            "confidence": round(confidence, 2),
            "impact": round(impact, 2),
            "evidence": evidence,
            "section": section,
            "section_title": section_title,
            "explanation": explanation,
            "dpdp_sections": dpdp_sections,
            "section_links": {s: DPDP_SECTION_LINKS.get(s, "") for s in dpdp_sections},
            "source_url": policy_url
        })

    for risk in risks:
        if "consent" in risk.lower():
            add_violation(
                "consent",
                "high",
                0.7,
                "No explicit consent language found near third-party sharing mention.",
                "sharing",
                risk,
                [
                    "Section 6 (Consent)",
                    "Section 4 (Notice)"
                ]
            )
        elif "retention" in risk.lower():
            add_violation(
                "transparency",
                "medium",
                0.6,
                "Retention period not clearly disclosed.",
                "retention",
                risk,
                [
                    "Section 8 (Duties of Data Fiduciary)",
                    "Section 11 (Right to Erasure)"
                ]
            )
        elif "lock-in" in risk.lower():
            add_violation(
                "user_rights",
                "medium",
                0.6,
                "No clear deletion or consent withdrawal clause detected.",
                "rights",
                risk,
                [
                    "Section 6 (Consent)",
                    "Section 8 (Duties of Data Fiduciary)",
                    "Section 11 (Right to Erasure)"
                ]
            )
        else:
            add_violation(
                "transparency",
                "low",
                0.5,
                "General risk detected in policy text.",
                "general",
                risk,
                [
                    "Section 4 (Notice)"
                ]
            )

    categories_detected = set()
    for v in violations:
        categories_detected.add(v["category"])
    if user_rights:
        categories_detected.add("user_rights")
    if data_shared:
        categories_detected.add("transparency")
    if data_collected:
        categories_detected.add("data_minimization")

    coverage_score = len(categories_detected) / max(len(CATEGORY_WEIGHTS), 1)
    risk_score, section_scores = calculate_risk_score(violations, coverage_score)

    flagged_clauses = []
    for v in violations:
        flagged_clauses.append({
            "dpdp_section": v["category"],
            "severity": v["severity"],
            "message": v["explanation"],
            "excerpt": v["evidence"],
            "explanation": v["explanation"],
            "confidence": v["confidence"],
            "dpdp_sections": v.get("dpdp_sections", []),
            "section_links": v.get("section_links", {}),
            "source_url": v.get("source_url", ""),
            "section_title": v.get("section_title", "General Policy")
        })

    return {
        "risk_score": risk_score,
        "risk_level": get_risk_level(risk_score),
        "total_violations": len(violations),
        "violations": violations,
        "data_collected": data_collected,
        "data_shared_with": data_shared,
        "user_rights": user_rights,
        "user_rights_evidence": user_rights_raw,
        "flagged_clauses": flagged_clauses,
        "section_scores": section_scores
    }
