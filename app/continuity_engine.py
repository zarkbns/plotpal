import json
import logging
import os
import re
from typing import Dict, Any, List, Optional
import anthropic

from app.schemas import ContinuityCheck
from app.entity_extractor import extract_entities, EntityExtractor

logger = logging.getLogger("plotpal.continuity_engine")

CLAUDE_CONTINUITY_PROMPT = """You are an expert plot continuity reviewer for Plotpal.
Your task is to analyze an active manuscript scene against past timeline states from HydraDB to detect narrative contradictions and plot holes.

You MUST return ONLY a raw JSON object with NO preamble, NO explanations, and NO markdown formatting.

Required JSON Structure:
{
  "is_valid": boolean (false if any contradictions found, true if consistent),
  "conflict_severity": "none" | "low" | "medium" | "critical",
  "violations": [
    {
      "type": "character_status" | "item_ownership" | "location_state" | "causality",
      "entities_involved": ["entity_name_1", "entity_name_2"],
      "timeline_conflict": {
        "past_state": {},
        "past_timeline_marker": integer,
        "current_state": {},
        "current_timeline_marker": integer
      },
      "explanation": "Clear description of the contradiction"
    }
  ],
  "suggestions": [
    "Specific actionable recommendation to resolve each plot hole"
  ]
}

Severity Guidelines:
- "critical": Character death resurrection without magic/event, major timeline paradox.
- "medium": Item possession mismatch without transfer, locked location accessed without key.
- "low": Minor status or motivation shift without context.
- "none": No plot holes or contradictions detected.
"""


def _detect_rule_violations(
    current_entities: Dict[str, Any], past_matrix: Dict[str, Any], current_timeline_marker: int
) -> tuple[List[Dict[str, Any]], List[str]]:
    """
    Deterministic fallback rule engine comparing extracted current entities against past states.
    """
    violations = []
    suggestions = []

    current_chars = current_entities.get("characters", [])
    current_items = current_entities.get("items", [])
    current_locs = current_entities.get("locations", [])
    current_rels = current_entities.get("relationships", [])

    past_chars = past_matrix.get("characters", [])
    past_items = past_matrix.get("items", [])
    past_locs = past_matrix.get("locations", [])
    past_rels = past_matrix.get("relationships", [])

    deceased_terms = {"deceased", "dead", "killed", "slain", "perished"}
    alive_terms = {"healthy", "alive", "active", "determined", "uninjured", "standing"}

    # 1. Character Status Check
    for cc in current_chars:
        c_name = cc.get("name", "").strip()
        c_status = cc.get("physical_status", "").lower()
        if not c_name:
            continue

        for pc in past_chars:
            p_name = pc.get("name", "").strip()
            p_status = pc.get("physical_status", "").lower()
            p_marker = pc.get("timeline_marker", 0)

            if p_marker < current_timeline_marker and (c_name.lower() in p_name.lower() or p_name.lower() in c_name.lower()):
                if any(term in p_status for term in deceased_terms) and any(term in c_status for term in alive_terms):
                    violations.append(
                        {
                            "type": "character_status",
                            "entities_involved": [c_name],
                            "timeline_conflict": {
                                "past_state": pc,
                                "past_timeline_marker": p_marker,
                                "current_state": cc,
                                "current_timeline_marker": current_timeline_marker,
                            },
                            "explanation": f"Character {c_name} was recorded as '{pc.get('physical_status')}' at timeline {p_marker}, but appears '{cc.get('physical_status')}' at timeline {current_timeline_marker} without a resurrection event.",
                        }
                    )
                    suggestions.append(
                        f"Clarify or establish a resurrection or survival event for {c_name} before timeline {current_timeline_marker}."
                    )

    # 2. Item Ownership Check
    for cr in current_rels:
        if cr.get("relationship_type") == "POSSESSES_ITEM":
            curr_holder = cr.get("source_id", "").strip()
            item_name = cr.get("target_id", "").strip()

            for pr in past_rels:
                if pr.get("relationship_type") == "POSSESSES_ITEM":
                    past_holder = pr.get("source_id", "").strip()
                    past_item = pr.get("target_id", "").strip()
                    p_marker = pr.get("timeline_marker", 0)

                    if p_marker < current_timeline_marker and (item_name.lower() in past_item.lower() or past_item.lower() in item_name.lower()):
                        if past_holder and curr_holder and past_holder.lower() != curr_holder.lower():
                            violations.append(
                                {
                                    "type": "item_ownership",
                                    "entities_involved": [past_holder, curr_holder, item_name],
                                    "timeline_conflict": {
                                        "past_state": {"owner": past_holder, "item": past_item},
                                        "past_timeline_marker": p_marker,
                                        "current_state": {"owner": curr_holder, "item": item_name},
                                        "current_timeline_marker": current_timeline_marker,
                                    },
                                    "explanation": f"Item '{item_name}' was possessed by {past_holder} at timeline {p_marker}, but is now held by {curr_holder} at timeline {current_timeline_marker} without an explicit transfer event.",
                                }
                            )
                            suggestions.append(
                                f"Add a scene depicting how {item_name} was transferred from {past_holder} to {curr_holder}."
                            )

    # 3. Location State Check
    for cl in current_locs:
        l_name = cl.get("name", "").strip()
        l_access = cl.get("is_accessible")
        if l_access is True and l_name:
            for pl in past_locs:
                pl_name = pl.get("name", "").strip()
                pl_access = pl.get("is_accessible")
                p_marker = pl.get("timeline_marker", 0)

                if p_marker < current_timeline_marker and (l_name.lower() in pl_name.lower() or pl_name.lower() in l_name.lower()):
                    if pl_access is False:
                        violations.append(
                            {
                                "type": "location_state",
                                "entities_involved": [l_name],
                                "timeline_conflict": {
                                    "past_state": pl,
                                    "past_timeline_marker": p_marker,
                                    "current_state": cl,
                                    "current_timeline_marker": current_timeline_marker,
                                },
                                "explanation": f"Location '{l_name}' was marked inaccessible/locked at timeline {p_marker}, but is accessed as open/accessible at timeline {current_timeline_marker} without an unlocking event.",
                            }
                        )
                        suggestions.append(
                            f"Include a scene demonstrating how {l_name} became accessible or unlocked."
                        )

    return violations, suggestions


