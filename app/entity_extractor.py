import json
import logging
import os
import re
from typing import Dict, Any, Optional
import anthropic
from app.schemas import EntityExtraction

logger = logging.getLogger("plotpal.entity_extractor")

SYSTEM_PROMPT = """You are an expert narrative entity extraction assistant for Plotpal.
Your task is to parse manuscript text and extract structured entities, locations, items, events, and relationships.

You MUST return ONLY a raw JSON object with NO preamble, NO explanations, and NO markdown code block formatting.

Required JSON Structure:
{
  "characters": [
    {
      "name": "Character Name",
      "physical_status": "string describing physical state (e.g. Healthy, Exhausted, Injured)",
      "core_motivation": "string describing current core motivation in this scene"
    }
  ],
  "items": [
    {
      "name": "Item Name",
      "secret_payload": "string describing this item's significance, function, or secret payload"
    }
  ],
  "locations": [
    {
      "name": "Location Name",
      "is_accessible": true/false,
      "controlling_faction": "string describing the controlling faction or force"
    }
  ],
  "events": [
    {
      "name": "Event Name",
      "description": "string describing what occurs during the event",
      "consequence": "string describing the narrative result or consequence"
    }
  ],
  "relationships": [
    {
      "source_type": "Character",
      "source_id": "Entity Name (e.g. Eren Yeager)",
      "relationship_type": "POSSESSES_ITEM",
      "target_id": "Entity Name (e.g. Basement Key)"
    }
  ]
}

Extraction Guidelines:
1. Extract ONLY entities explicitly mentioned or strongly implied in the manuscript text.
2. Do NOT invent backstory or entities not supported by the text.
3. If an detail is ambiguous, note the ambiguity in the secret_payload or consequence field.
4. Output valid JSON ONLY.
"""


def _get_mock_extraction(text: str) -> Dict[str, Any]:
    """
    Fallback mock extraction used when ANTHROPIC_API_KEY is absent or in test environments.
    """
    logger.info("Using mock entity extraction for manuscript text length %d", len(text))
    
    # Check if text mentions Attack on Titan / Eren
    lower_text = text.lower()
    if "eren" in lower_text or "basement" in lower_text or "shiganshina" in lower_text:
        return {
            "characters": [
                {
                    "name": "Eren Yeager",
                    "physical_status": "Determined, uninjured",
                    "core_motivation": "Uncover the secret in his father's basement",
                }
            ],
            "items": [
                {
                    "name": "Basement Key",
                    "secret_payload": "Small brass key around Eren's neck unlocking the basement drawer",
                }
            ],
            "locations": [
                {
                    "name": "Shiganshina District",
                    "is_accessible": True,
                    "controlling_faction": "Survey Corps",
                }
            ],
            "events": [
                {
                    "name": "Return to Shiganshina",
                    "description": "Eren and the Scout Regiment retake Shiganshina to reach the basement",
                    "consequence": "Opens the way to reveal the truth of the world",
                }
            ],
            "relationships": [
                {
                    "source_type": "Character",
                    "source_id": "Eren Yeager",
                    "relationship_type": "POSSESSES_ITEM",
                    "target_id": "Basement Key",
                },
                {
                    "source_type": "Character",
                    "source_id": "Eren Yeager",
                    "relationship_type": "LOCATED_IN",
                    "target_id": "Shiganshina District",
                },
            ],
        }

    return {
        "characters": [
            {
                "name": "Elara",
                "physical_status": "Healthy",
                "core_motivation": "Protect the ancient realm",
            }
        ],
        "items": [
            {
                "name": "Silver Key",
                "secret_payload": "Opens the Obsidian Gate",
            }
        ],
        "locations": [
            {
                "name": "Obsidian Tower",
                "is_accessible": True,
                "controlling_faction": "Shadow Council",
            }
        ],
        "events": [
            {
                "name": "Discovery of the Key",
                "description": "Elara found the silver key on the obsidian table",
                "consequence": "Enables passage to the inner sanctum",
            }
        ],
        "relationships": [
            {
                "source_type": "Character",
                "source_id": "Elara",
                "relationship_type": "POSSESSES_ITEM",
                "target_id": "Silver Key",
            }
        ],
    }


def extract_entities(text: str) -> Dict[str, Any]:
    """
    Calls Claude (via Anthropic API) to parse manuscript text and extract structured narrative entities.
    Returns a dict with keys: characters, items, locations, events, relationships.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_anthropic_api_key_here":
        logger.warning("ANTHROPIC_API_KEY not configured. Falling back to mock extraction.")
        return _get_mock_extraction(text)

    logger.info("Calling Anthropic API (claude-3-5-haiku-20241022) for entity extraction...")
    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Parse the following manuscript text and extract entities strictly as JSON:\n\n{text}",
                }
            ],
        )
        response_text = response.content[0].text.strip()
    except Exception as e:
        logger.error("Anthropic API call failed: %s", str(e))
        raise RuntimeError(f"Anthropic API call failed: {str(e)}") from e

    # Clean markdown wrapper if model includes ```json ... ```
    cleaned = response_text
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        if not isinstance(data, dict):
            logger.error("Claude returned non-dict JSON structure: %s", response_text)
            return {"error": "failed to parse extraction", "raw": response_text}

        # Ensure expected top-level keys exist as lists
        for key in ["characters", "items", "locations", "events", "relationships"]:
            if key not in data or not isinstance(data[key], list):
                data[key] = []

        return data
    except Exception as parse_err:
        logger.error("Failed to parse JSON from Claude response: %s", parse_err)
        logger.debug("Raw response text: %s", response_text)
        return {"error": "failed to parse extraction", "raw": response_text}


class EntityExtractor:
    """
    Wrapper class around extract_entities function for OOP usage.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

    def extract_entities(self, manuscript_text: str) -> Dict[str, Any]:
        """
        Parses manuscript text and returns structured narrative entities.
        """
        return extract_entities(manuscript_text)
