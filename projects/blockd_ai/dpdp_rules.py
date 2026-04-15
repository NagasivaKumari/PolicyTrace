DPDP_SECTIONS = {
    "section_5": {
        "title": "Data Minimisation",
        "description": "Data collected must be limited to what is necessary",
        "violation_patterns": [
            "collects data beyond stated purpose",
            "shares location with advertisers",
            "stores data indefinitely",
            "retains data after account deletion",
            "collects device identifiers unnecessarily",
        ]
    },
    "section_6": {
        "title": "Consent",
        "description": "Clear, specific, informed, and unambiguous consent required",
        "violation_patterns": [
            "pre-ticked checkboxes",
            "bundled consent",
            "no opt-out mechanism",
            "vague consent language",
            "consent implied by continued use",
        ]
    },
    "section_8": {
        "title": "Obligations of Data Fiduciaries",
        "description": "Data fiduciary must maintain accuracy, security, and grievance mechanisms",
        "violation_patterns": [
            "no data protection officer listed",
            "no grievance redressal mechanism",
            "no breach notification commitment",
            "no data accuracy obligations",
            "no security safeguard description",
        ]
    },
    "section_9": {
        "title": "Processing Children's Data",
        "description": "Special protections for data of minors under 18",
        "violation_patterns": [
            "no age verification mechanism",
            "collects data from minors without parental consent",
            "shares children's data with third parties",
            "behavioural tracking of minors",
            "targeted advertising to children",
        ]
    }
}

SECTION_WEIGHTS = {
    "section_5": 0.30,
    "section_6": 0.35,
    "section_8": 0.20,
    "section_9": 0.15,
}
