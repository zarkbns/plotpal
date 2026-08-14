import json
import logging
import os
import re
from typing import Dict, Any, List, Optional
import anthropic

from app.schemas import ContinuityCheck
from app.entity_extractor import extract_entities, EntityExtractor

logger = logging.getLogger("plotpal.continuity_engine")

CLAUDE_CONTINUITY_PROMPT = """You are an experienced co-writer providing direct manuscript feedback for Plotpal.
Your task is to analyze an active manuscript scene against past timeline states from HydraDB to detect narrative contradictions and plot holes.

Feedback Voice & Tone:
- Write violation explanations and suggestions like real feedback from a co-writer, not technical database or API output.
- Be direct about what's broken without being overly formal or forcing energy.
- Assume the writer is smart: point out the problem clearly and let them decide the creative resolution.
- Be specific (mention timeline markers, character names, items, locations, and what changed).
- Suggestions should be practical and straightforward.

Examples of the required feedback style:
- Character status: "{character} dies back at timeline {past_marker}, then shows up alive and active at timeline {current_marker}. You need to explain what happened between those two points."
- Item transfers: "{past_owner} has {item} at timeline {past_marker}, then {current_owner} has it at timeline {current_marker}. There's no scene showing the transfer between these two timeline points."
- Location states: "{location} is locked and inaccessible at timeline {past_marker}, but open at timeline {current_marker}. Nothing in between explains how it got unlocked."
- Faction/allegiance: "{character} is part of {past_faction} early on at timeline {past_marker}, then they're with {current_faction} at timeline {current_marker} with no explanation for the switch."

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
      "explanation": "Direct co-writer feedback explaining what is broken in the narrative"
    }
  ],
  "suggestions": [
    "Practical recommendation to help the writer resolve the issue"
  ]
}

Severity Guidelines:
- "critical": Character death without explanation, major timeline paradox.
- "medium": Item possession mismatch without transfer, locked location accessed without explanation.
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
                            "explanation": f"{c_name} dies back at timeline {p_marker}, then shows up alive and {cc.get('physical_status', 'active')} at timeline {current_timeline_marker}. You need to explain what happened between those two points.",
                        }
                    )
                    suggestions.append(
                        f"Show or mention how {c_name} survived or returned before timeline {current_timeline_marker}, or adjust their status in this scene."
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
                                    "explanation": f"{past_holder} has {item_name} at timeline {p_marker}, then {curr_holder} has it at timeline {current_timeline_marker}. There's no scene showing the transfer between these two timeline points.",
                                }
                            )
                            suggestions.append(
                                f"Add a moment showing how {item_name} got from {past_holder} to {curr_holder} between timeline {p_marker} and {current_timeline_marker}."
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
                                "explanation": f"{l_name} is locked and inaccessible at timeline {p_marker}, but open at timeline {current_timeline_marker}. Nothing in between explains how it got unlocked.",
                            }
                        )
                        suggestions.append(
                            f"Show how {l_name} was unlocked or breached before characters access it at timeline {current_timeline_marker}."
                        )

    # 4. Character Allegiance / Faction Check
    for cr in current_rels:
        rel_type = cr.get("relationship_type", "").upper()
        if rel_type in ("ALLIED_WITH", "MEMBER_OF", "AFFILIATED_WITH", "FACTION"):
            char_name = cr.get("source_id", "").strip()
            curr_faction = cr.get("target_id", "").strip()

            for pr in past_rels:
                p_rel_type = pr.get("relationship_type", "").upper()
                if p_rel_type in ("ALLIED_WITH", "MEMBER_OF", "AFFILIATED_WITH", "FACTION"):
                    p_char = pr.get("source_id", "").strip()
                    past_faction = pr.get("target_id", "").strip()
                    p_marker = pr.get("timeline_marker", 0)

                    if p_marker < current_timeline_marker and char_name.lower() == p_char.lower():
                        if past_faction and curr_faction and past_faction.lower() != curr_faction.lower():
                            violations.append(
                                {
                                    "type": "character_status",
                                    "entities_involved": [char_name, past_faction, curr_faction],
                                    "timeline_conflict": {
                                        "past_state": {"character": char_name, "faction": past_faction},
                                        "past_timeline_marker": p_marker,
                                        "current_state": {"character": char_name, "faction": curr_faction},
                                        "current_timeline_marker": current_timeline_marker,
                                    },
                                    "explanation": f"{char_name} is part of {past_faction} early on at timeline {p_marker}, then they're with {curr_faction} at timeline {current_timeline_marker} with no explanation for the switch.",
                                }
                            )
                            suggestions.append(
                                f"Establish the turning point or reason why {char_name} switched from {past_faction} to {curr_faction} between timeline {p_marker} and {current_timeline_marker}."
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