def check_continuity(active_text: str, current_timeline_marker: int, hydra_client: Any) -> Dict[str, Any]:
    """
    Detects plot holes by querying HydraDB for past timeline states and comparing them against active_text.
    """
    logger.info("Checking continuity for active text (len=%d) at timeline %d", len(active_text), current_timeline_marker)

    # 1. Query HydraDB for past states up to current_timeline_marker
    try:
        past_matrix = hydra_client.query_timeline(active_text, current_timeline_marker)
        if not isinstance(past_matrix, dict) or past_matrix.get("status") == "error":
            logger.error("query_timeline returned failure status")
            return {
                "is_valid": True,
                "conflict_severity": "none",
                "violations": [],
                "error": "could not query past states",
            }
    except Exception as e:
        logger.error("Failed to query past states from HydraDB: %s", str(e))
        return {
            "is_valid": True,
            "conflict_severity": "none",
            "violations": [],
            "error": "could not query past states",
        }

    # 2. Extract entities from active_text
    try:
        current_entities = extract_entities(active_text)
        if isinstance(current_entities, dict) and "error" in current_entities:
            from app.entity_extractor import _get_mock_extraction
            current_entities = _get_mock_extraction(active_text)
    except Exception as e:
        logger.warning("extract_entities failed (%s). Falling back to mock extraction for continuity check.", e)
        from app.entity_extractor import _get_mock_extraction
        current_entities = _get_mock_extraction(active_text)

    # 3. Deterministic Rule Violations Check
    rule_violations, rule_suggestions = _detect_rule_violations(
        current_entities, past_matrix, current_timeline_marker
    )

    # 4. Call Claude to synthesize analysis
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key and api_key != "your_anthropic_api_key_here":
        try:
            client = anthropic.Anthropic(api_key=api_key)
            user_prompt = f"""Active Manuscript Scene (Timeline Marker: {current_timeline_marker}):
{active_text}

Extracted Current Entities:
{json.dumps(current_entities, indent=2)}

Past Timeline Context Matrix from HydraDB:
{json.dumps(past_matrix, indent=2)}

Detected Rule Violations:
{json.dumps(rule_violations, indent=2)}

Please evaluate all contradictions and synthesize a final json continuity report.
"""
            response = client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=2000,
                system=CLAUDE_CONTINUITY_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            response_text = response.content[0].text.strip()

            cleaned = response_text
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
                cleaned = re.sub(r"\n?```$", "", cleaned)
                cleaned = cleaned.strip()

            report = json.loads(cleaned)
            if isinstance(report, dict) and "is_valid" in report:
                return report
        except Exception as err:
            logger.error("Claude synthesis failed or returned invalid JSON: %s. Returning raw violations.", err)

    # 5. Fallback return raw violations without LLM summary if API call fails or key not present
    has_violations = len(rule_violations) > 0
    severity = "none"
    if has_violations:
        if any(v.get("type") == "character_status" for v in rule_violations):
            severity = "critical"
        elif any(v.get("type") in ("item_ownership", "location_state") for v in rule_violations):
            severity = "medium"
        else:
            severity = "low"

    return {
        "is_valid": not has_violations,
        "conflict_severity": severity,
        "violations": rule_violations,
        "suggestions": rule_suggestions,
    }


class ContinuityEngine:
    """
    Engine class for continuity checks.
    """

    def __init__(self, hydra_client: Optional[Any] = None):
        self.hydra_client = hydra_client

    def check_continuity(self, check_request: Any, hydra_client: Optional[Any] = None) -> Dict[str, Any]:
        """
        Accepts either a ContinuityCheck schema object or raw arguments.
        """
        client = hydra_client or self.hydra_client
        if hasattr(check_request, "active_text"):
            active_text = check_request.active_text
            marker = getattr(check_request, "current_timeline_marker", 0)
        elif isinstance(check_request, dict):
            active_text = check_request.get("active_text", "")
            marker = check_request.get("current_timeline_marker", 0)
        else:
            active_text = str(check_request)
            marker = 0

        return check_continuity(active_text, marker, client)
