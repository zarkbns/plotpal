import os
import json
import logging
from typing import Any, Dict, Optional, List, Union
import requests
from dotenv import load_dotenv

from app.entity_extractor import EntityExtractor

load_dotenv()

logger = logging.getLogger("plotpal.hydra_client")


class HydraClient:
    """
    HydraDB REST API Client for Plotpal Manuscript Continuity Tracking.
    Implements real HTTP interactions with HydraDB v2:
    - POST /databases: Create/provision databases
    - POST /context/ingest: Store vector memories with timeline metadata
    - POST /query: Search memories and extract narrative timeline state
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        database: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("HYDRA_API_KEY", "")
        self.database = database or os.getenv("HYDRA_DATABASE", "plotpal")

        # Base URL resolution (defaults to live HydraDB v2 endpoint)
        raw_base_url = (
            base_url
            or os.getenv("HYDRA_BASE_URL")
            or os.getenv("HYDRA_API_URL")
            or "https://api.hydradb.com"
        )
        self.base_url = raw_base_url.rstrip("/")

        self.entity_extractor = EntityExtractor()

        if not self.api_key:
            logger.warning(
                "HydraClient initialized without HYDRA_API_KEY. "
                "Ensure HYDRA_API_KEY is set in environment variables."
            )

    def _get_headers(self, is_json: bool = True) -> Dict[str, str]:
        """
        Constructs required HTTP headers with Bearer token authentication.
        """
        headers: Dict[str, str] = {
            "Authorization": f"Bearer {self.api_key}",
        }
        if is_json:
            headers["Content-Type"] = "application/json"
        return headers

    def setup_ontology(self, database: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates/provisions the target database in HydraDB.
        Endpoint: POST /databases
        Payload: {"database": database_name} (with fallback to {"name": database_name})
        """
        db_name = database or self.database
        logger.info("Setting up HydraDB database: %s at %s", db_name, self.base_url)

        url = f"{self.base_url}/databases"
        headers = self._get_headers(is_json=True)

        # Primary payload format for HydraDB database creation
        payload = {"database": db_name}

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=30)

            # If rejected with 400, retry with alternative payload schema {"name": db_name}
            if res.status_code == 400:
                alt_payload = {"name": db_name}
                res = requests.post(url, json=alt_payload, headers=headers, timeout=30)

            if res.status_code in (200, 201, 202):
                data = res.json() if res.content else {}
                logger.info("HydraDB database '%s' setup response: %s", db_name, data)
                return {
                    "status": "success",
                    "success": True,
                    "database": db_name,
                    "message": f"HydraDB database '{db_name}' initialized.",
                    "data": data,
                }
            elif res.status_code == 409 or "already exists" in res.text.lower():
                logger.info("HydraDB database '%s' already exists.", db_name)
                return {
                    "status": "success",
                    "success": True,
                    "database": db_name,
                    "message": f"HydraDB database '{db_name}' already exists.",
                }
            else:
                res.raise_for_status()
                return {"status": "success", "database": db_name}

        except requests.exceptions.RequestException as e:
            logger.error("HydraDB setup_ontology failed for database '%s': %s", db_name, e)
            raise RuntimeError(f"HydraDB POST /databases request failed: {e}") from e

    def create_database(self, name: str) -> Dict[str, Any]:
        """
        Alias for setup_ontology to create a specific database.
        """
        return self.setup_ontology(database=name)

    def list_databases(self) -> Dict[str, Any]:
        """
        Retrieves existing databases from HydraDB.
        Endpoint: GET /databases
        """
        url = f"{self.base_url}/databases"
        headers = self._get_headers(is_json=True)
        try:
            res = requests.get(url, headers=headers, timeout=15)
            res.raise_for_status()
            return res.json()
        except Exception as e:
            logger.error("Failed to list HydraDB databases: %s", e)
            raise

    def ingest_scene(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        database: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Stores manuscript scene memories and entity context in HydraDB.
        Endpoint: POST /context/ingest
        Parameters: type="memory", database=database_name, memories=json_array_of_memories
        """
        if metadata is None:
            metadata = {}

        db_name = database or self.database
        timeline_marker = metadata.get("in_universe_time", metadata.get("timeline_marker", 0))
        chapter = metadata.get("chapter", 1)
        manuscript_position = metadata.get("manuscript_position", 0.0)

        logger.info(
            "Ingesting scene into HydraDB (database: %s, chapter: %s, marker: %s, text_length: %d)",
            db_name,
            chapter,
            timeline_marker,
            len(text),
        )

        # 1. Extract narrative entity metadata via entity extractor
        extracted: Dict[str, Any] = {}
        try:
            extracted_raw = self.entity_extractor.extract_entities(text)
            if hasattr(extracted_raw, "model_dump"):
                extracted = extracted_raw.model_dump()
            elif hasattr(extracted_raw, "dict"):
                extracted = extracted_raw.dict()
            elif isinstance(extracted_raw, dict):
                extracted = extracted_raw
        except Exception as e:
            logger.warning("Entity extraction note during ingest: %s", e)

        # 2. Build structured memory item
        memory_item = {
            "text": text,
            "metadata": {
                "timeline_marker": int(timeline_marker) if timeline_marker is not None else 0,
                "in_universe_time": int(timeline_marker) if timeline_marker is not None else 0,
                "chapter": int(chapter) if chapter is not None else 1,
                "manuscript_position": float(manuscript_position) if manuscript_position is not None else 0.0,
                "characters": extracted.get("characters", []),
                "items": extracted.get("items", []),
                "locations": extracted.get("locations", []),
                "events": extracted.get("events", []),
                "relationships": extracted.get("relationships", []),
                **{
                    k: v
                    for k, v in metadata.items()
                    if k not in ("characters", "items", "locations", "events", "relationships", "in_universe_time", "chapter", "manuscript_position")
                },
            },
        }

        url = f"{self.base_url}/context/ingest"

        # HydraDB v2 expects form-encoded / multipart data with type="memory", database, and stringified JSON memories
        form_data = {
            "database": db_name,
            "type": "memory",
            "memories": json.dumps([memory_item]),
        }

        try:
            auth_header = self._get_headers(is_json=False)
            res = requests.post(url, data=form_data, headers=auth_header, timeout=30)

            # Fallback to JSON payload if server expects application/json
            if res.status_code in (400, 415) and "json" in res.text.lower():
                json_payload = {
                    "type": "memory",
                    "database": db_name,
                    "memories": [memory_item],
                }
                res = requests.post(
                    url,
                    json=json_payload,
                    headers=self._get_headers(is_json=True),
                    timeout=30,
                )

            res.raise_for_status()
            data = res.json() if res.content else {}

            logger.info("HydraDB ingest_scene success: %s", data)
            return {
                "success": True,
                "status": "success",
                "database": db_name,
                "response": data,
                "timeline_marker": timeline_marker,
                "chapter": chapter,
                "entities_extracted": extracted,
            }

        except requests.exceptions.RequestException as e:
            logger.error("HydraDB POST /context/ingest failed: %s", e)
            raise RuntimeError(f"HydraDB POST /context/ingest failed: {e}") from e

    def query_timeline(
        self,
        query: Any = "",
        timeline_marker: Any = None,
        database: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Queries HydraDB memories and extracts historical narrative state up to the given timeline marker.
        Endpoint: POST /query
        Parameters: database=database_name, type="memory", query=query_string
        """
        # Support flexible call signatures (e.g. query_timeline(999999) vs query_timeline("text", 850))
        if isinstance(query, (int, float)) and timeline_marker is None:
            marker_val = int(query)
            query_str = ""
        else:
            query_str = str(query) if query is not None else ""
            try:
                marker_val = int(timeline_marker) if timeline_marker is not None else 999999
            except (ValueError, TypeError):
                marker_val = 999999

        db_name = database or self.database
        effective_query = query_str.strip() or "manuscript timeline history and character state"

        logger.info(
            "Querying HydraDB timeline: database=%s, query='%s', marker=%d",
            db_name,
            effective_query[:60],
            marker_val,
        )

        url = f"{self.base_url}/query"
        payload = {
            "database": db_name,
            "type": "memory",
            "query": effective_query,
        }
        headers = self._get_headers(is_json=True)

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=30)
            res.raise_for_status()
            data = res.json() if res.content else {}

            # Parse HydraDB query response structures
            parsed_data = data.get("data", data) if isinstance(data, dict) else {}

            # Extract memory chunks and sources from response
            chunks = []
            if isinstance(parsed_data, dict):
                chunks = (
                    parsed_data.get("chunks")
                    or parsed_data.get("memories")
                    or parsed_data.get("results")
                    or parsed_data.get("matches")
                    or []
                )
            elif isinstance(parsed_data, list):
                chunks = parsed_data

            past_scenes: List[Dict[str, Any]] = []
            character_states: Dict[str, Dict[str, Any]] = {}
            item_states: Dict[str, Dict[str, Any]] = {}
            location_states: Dict[str, Dict[str, Any]] = {}

            flat_characters: List[Dict[str, Any]] = []
            flat_items: List[Dict[str, Any]] = []
            flat_locations: List[Dict[str, Any]] = []
            flat_events: List[Dict[str, Any]] = []
            flat_relationships: List[Dict[str, Any]] = []

            for chunk in chunks:
                if not isinstance(chunk, dict):
                    continue

                chunk_text = (
                    chunk.get("chunk_content")
                    or chunk.get("text")
                    or chunk.get("content")
                    or chunk.get("chunk")
                    or chunk.get("raw_text")
                    or ""
                )
                chunk_meta = chunk.get("metadata", {})
                if not isinstance(chunk_meta, dict):
                    chunk_meta = {}

                # Determine timeline marker for this memory
                raw_marker = chunk_meta.get(
                    "timeline_marker",
                    chunk_meta.get("in_universe_time", chunk.get("timeline_marker", marker_val)),
                )
                try:
                    c_marker = int(raw_marker)
                except (ValueError, TypeError):
                    c_marker = marker_val

                # Filter by timeline marker: only include memories at or before marker_val
                if c_marker <= marker_val:
                    if chunk_text:
                        past_scenes.append({
                            "text": chunk_text,
                            "timeline_marker": c_marker,
                            "chapter": chunk_meta.get("chapter", 1),
                        })

                    # Parse character metadata
                    if chunk_meta.get("character"):
                        char_name = str(chunk_meta["character"]).title()
                        flat_characters.append({"name": char_name, "timeline_marker": c_marker})
                        if char_name not in character_states:
                            character_states[char_name] = {
                                "physical_status": "Healthy",
                                "core_motivation": "",
                                "last_seen_timeline": c_marker,
                                "last_seen_location": "Unknown",
                                "possesses_items": [],
                                "allegiances": [],
                            }

                    # Parse any entity structures stored in metadata
                    for char in chunk_meta.get("characters", []):
                        if isinstance(char, dict) and char.get("name"):
                            c_name = char["name"].strip().title()
                            flat_characters.append({**char, "name": c_name, "timeline_marker": c_marker})
                            character_states[c_name] = {
                                "physical_status": char.get("physical_status", "Healthy"),
                                "core_motivation": char.get("core_motivation", ""),
                                "last_seen_timeline": c_marker,
                                "last_seen_location": char.get("last_seen_location", "Unknown"),
                                "possesses_items": [],
                                "allegiances": [],
                            }

                    for item in chunk_meta.get("items", []):
                        if isinstance(item, dict) and item.get("name"):
                            i_name = item["name"].strip().title()
                            flat_items.append({**item, "name": i_name, "timeline_marker": c_marker})
                            item_states[i_name] = {
                                "secret_payload": item.get("secret_payload", ""),
                                "held_by": item.get("owner", item.get("held_by", "Unknown")),
                                "last_possession_timeline": c_marker,
                            }

                    for loc in chunk_meta.get("locations", []):
                        if isinstance(loc, dict) and loc.get("name"):
                            l_name = loc["name"].strip().title()
                            flat_locations.append({**loc, "name": l_name, "timeline_marker": c_marker})
                            location_states[l_name] = {
                                "is_accessible": loc.get("is_accessible", True),
                                "controlling_faction": loc.get("controlling_faction", "Unknown"),
                                "last_updated_timeline": c_marker,
                            }

                    for evt in chunk_meta.get("events", []):
                        if isinstance(evt, dict):
                            flat_events.append({**evt, "timeline_marker": c_marker})

                    for rel in chunk_meta.get("relationships", []):
                        if isinstance(rel, dict):
                            flat_relationships.append({**rel, "timeline_marker": c_marker})
                            rel_type = rel.get("relationship_type", "").upper()
                            src = str(rel.get("source_id", "")).title()
                            tgt = str(rel.get("target_id", "")).title()
                            if rel_type == "POSSESSES_ITEM" and src in character_states:
                                if tgt not in character_states[src]["possesses_items"]:
                                    character_states[src]["possesses_items"].append(tgt)
                            elif rel_type in ("ALLIED_WITH", "MEMBER_OF", "HOLDS_ALLEGIANCE_TO") and src in character_states:
                                if tgt not in character_states[src]["allegiances"]:
                                    character_states[src]["allegiances"].append(tgt)

            # Also parse graph_context chunk_relations triplets returned by HydraDB
            graph_context = parsed_data.get("graph_context", {})
            if isinstance(graph_context, dict):
                chunk_relations = graph_context.get("chunk_relations", [])
                for rel_group in chunk_relations:
                    triplets = rel_group.get("triplets", [])
                    for triplet in triplets:
                        source = triplet.get("source", {})
                        target = triplet.get("target", {})
                        relation = triplet.get("relation", {})

                        s_name = str(source.get("name", "")).strip().title()
                        t_name = str(target.get("name", "")).strip().title()
                        predicate = str(relation.get("canonical_predicate") or relation.get("raw_predicate", "")).lower()

                        if not s_name or not t_name:
                            continue

                        # Categorize entities
                        s_type = source.get("type", "").upper()
                        t_type = target.get("type", "").upper()

                        if s_type == "PERSON" or not s_type:
                            if s_name not in character_states:
                                character_states[s_name] = {
                                    "physical_status": "Healthy",
                                    "core_motivation": "",
                                    "last_seen_timeline": marker_val,
                                    "last_seen_location": "Unknown",
                                    "possesses_items": [],
                                    "allegiances": [],
                                }
                            flat_characters.append({"name": s_name, "timeline_marker": marker_val})

                        if t_type in ("PRODUCT", "ITEM", "LOREITEM"):
                            if t_name not in item_states:
                                item_states[t_name] = {
                                    "secret_payload": "",
                                    "held_by": "Unknown",
                                    "last_possession_timeline": marker_val,
                                }
                            flat_items.append({"name": t_name, "timeline_marker": marker_val})
                        elif t_type == "LOCATION":
                            if t_name not in location_states:
                                location_states[t_name] = {
                                    "is_accessible": True,
                                    "controlling_faction": "Unknown",
                                    "last_updated_timeline": marker_val,
                                }
                            flat_locations.append({"name": t_name, "timeline_marker": marker_val})

                        # Map relationship predicates
                        if any(term in predicate for term in ("holds", "possess", "carries", "has", "takes")):
                            if s_name in character_states and t_name not in character_states[s_name]["possesses_items"]:
                                character_states[s_name]["possesses_items"].append(t_name)
                            if t_name in item_states:
                                item_states[t_name]["held_by"] = s_name
                                item_states[t_name]["last_possession_timeline"] = marker_val
                            flat_relationships.append({
                                "relationship_type": "POSSESSES_ITEM",
                                "source_id": s_name,
                                "target_id": t_name,
                                "timeline_marker": marker_val,
                            })
                        elif any(term in predicate for term in ("located in", "in", "at", "travels to", "arrives at")):
                            if s_name in character_states:
                                character_states[s_name]["last_seen_location"] = t_name
                            flat_relationships.append({
                                "relationship_type": "LOCATED_IN",
                                "source_id": s_name,
                                "target_id": t_name,
                                "timeline_marker": marker_val,
                            })
                        elif any(term in predicate for term in ("allied", "member", "allegiance", "faction")):
                            if s_name in character_states and t_name not in character_states[s_name]["allegiances"]:
                                character_states[s_name]["allegiances"].append(t_name)
                            flat_relationships.append({
                                "relationship_type": "HOLDS_ALLEGIANCE_TO",
                                "source_id": s_name,
                                "target_id": t_name,
                                "timeline_marker": marker_val,
                            })

            return {
                "status": "success",
                "database": db_name,
                "raw_response": data,
                "past_scenes": past_scenes,
                "character_states": character_states,
                "item_states": item_states,
                "location_states": location_states,
                "characters": flat_characters,
                "items": flat_items,
                "locations": flat_locations,
                "events": flat_events,
                "relationships": flat_relationships,
                "timeline_marker": marker_val,
                "query": query_str,
            }

        except requests.exceptions.RequestException as e:
            logger.error("HydraDB POST /query failed: %s", e)
            raise RuntimeError(f"HydraDB POST /query failed: {e}") from e
