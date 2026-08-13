import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.schemas import SceneIngestion, ContinuityCheck, EntityExtraction
from app.hydra_client import HydraClient
from app.continuity_engine import check_continuity

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("plotpal.api")

app = FastAPI(
    title="Plotpal",
    description="Manuscript Continuity Checker API",
    version="0.1.0"
)

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize client stub
hydra_client = HydraClient()


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """
    Health check endpoint returning service status.
    """
    logger.info("Health check endpoint called")
    return {"status": "ok"}


@app.post("/setup", status_code=status.HTTP_200_OK)
def setup_ontology():
    """
    One-time setup call to establish HydraDB ontology schema (entity types & relationship types).
    """
    logger.info("POST /setup called - initializing HydraDB ontology schema")
    try:
        result = hydra_client.setup_ontology()
        return result
    except Exception as e:
        logger.error("Error during ontology setup: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to setup HydraDB ontology: {str(e)}"
        )


@app.post("/ingest", status_code=status.HTTP_200_OK)
def ingest_scene(scene: SceneIngestion):
    """
    Ingest a manuscript scene payload: extracts entities, stores vector memory,
    and updates HydraDB graph state.
    """
    logger.info(
        "Ingest received: Chapter %d | In-Universe Time %d | Text Length %d | Position %s",
        scene.chapter,
        scene.in_universe_time,
        len(scene.text),
        scene.manuscript_position,
    )
    metadata = {
        "in_universe_time": scene.in_universe_time,
        "chapter": scene.chapter,
        "manuscript_position": scene.manuscript_position,
    }
    result = hydra_client.ingest_scene(scene.text, metadata)
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Scene ingestion failed"),
        )
    return result


@app.post("/continuity/check", status_code=status.HTTP_200_OK)
def run_continuity_check(check_req: ContinuityCheck):
    """
    Check active manuscript text segment for plot holes and continuity violations against HydraDB history.
    """
    marker = check_req.current_timeline_marker if check_req.current_timeline_marker is not None else 999999
    logger.info("POST /continuity/check received for timeline_marker %s", marker)
    return check_continuity(check_req.active_text, marker, hydra_client)


@app.get("/", response_class=HTMLResponse)
def root_dashboard():
    """
    Interactive API landing page for Plotpal preview UI.
    """
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Plotpal - Manuscript Continuity Checker API</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
        </style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen p-6 md:p-12">
        <div class="max-w-4xl mx-auto space-y-8">
            <header class="border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <span class="p-2 bg-indigo-600 rounded-lg text-lg">📖</span> Plotpal
                    </h1>
                    <p class="text-slate-400 text-sm mt-1">Manuscript Continuity Checker API & HydraDB Scaffold</p>
                </div>
                <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-emerald-400 font-mono">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    API Online
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Health Card -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                    <h2 class="text-lg font-semibold text-slate-200">System Status</h2>
                    <p class="text-xs text-slate-400">Endpoint: <code class="text-indigo-400 font-mono">GET /health</code></p>
                    <button id="healthBtn" onclick="checkHealth()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors">
                        Test /health Endpoint
                    </button>
                    <pre id="healthResult" class="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-mono text-slate-300 hidden"></pre>
                </div>

                <!-- Setup Ontology Card -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                    <h2 class="text-lg font-semibold text-slate-200">Ontology Setup</h2>
                    <p class="text-xs text-slate-400">Endpoint: <code class="text-indigo-400 font-mono">POST /setup</code></p>
                    <button id="setupBtn" onclick="runSetup()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors">
                        Initialize HydraDB Schema
                    </button>
                    <pre id="setupResult" class="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-mono text-slate-300 hidden"></pre>
                </div>

                <!-- API Specs Card -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                    <h2 class="text-lg font-semibold text-slate-200">Interactive API Docs</h2>
                    <p class="text-xs text-slate-400">Swagger UI and OpenAPI specifications</p>
                    <div class="flex gap-3">
                        <a href="/docs" target="_blank" class="flex-1 text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm py-2 px-4 rounded-lg transition-colors">
                            Swagger ↗
                        </a>
                        <a href="/redoc" target="_blank" class="flex-1 text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm py-2 px-4 rounded-lg transition-colors">
                            ReDoc ↗
                        </a>
                    </div>
                </div>
            </div>

            <!-- Ingest Scene Tester -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 class="text-lg font-semibold text-slate-200">Test Scene Ingestion (<code class="text-indigo-400 font-mono text-sm">POST /ingest</code>)</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                        <label class="block text-slate-400 mb-1">Chapter</label>
                        <input id="chapterInput" type="number" value="1" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                    </div>
                    <div>
                        <label class="block text-slate-400 mb-1">In-Universe Time (Timestamp / Sequence)</label>
                        <input id="timeInput" type="number" value="1001" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                    </div>
                </div>
                <div>
                    <label class="block text-slate-400 text-xs mb-1">Manuscript Text</label>
                    <textarea id="textInput" rows="3" class="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">Elara picked up the silver key from the obsidian table, hiding it carefully inside her left boot.</textarea>
                </div>
                <button onclick="testIngest()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2 px-6 rounded-lg transition-colors">
                    Send Test Payload
                </button>
                <pre id="ingestResult" class="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-mono text-slate-300 hidden"></pre>
            </div>

            <!-- Scaffold Info -->
            <div class="border-t border-slate-800 pt-6 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-4">
                <div>
                    Scaffold Modules:
                    <span class="text-slate-400">app.hydra_client</span> |
                    <span class="text-slate-400">app.schemas</span> |
                    <span class="text-slate-400">app.entity_extractor</span> |
                    <span class="text-slate-400">app.continuity_engine</span>
                </div>
                <div>Python 3.11+ • FastAPI • Pydantic • HydraDB</div>
            </div>
        </div>

        <script>
            async function checkHealth() {
                const el = document.getElementById("healthResult");
                el.classList.remove("hidden");
                el.textContent = "Checking...";
                try {
                    const res = await fetch("/health");
                    const data = await res.json();
                    el.textContent = JSON.stringify(data, null, 2);
                } catch (e) {
                    el.textContent = "Error: " + e.message;
                }
            }

            async function runSetup() {
                const el = document.getElementById("setupResult");
                el.classList.remove("hidden");
                el.textContent = "Running ontology setup...";
                try {
                    const res = await fetch("/setup", { method: "POST" });
                    const data = await res.json();
                    el.textContent = JSON.stringify(data, null, 2);
                } catch (e) {
                    el.textContent = "Error: " + e.message;
                }
            }

            async function testIngest() {
                const el = document.getElementById("ingestResult");
                el.classList.remove("hidden");
                el.textContent = "Sending...";
                const payload = {
                    text: document.getElementById("textInput").value,
                    chapter: parseInt(document.getElementById("chapterInput").value) || 1,
                    in_universe_time: parseInt(document.getElementById("timeInput").value) || 1000,
                    manuscript_position: 0.15
                };
                try {
                    const res = await fetch("/ingest", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    el.textContent = JSON.stringify(data, null, 2);
                } catch (e) {
                    el.textContent = "Error: " + e.message;
                }
            }
        </script>
    </body>
    </html>
    """
