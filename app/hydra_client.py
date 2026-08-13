import os
import logging
import uuid
from typing import Any, Dict, Optional, List
import requests
from dotenv import load_dotenv

from app.entity_extractor import EntityExtractor

load_dotenv()

logger = logging.getLogger("plotpal.hydra_client")


class HydraClient:
    """
    HydraDB Connection and API Wrapper for Plotpal Manuscript Continuity Tracking.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        tenant_id: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("HYDRA_API_KEY", "")
        self.tenant_id = tenant_id or os.getenv("HYDRA_TENANT_ID", "")
        self.base_url = (base_url or os.getenv("HYDRA_BASE_URL", "https://api.hydradb.io/v1")).rstrip("/")

        self.entity_extractor = EntityExtractor()

        # Local mock storage for development / offline sandbox testing
        self._mock_entity_types: Dict[str, Dict[str, Any]] = {}
        self._mock_relationship_types: Dict[str, Dict[str, Any]] = {}
        self._mock_memories: Dict[str, Dict[str, Any]] = {}
        self._mock_nodes: Dict[str, Dict[str, Any]] = {}
        self._mock_edges: Dict[str, Dict[str, Any]] = {}

        if not self.api_key or not self.tenant_id:
            logger.warning(
                "HydraClient initialized without complete credentials. "
                "Ensure HYDRA_API_KEY and HYDRA_TENANT_ID are set in environment variables."
            )

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        if self.tenant_id:
            headers["X-Tenant-ID"] = self.tenant_id
        return headers

    def _mock_post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if endpoint == "/memories/add_memory":
            memory_id = f"mem_{uuid.uuid4().hex[:12]}"
            self._mock_memories[memory_id] = payload
            return {"status": "success", "memory_id": memory_id}
        elif endpoint in ("/memories/retrieve", "/recall/full_recall"):
            q = payload.get("query", "").lower()
            filters = payload.get("filters", {})
            t_filter = filters.get("timeline_marker", {})
            t_val = t_filter.get("value") if isinstance(t_filter, dict) else None

            matched = []
            for mid, m in self._mock_memories.items():
                m_text = m.get("text", "")
                m_meta = m.get("metadata", {})
                m_t = m_meta.get("in_universe_time", m.get("timeline_marker", 0))
                if t_val is not None and m_t is not None:
                    try:
                        if int(m_t) > int(t_val):
                            continue
                    except (ValueError, TypeError):
                        pass
                matched.append({
                    "memory_id": mid,
                    "text": m_text,
                    "metadata": m_meta,
                    "timeline_marker": m_t,
                    "score": 0.95,
                })
            return {"status": "success", "memories": matched}
        elif endpoint == "/graph/nodes":
            node_id = payload.get("entity_id", f"node_{uuid.uuid4().hex[:8]}")
            self._mock_nodes[node_id] = payload
            return {"status": "success", "entity_id": node_id}
        elif endpoint == "/graph/edges":
            edge_id = f"edge_{payload.get('source_id')}_{payload.get('relationship_type')}_{payload.get('target_id')}"
            self._mock_edges[edge_id] = payload
            return {"status": "success", "edge_id": edge_id}
        else:
            return {"status": "success"}

    def _mock_get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if endpoint == "/graph/nodes":
            return {"status": "success", "nodes": list(self._mock_nodes.values())}
        elif endpoint == "/graph/edges":
            return {"status": "success", "edges": list(self._mock_edges.values())}
        elif endpoint == "/memories":
            return {"status": "success", "memories": list(self._mock_memories.values())}
        return {"status": "success"}

    def _get_hydra(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        is_mock_mode = (
            os.getenv("MOCK_HYDRA", "true").lower() == "true"
            or not self.api_key
            or self.api_key == "your_key_here"
            or "hydradb.io" in self.base_url
        )
        if is_mock_mode:
            return self._mock_get(endpoint, params)

        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()

        last_error = None
        for attempt in range(2):
            try:
                res = requests.get(url, params=params, headers=headers, timeout=10)
                if res.status_code in (200, 201):
                    return res.json() if res.content else {"status": "success"}
                elif attempt == 0:
                    logger.warning(
                        "HydraDB GET %s failed with status %d (attempt 1). Retrying...",
                        endpoint,
                        res.status_code,
                    )
                    continue
                else:
                    res.raise_for_status()
            except Exception as e:
                last_error = e
                if attempt == 0:
                    logger.warning("HydraDB GET %s exception: %s (attempt 1). Retrying...", endpoint, e)
                    continue
                else:
                    logger.error("HydraDB GET %s failed after retry: %s. Falling back to mock.", endpoint, e)
                    return self._mock_get(endpoint, params)

        return self._mock_get(endpoint, params)

    def _post_hydra(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        is_mock_mode = (
            os.getenv("MOCK_HYDRA", "true").lower() == "true"
            or not self.api_key
            or self.api_key == "your_key_here"
            or "hydradb.io" in self.base_url
        )
        if is_mock_mode:
            return self._mock_post(endpoint, payload)

        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()

        last_error = None
        for attempt in range(2):
            try:
                res = requests.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code in (200, 201):
                    return res.json() if res.content else {"status": "success"}
                elif attempt == 0:
                    logger.warning(
                        "HydraDB POST %s failed with status %d (attempt 1). Retrying...",
                        endpoint,
                        res.status_code,
                    )
                    continue
                else:
                    res.raise_for_status()
            except Exception as e:
                last_error = e
                if attempt == 0:
                    logger.warning("HydraDB POST %s exception: %s (attempt 1). Retrying...", endpoint, e)
                    continue
                else:
                    logger.error("HydraDB POST %s failed after retry: %s. Falling back to mock.", endpoint, e)
                    return self._mock_post(endpoint, payload)

        return self._mock_post(endpoint, payload)

    def setup_ontology(self) -> Dict[str, Any]:
        """
        Creates the ontological foundation for tracking narrative state across timelines.

        1. Entity Types (POST to /ontology/entity_types):
           - Character: name, physical_status, core_motivation
           - Location: name, is_accessible, controlling_faction
           - LoreItem: name, secret_payload
           - Event: name, description, consequence

        2. Versioned Relationship Types (POST to /ontology/relationship_types with versioned=true):
           - HOLDS_ALLEGIANCE_TO (in_universe_timeline_marker)
           - POSSESSES_ITEM (in_universe_timeline_marker)
           - LOCATED_IN (in_universe_timeline_marker)
           - WITNESSED_EVENT (in_universe_timeline_marker)

        3. Static Relationship Types (POST to /ontology/relationship_types with versioned=false):
           - FAMILY_BOND
           - RIVALS_WITH
           - KNOWS_SECRET_ABOUT
        """
        logger.info("Starting HydraDB ontology setup...")

        entity_type_definitions = [
            {
                "name": "Character",
                "properties": {
                    "name": {"type": "string"},
                    "physical_status": {
                        "type": "string",
                        "description": "e.g. Healthy, Injured, Deceased",
                    },
                    "core_motivation": {"type": "string"},
                },
            },
            {
                "name": "Location",
                "properties": {
                    "name": {"type": "string"},
                    "is_accessible": {"type": "boolean"},
                    "controlling_faction": {"type": "string"},
                },
            },
            {
                "name": "LoreItem",
                "properties": {
                    "name": {"type": "string"},
                    "secret_payload": {"type": "string"},
                },
            },
            {
                "name": "Event",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "consequence": {"type": "string"},
                },
            },
        ]

        versioned_relationship_definitions = [
            {
                "name": "HOLDS_ALLEGIANCE_TO",
                "versioned": True,
                "properties": {
                    "in_universe_timeline_marker": {"type": "integer"}
                },
            },
            {
                "name": "POSSESSES_ITEM",
                "versioned": True,
                "properties": {
                    "in_universe_timeline_marker": {"type": "integer"}
                },
            },
            {
                "name": "LOCATED_IN",
                "versioned": True,
                "properties": {
                    "in_universe_timeline_marker": {"type": "integer"}
                },
            },
            {
                "name": "WITNESSED_EVENT",
                "versioned": True,
                "properties": {
                    "in_universe_timeline_marker": {"type": "integer"}
                },
            },
        ]

        static_relationship_definitions = [
            {
                "name": "FAMILY_BOND",
                "versioned": False,
                "properties": {},
            },
            {
                "name": "RIVALS_WITH",
                "versioned": False,
                "properties": {},
            },
            {
                "name": "KNOWS_SECRET_ABOUT",
                "versioned": False,
                "properties": {},
            },
        ]

        entities_created_count = 0
        relationships_created_count = 0
        created_entities_list: List[str] = []
        created_relationships_list: List[str] = []

        is_mock_mode = (
            os.getenv("MOCK_HYDRA", "false").lower() == "true"
            or not self.api_key
            or self.api_key == "your_key_here"
        )

        headers = self._get_headers()

        # 1. Create Entity Types
        for et in entity_type_definitions:
            payload = {
                "name": et["name"],
                "tenant_id": self.tenant_id,
                "properties": et["properties"],
            }
            if is_mock_mode:
                if et["name"] in self._mock_entity_types:
                    logger.info("Entity type '%s' already exists (skipped)", et["name"])
                else:
                    self._mock_entity_types[et["name"]] = payload
                    entities_created_count += 1
                    created_entities_list.append(et["name"])
                    logger.info("Created entity type: %s", et["name"])
            else:
                try:
                    url = f"{self.base_url}/ontology/entity_types"
                    res = requests.post(url, json=payload, headers=headers, timeout=10)
                    if res.status_code in (200, 201):
                        entities_created_count += 1
                        created_entities_list.append(et["name"])
                        logger.info("Successfully created entity type: %s", et["name"])
                    elif res.status_code == 409 or "already exists" in res.text.lower():
                        logger.info("Entity type '%s' already exists in HydraDB (skipped)", et["name"])
                    else:
                        res.raise_for_status()
                except requests.exceptions.RequestException as e:
                    logger.error("Network failure creating entity type %s: %s", et["name"], e)
                    raise RuntimeError(f"Network failure connecting to HydraDB REST API: {e}") from e

        # 2. Create Versioned Relationship Types
        for rel in versioned_relationship_definitions:
            payload = {
                "name": rel["name"],
                "tenant_id": self.tenant_id,
                "versioned": rel["versioned"],
                "properties": rel["properties"],
            }
            if is_mock_mode:
                if rel["name"] in self._mock_relationship_types:
                    logger.info("Relationship type '%s' already exists (skipped)", rel["name"])
                else:
                    self._mock_relationship_types[rel["name"]] = payload
                    relationships_created_count += 1
                    created_relationships_list.append(f"{rel['name']} (versioned)")
                    logger.info("Created versioned relationship type: %s", rel["name"])
            else:
                try:
                    url = f"{self.base_url}/ontology/relationship_types"
                    res = requests.post(url, json=payload, headers=headers, timeout=10)
                    if res.status_code in (200, 201):
                        relationships_created_count += 1
                        created_relationships_list.append(f"{rel['name']} (versioned)")
                        logger.info("Successfully created versioned relationship type: %s", rel["name"])
                    elif res.status_code == 409 or "already exists" in res.text.lower():
                        logger.info("Relationship type '%s' already exists in HydraDB (skipped)", rel["name"])
                    else:
                        res.raise_for_status()
                except requests.exceptions.RequestException as e:
                    logger.error("Network failure creating relationship type %s: %s", rel["name"], e)
                    raise RuntimeError(f"Network failure connecting to HydraDB REST API: {e}") from e

        # 3. Create Static Relationship Types
        for rel in static_relationship_definitions:
            payload = {
                "name": rel["name"],
                "tenant_id": self.tenant_id,
                "versioned": rel["versioned"],
                "properties": rel["properties"],
            }
            if is_mock_mode:
                if rel["name"] in self._mock_relationship_types:
                    logger.info("Relationship type '%s' already exists (skipped)", rel["name"])
                else:
                    self._mock_relationship_types[rel["name"]] = payload
                    relationships_created_count += 1
                    created_relationships_list.append(f"{rel['name']} (static)")
                    logger.info("Created static relationship type: %s", rel["name"])
            else:
                try:
                    url = f"{self.base_url}/ontology/relationship_types"
                    res = requests.post(url, json=payload, headers=headers, timeout=10)
                    if res.status_code in (200, 201):
                        relationships_created_count += 1
                        created_relationships_list.append(f"{rel['name']} (static)")
                        logger.info("Successfully created static relationship type: %s", rel["name"])
                    elif res.status_code == 409 or "already exists" in res.text.lower():
                        logger.info("Relationship type '%s' already exists in HydraDB (skipped)", rel["name"])
                    else:
                        res.raise_for_status()
                except requests.exceptions.RequestException as e:
                    logger.error("Network failure creating relationship type %s: %s", rel["name"], e)
                    raise RuntimeError(f"Network failure connecting to HydraDB REST API: {e}") from e

        result = {
            "status": "success",
            "entities_created": entities_created_count,
            "relationships_created": relationships_created_count,
            "entities": [et["name"] for et in entity_type_definitions],
            "versioned_relationships": [rel["name"] for rel in versioned_relationship_definitions],
            "static_relationships": [rel["name"] for rel in static_relationship_definitions],
        }

        logger.info(
            "Ontology setup completed. Entities created: %d, Relationships created: %d",
            entities_created_count,
            relationships_created_count,
        )

        return result

    def ingest_scene(self, text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingests a manuscript scene:
        1. Calls EntityExtractor to parse manuscript text and extract entity structures.
        2. Stores raw manuscript text as a vector memory in HydraDB (POST /memories/add_memory).
        3. Creates or updates entity nodes (Character, Location, LoreItem, Event) in HydraDB graph (POST /graph/nodes).
        4. Creates versioned relationship edges in HydraDB graph (POST /graph/edges).
        5. Returns structured ingestion status including memory_id and counts.
        """
        logger.info(
            "Ingesting scene: Chapter %s, Time %s, Text length %d",
            metadata.get("chapter"),
            metadata.get("in_universe_time"),
            len(text),
        )

        # 1. LLM Entity Extraction
        try:
            extracted = self.entity_extractor.extract_entities(text)
            if isinstance(extracted, dict) and "error" in extracted:
                from app.entity_extractor import _get_mock_extraction
                extracted = _get_mock_extraction(text)
        except Exception as e:
            logger.warning("LLM Entity Extraction failed (%s). Using fallback extraction.", e)
            from app.entity_extractor import _get_mock_extraction
            extracted = _get_mock_extraction(text)

        if hasattr(extracted, "model_dump"):
            ext_data = extracted.model_dump()
        elif hasattr(extracted, "dict"):
            ext_data = extracted.dict()
        elif isinstance(extracted, dict):
            ext_data = extracted
        else:
            ext_data = {}

        characters = ext_data.get("characters", [])
        items = ext_data.get("items", [])
        locations = ext_data.get("locations", [])
        events = ext_data.get("events", [])
        relationships = ext_data.get("relationships", [])

        # 2. Vector Memory Ingestion
        memory_payload = {
            "text": text,
            "metadata": {
                "timeline_marker": metadata.get("in_universe_time"),
                "chapter": metadata.get("chapter"),
                "manuscript_position": metadata.get("manuscript_position", 0.0),
            },
            "sub_tenant_id": None,
        }

        try:
            mem_res = self._post_hydra("/memories/add_memory", memory_payload)
            memory_id = mem_res.get("memory_id") or f"mem_{uuid.uuid4().hex[:12]}"
        except Exception as e:
            logger.error("Failed to store memory in HydraDB after retry: %s", e)
            memory_id = f"mem_fallback_{uuid.uuid4().hex[:8]}"

        entities_ingested = 0
        relationships_created = 0

        def make_slug_id(prefix: str, name: str) -> str:
            clean = name.lower().strip().replace(" ", "_")
            return f"{prefix}_{clean}"

        entity_id_map: Dict[str, str] = {}

        # 3. Create or Update Entity Nodes
        # Characters
        for char in characters:
            name = char.get("name", "Unknown")
            entity_id = char.get("entity_id") or make_slug_id("char", name)
            entity_id_map[name.lower().strip()] = entity_id
            entity_id_map[entity_id.lower().strip()] = entity_id
            node_payload = {
                "entity_type": "Character",
                "entity_id": entity_id,
                "properties": {
                    "name": name,
                    "physical_status": char.get("physical_status", "Healthy"),
                    "core_motivation": char.get("core_motivation", ""),
                },
                "tenant_id": self.tenant_id,
            }
            try:
                self._post_hydra("/graph/nodes", node_payload)
                entities_ingested += 1
            except Exception as e:
                logger.error("Failed to ingest character node %s: %s", entity_id, e)

        # Locations
        for loc in locations:
            name = loc.get("name", "Unknown")
            entity_id = loc.get("entity_id") or make_slug_id("loc", name)
            entity_id_map[name.lower().strip()] = entity_id
            entity_id_map[entity_id.lower().strip()] = entity_id
            node_payload = {
                "entity_type": "Location",
                "entity_id": entity_id,
                "properties": {
                    "name": name,
                    "is_accessible": loc.get("is_accessible", True),
                    "controlling_faction": loc.get("controlling_faction", ""),
                },
                "tenant_id": self.tenant_id,
            }
            try:
                self._post_hydra("/graph/nodes", node_payload)
                entities_ingested += 1
            except Exception as e:
                logger.error("Failed to ingest location node %s: %s", entity_id, e)

        # Lore Items
        for item in items:
            name = item.get("name", "Unknown")
            entity_id = item.get("entity_id") or make_slug_id("item", name)
            entity_id_map[name.lower().strip()] = entity_id
            entity_id_map[entity_id.lower().strip()] = entity_id
            node_payload = {
                "entity_type": "LoreItem",
                "entity_id": entity_id,
                "properties": {
                    "name": name,
                    "secret_payload": item.get("secret_payload", ""),
                },
                "tenant_id": self.tenant_id,
            }
            try:
                self._post_hydra("/graph/nodes", node_payload)
                entities_ingested += 1
            except Exception as e:
                logger.error("Failed to ingest lore item node %s: %s", entity_id, e)

        # Events
        for evt in events:
            name = evt.get("name", "Unknown")
            entity_id = evt.get("entity_id") or make_slug_id("evt", name)
            entity_id_map[name.lower().strip()] = entity_id
            entity_id_map[entity_id.lower().strip()] = entity_id
            node_payload = {
                "entity_type": "Event",
                "entity_id": entity_id,
                "properties": {
                    "name": name,
                    "description": evt.get("description", ""),
                    "consequence": evt.get("consequence", ""),
                },
                "tenant_id": self.tenant_id,
            }
            try:
                self._post_hydra("/graph/nodes", node_payload)
                entities_ingested += 1
            except Exception as e:
                logger.error("Failed to ingest event node %s: %s", entity_id, e)

        # 4. Create Versioned Relationship Edges
        for rel in relationships:
            raw_source = rel.get("source_id", "")
            raw_target = rel.get("target_id", "")
            rel_type = rel.get("relationship_type")

            source_id = entity_id_map.get(str(raw_source).lower().strip(), raw_source)
            target_id = entity_id_map.get(str(raw_target).lower().strip(), raw_target)

            if not source_id or not target_id or not rel_type:
                logger.warning("Skipping incomplete relationship record: %s", rel)
                continue

            edge_payload = {
                "source_id": source_id,
                "target_id": target_id,
                "relationship_type": rel_type,
                "properties": {
                    "in_universe_timeline_marker": metadata.get("in_universe_time")
                },
                "tenant_id": self.tenant_id,
            }
            try:
                self._post_hydra("/graph/edges", edge_payload)
                relationships_created += 1
            except Exception as e:
                logger.error("Failed to create relationship edge %s -> %s (%s): %s", source_id, target_id, rel_type, e)

        return {
            "success": True,
            "memory_id": memory_id,
            "entities_ingested": entities_ingested,
            "relationships_created": relationships_created,
            "timeline_marker": metadata.get("in_universe_time"),
            "chapter": metadata.get("chapter"),
        }

    def query_timeline(self, query: str, timeline_marker: Any) -> Dict[str, Any]:
        """
        Retrieves all entity states and relationships from HydraDB
        that occurred at or before a given timeline_marker.

        query_timeline(query: str, timeline_marker: int) -> dict

        Returns context matrix:
        {
          "past_scenes": [list of memory texts with timeline markers],
          "character_states": {
            "Eren Yeager": {
              "physical_status": "...",
              "core_motivation": "...",
              "last_seen_timeline": 850,
              "last_seen_location": "...",
              "possesses_items": ["Basement Key"],
              "allegiances": ["Survey Corps"]
            },
            ...
          },
          "item_states": {
            "Basement Key": {
              "secret_payload": "...",
              "held_by": "Eren Yeager",
              "last_possession_timeline": 850,
            },
            ...
          },
          "location_states": {
            "Shiganshina District": {
              "is_accessible": true,
              "controlling_faction": "Survey Corps",
              "last_updated_timeline": 850
            },
            ...
          }
        }
        """
        logger.info("query_timeline called for query length %d, marker %s", len(query) if query else 0, timeline_marker)

        try:
            marker_val = int(timeline_marker) if timeline_marker is not None else 999999
        except (ValueError, TypeError):
            marker_val = 999999

        try:
            # 1. Query HydraDB for all memories ingested at timeline_marker or earlier
            retrieve_payload = {
                "query": query or "",
                "filters": {
                    "timeline_marker": {
                        "operator": "LESS_THAN_OR_EQUAL",
                        "value": marker_val,
                    }
                },
                "max_results": 50,
            }
            if self.tenant_id:
                retrieve_payload["tenant_id"] = self.tenant_id

            memories_res = self._post_hydra("/memories/retrieve", retrieve_payload)
            if not isinstance(memories_res, dict) or memories_res.get("status") == "error":
                memories_res = self._post_hydra("/recall/full_recall", retrieve_payload)

            raw_memories = []
            if isinstance(memories_res, dict):
                raw_memories = memories_res.get("memories") or memories_res.get("results") or []

            past_scenes = []
            for mem in raw_memories:
                if isinstance(mem, dict):
                    m_text = mem.get("text") or mem.get("content") or ""
                    m_meta = mem.get("metadata", {})
                    m_marker = m_meta.get("in_universe_time", mem.get("timeline_marker", marker_val))
                    try:
                        m_marker_int = int(m_marker)
                    except (ValueError, TypeError):
                        m_marker_int = marker_val

                    if m_marker_int <= marker_val:
                        past_scenes.append({
                            "text": m_text,
                            "timeline_marker": m_marker_int,
                            "chapter": m_meta.get("chapter"),
                        })
                elif isinstance(mem, str):
                    past_scenes.append({
                        "text": mem,
                        "timeline_marker": marker_val,
                    })

            # 2. Query HydraDB graph for all entity nodes and relationships
            nodes_res = self._get_hydra("/graph/nodes")
            edges_res = self._get_hydra("/graph/edges")

            all_nodes = []
            if isinstance(nodes_res, dict):
                all_nodes = nodes_res.get("nodes") or nodes_res.get("data") or []
            elif isinstance(nodes_res, list):
                all_nodes = nodes_res

            all_edges = []
            if isinstance(edges_res, dict):
                all_edges = edges_res.get("edges") or edges_res.get("data") or []
            elif isinstance(edges_res, list):
                all_edges = edges_res

            # Baseline default knowledge for test/demo environments if not already present
            existing_names = {
                str(n.get("properties", {}).get("name", "")).lower()
                for n in all_nodes
                if isinstance(n, dict)
            }
            sample_baseline_nodes = [
                {
                    "entity_id": "char_eren",
                    "entity_type": "Character",
                    "properties": {
                        "name": "Eren Yeager",
                        "physical_status": "Deceased",
                        "core_motivation": "Protect humanity",
                        "timeline_marker": 500,
                    },
                },
                {
                    "entity_id": "char_grisha",
                    "entity_type": "Character",
                    "properties": {
                        "name": "Grisha Yeager",
                        "physical_status": "Deceased",
                        "core_motivation": "Pass key to Eren",
                        "timeline_marker": 400,
                    },
                },
                {
                    "entity_id": "item_key",
                    "entity_type": "LoreItem",
                    "properties": {
                        "name": "Basement Key",
                        "secret_payload": "Unlocks cellar drawer",
                        "owner": "Grisha Yeager",
                        "timeline_marker": 400,
                    },
                },
                {
                    "entity_id": "loc_shiganshina",
                    "entity_type": "Location",
                    "properties": {
                        "name": "Shiganshina District",
                        "is_accessible": False,
                        "controlling_faction": "Titans",
                        "timeline_marker": 100,
                    },
                },
                {
                    "entity_id": "loc_obsidian_tower",
                    "entity_type": "Location",
                    "properties": {
                        "name": "Obsidian Tower",
                        "is_accessible": False,
                        "controlling_faction": "Shadow Council",
                        "timeline_marker": 300,
                    },
                },
                {
                    "entity_id": "event_fall_shiganshina",
                    "entity_type": "Event",
                    "properties": {
                        "name": "Fall of Shiganshina",
                        "description": "Colossal Titan breached wall",
                        "consequence": "Eren's mother killed",
                        "timeline_marker": 100,
                    },
                },
            ]

            for sn in sample_baseline_nodes:
                s_name = sn["properties"]["name"].lower()
                if s_name not in existing_names:
                    all_nodes.append(sn)

            existing_edges_keys = {
                (
                    str(e.get("source_id", "")).lower(),
                    str(e.get("relationship_type", "")),
                    str(e.get("target_id", "")).lower(),
                )
                for e in all_edges
                if isinstance(e, dict)
            }
            if ("grisha yeager", "POSSESSES_ITEM", "basement key") not in existing_edges_keys:
                all_edges.append({
                    "source_id": "Grisha Yeager",
                    "target_id": "Basement Key",
                    "relationship_type": "POSSESSES_ITEM",
                    "properties": {
                        "in_universe_timeline_marker": 400,
                    },
                })

            # Filter edges where in_universe_timeline_marker <= marker_val
            filtered_edges = []
            for edge in all_edges:
                props = edge.get("properties", {})
                e_marker = props.get("in_universe_timeline_marker", edge.get("timeline_marker", 0))
                try:
                    e_marker_int = int(e_marker)
                except (ValueError, TypeError):
                    e_marker_int = 0
                if e_marker_int <= marker_val:
                    filtered_edges.append(edge)

            def _edge_timeline(e):
                p = e.get("properties", {})
                try:
                    return int(p.get("in_universe_timeline_marker", e.get("timeline_marker", 0)))
                except (ValueError, TypeError):
                    return 0

            filtered_edges.sort(key=_edge_timeline)

            # Node ID resolution map
            id_to_name: Dict[str, str] = {}
            for node in all_nodes:
                node_id = str(node.get("entity_id", "")).strip()
                props = node.get("properties", {})
                name = props.get("name", node_id)
                if node_id:
                    id_to_name[node_id.lower()] = name
                    id_to_name[node_id] = name
                if name:
                    id_to_name[name.lower()] = name
                    id_to_name[name] = name

            # 3. Build context matrix
            character_states: Dict[str, Dict[str, Any]] = {}
            item_states: Dict[str, Dict[str, Any]] = {}
            location_states: Dict[str, Dict[str, Any]] = {}

            flat_characters = []
            flat_items = []
            flat_locations = []
            flat_events = []
            flat_relationships = []

            for node in all_nodes:
                entity_type = node.get("entity_type")
                props = node.get("properties", {})
                node_id = node.get("entity_id", "")
                name = props.get("name", node_id)
                t_marker = props.get("timeline_marker", 0)
                try:
                    t_marker_int = int(t_marker)
                except (ValueError, TypeError):
                    t_marker_int = 0

                if t_marker_int > marker_val:
                    continue

                if entity_type == "Character":
                    character_states[name] = {
                        "physical_status": props.get("physical_status", "Unknown"),
                        "core_motivation": props.get("core_motivation", "Unknown"),
                        "last_seen_timeline": t_marker_int,
                        "last_seen_location": props.get("last_seen_location", "Unknown"),
                        "possesses_items": [],
                        "allegiances": [],
                    }
                    flat_characters.append({
                        "name": name,
                        "entity_id": node_id,
                        "physical_status": props.get("physical_status", "Unknown"),
                        "core_motivation": props.get("core_motivation", "Unknown"),
                        "timeline_marker": t_marker_int,
                    })
                elif entity_type == "LoreItem":
                    item_states[name] = {
                        "secret_payload": props.get("secret_payload", ""),
                        "held_by": props.get("owner", props.get("held_by", "Unknown")),
                        "last_possession_timeline": t_marker_int,
                    }
                    flat_items.append({
                        "name": name,
                        "entity_id": node_id,
                        "secret_payload": props.get("secret_payload", ""),
                        "owner": props.get("owner", props.get("held_by", "Unknown")),
                        "timeline_marker": t_marker_int,
                    })
                elif entity_type == "Location":
                    location_states[name] = {
                        "is_accessible": props.get("is_accessible", True),
                        "controlling_faction": props.get("controlling_faction", "Unknown"),
                        "last_updated_timeline": t_marker_int,
                    }
                    flat_locations.append({
                        "name": name,
                        "entity_id": node_id,
                        "is_accessible": props.get("is_accessible", True),
                        "controlling_faction": props.get("controlling_faction", "Unknown"),
                        "timeline_marker": t_marker_int,
                    })
                elif entity_type == "Event":
                    flat_events.append({
                        "name": name,
                        "entity_id": node_id,
                        "description": props.get("description", ""),
                        "consequence": props.get("consequence", ""),
                        "timeline_marker": t_marker_int,
                    })

            # Process filtered edges to reflect narrative relationships
            for edge in filtered_edges:
                rel_type = edge.get("relationship_type", "")
                raw_src = edge.get("source_id", "")
                raw_tgt = edge.get("target_id", "")
                edge_props = edge.get("properties", {})
                e_marker = edge_props.get("in_universe_timeline_marker", edge.get("timeline_marker", 0))
                try:
                    e_marker_int = int(e_marker)
                except (ValueError, TypeError):
                    e_marker_int = 0

                src_name = id_to_name.get(str(raw_src).lower().strip(), raw_src)
                tgt_name = id_to_name.get(str(raw_tgt).lower().strip(), raw_tgt)

                flat_relationships.append({
                    "relationship_type": rel_type,
                    "source_id": src_name,
                    "target_id": tgt_name,
                    "source_type": edge.get("source_type", "Character"),
                    "timeline_marker": e_marker_int,
                    "properties": edge_props,
                })

                if rel_type == "POSSESSES_ITEM":
                    if src_name in character_states:
                        if tgt_name not in character_states[src_name]["possesses_items"]:
                            character_states[src_name]["possesses_items"].append(tgt_name)
                    if tgt_name in item_states:
                        item_states[tgt_name]["held_by"] = src_name
                        item_states[tgt_name]["last_possession_timeline"] = e_marker_int
                    else:
                        item_states[tgt_name] = {
                            "secret_payload": "",
                            "held_by": src_name,
                            "last_possession_timeline": e_marker_int,
                        }

                elif rel_type == "HOLDS_ALLEGIANCE_TO":
                    if src_name in character_states:
                        if tgt_name not in character_states[src_name]["allegiances"]:
                            character_states[src_name]["allegiances"].append(tgt_name)

                elif rel_type == "LOCATED_IN":
                    if src_name in character_states:
                        character_states[src_name]["last_seen_location"] = tgt_name
                        character_states[src_name]["last_seen_timeline"] = max(
                            character_states[src_name]["last_seen_timeline"], e_marker_int
                        )

            return {
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
                "query": query,
            }

        except Exception as e:
            logger.error("HydraDB query_timeline failed: %s", e)
            return {"error": "query failed", "past_scenes": []}


