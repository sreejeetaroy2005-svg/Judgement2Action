import re
from datetime import datetime, timedelta

def sanitize_text(text):
    """Removes malformed quotes and normalizes whitespace."""
    if not isinstance(text, str):
        return text
    # Replace curly quotes with standard ones
    text = text.replace('“', '"').replace('”', '"').replace('‘', "'").replace('’', "'")
    # Remove escaped quotes if they are literal \"
    text = text.replace('\\"', '"').replace("\\'", "'")
    # Remove redundant whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def infer_deadline(raw_deadline, directive_text):
    """
    Rule-based deadline inference to avoid vague legal phrases.
    """
    if not raw_deadline or raw_deadline.lower() in ["n/a", "none", "vague", "missing"]:
        text = directive_text.lower()
        if any(word in text for word in ["immediate", "forthwith", "at once", "instanter"]):
            return "IMMEDIATE"
        if "within" in text:
            match = re.search(r'within\s+(\d+)\s+(days|weeks|months)', text)
            if match:
                return f"Within {match.group(1)} {match.group(2)} of order receipt"
        if "next date" in text or "returnable" in text:
            return "Before next date of hearing"
        return "Within statutory period (Standard 30 days)"
    
    # If it's a date or a specific period, keep it but clean it
    return raw_deadline.strip()

def map_to_administrative_task(directive_text, action_type):
    """
    Converts literal legal text into administrative actions using verbs.
    """
    text = directive_text.lower()
    
    if action_type == "APPEAL":
        return "Evaluate legal grounds for appeal and prepare memo for competent authority"
    
    if "file" in text or "affidavit" in text:
        # Better extraction for affidavit type
        aff_match = re.search(r'(\w+ affidavit)', text)
        task_name = aff_match.group(0) if aff_match else 'compliance report'
        return f"Draft, verify, and file formal {task_name} in court"
    
    if "payment" in text or "deposit" in text or "compensation" in text:
        return "Coordinate with Finance Dept to process and deposit sanctioned amount"
    
    if "presence" in text or "appear" in text:
        return "Arrange logistics and brief the concerned official for personal appearance"
    
    if "reconsider" in text or "decide" in text:
        return "Review case records and prepare reasoned order for fresh decision"
    
    if "notice" in text:
        return "Issue necessary notices to concerned parties as per court order"

    # Default administrative transformation - make it more professional
    clean_snippet = directive_text[:60].strip()
    return f"Take administrative steps for compliance: {clean_snippet}..."

def generate_action_from_signal(signal, signal_type):
    """
    Creates a structured action object based on a single legal signal.
    """
    directive = signal.get("text", "")
    responsible = signal.get("responsible_entity", "Concerned Department Head")
    
    # Urgency & Risk Logic
    is_critical = any(word in directive.lower() for word in ["contempt", "personal appearance", "arrest", "forthwith"])
    
    task = map_to_administrative_task(directive, signal_type)
    deadline = infer_deadline(signal.get("deadline"), directive)
    
    urgency_score = 9 if is_critical else (7 if "within" in directive.lower() else 4)
    risk_level = "CRITICAL" if is_critical else ("HIGH" if urgency_score > 6 else "MEDIUM")
    
    reason = "Mandatory court directive with potential contempt implications" if is_critical else "Procedural requirement to ensure legal compliance"

    return {
        "task": task,
        "type": signal_type,
        "deadline": deadline,
        "responsible_department": responsible,
        "urgency_score": urgency_score,
        "risk_level": risk_level,
        "reason": sanitize_text(reason),
        "evidence_text": sanitize_text(directive),
        "confidence": 0.92 if signal.get("text") else 0.5
    }

def validate_and_enrich_actions(extraction_data: dict):
    """
    Main entry point for rule-based action generation.
    Matches schema expectations of the frontend.
    """
    if not extraction_data:
        return {"actions": []}

    new_actions = []
    
    # 1. Process Compliance Signals
    directives = extraction_data.get("directive_sentences", [])
    if not directives and extraction_data.get("orders"):
        directives = extraction_data.get("orders")

    if extraction_data.get("compliance_required") or directives:
        for directive in directives:
            if len(directive) > 20:
                action = generate_action_from_signal({"text": sanitize_text(directive)}, "COMPLIANCE")
                # Rename for frontend compatibility
                action["department"] = action.pop("responsible_department")
                new_actions.append(action)

    # 2. Process Appeal Signals
    if extraction_data.get("appeal_possible"):
        action = generate_action_from_signal(
            {"text": "Decision allows for appeal within statutory period.", "deadline": "Statutory"}, 
            "APPEAL"
        )
        action["department"] = action.pop("responsible_department")
        new_actions.append(action)

    # 3. Process Execution Signals
    if any(word in str(extraction_data).lower() for word in ["execute", "enforce", "implement"]):
        for order in extraction_data.get("orders", []):
            if "direct" in order.lower() or "order" in order.lower():
                action = generate_action_from_signal({"text": sanitize_text(order)}, "EXECUTION")
                action["department"] = action.pop("responsible_department")
                new_actions.append(action)

    # 4. Filter & Validate
    valid_actions = []
    seen_tasks = set()
    
    for action in new_actions:
        action["task"] = sanitize_text(action["task"])
        action["evidence_text"] = sanitize_text(action["evidence_text"])
        
        if action["task"].lower() == action["evidence_text"].lower():
            continue
        if not action["evidence_text"] or len(action["evidence_text"]) < 10:
            continue
        if action["task"] not in seen_tasks:
            valid_actions.append(action)
            seen_tasks.add(action["task"])

    return {
        "case_title": sanitize_text(extraction_data.get("case_title", "Untitled Case")),
        "court": sanitize_text(extraction_data.get("court", "Court Name Not Found")),
        "date": sanitize_text(extraction_data.get("date", "N/A")),
        "parties": [sanitize_text(p) for p in extraction_data.get("parties", [])],
        "orders": [sanitize_text(o) for o in extraction_data.get("orders", [])],
        "directive_sentences": [sanitize_text(d) for d in extraction_data.get("directive_sentences", [])],
        "preview_summary": [sanitize_text(s) for s in extraction_data.get("preview_summary", [])],
        "deadlines": [
            {
                "text": sanitize_text(d.get("text")) if isinstance(d, dict) else sanitize_text(d),
                "associated_directive": sanitize_text(d.get("associated_directive")) if isinstance(d, dict) else None
            } for d in extraction_data.get("deadlines", [])
        ],
        "actions": valid_actions[:5]
    }

# Example Output Demonstration
if __name__ == "__main__":
    test_signals = {
        "case_title": "State vs. John Doe",
        "compliance_required": True,
        "directive_sentences": ["The Secretary shall file a compliance affidavit within 4 weeks."],
        "appeal_possible": True,
        "orders": ["Deposit 5 lakhs in court within 2 months."]
    }
    
    import json
    print(json.dumps(validate_and_enrich_actions(test_signals), indent=2))
