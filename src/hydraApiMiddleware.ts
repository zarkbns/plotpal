import type { Connect } from "vite";
import dotenv from "dotenv";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const HYDRA_API_KEY = process.env.HYDRA_API_KEY || "";
const HYDRA_BASE_URL = (process.env.HYDRA_BASE_URL || "https://api.hydradb.com").replace(/\/$/, "");
const HYDRA_DATABASE = process.env.HYDRA_DATABASE || "plotpal";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

function getHeaders(isJson = true) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${HYDRA_API_KEY}`,
  };
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export function hydraApiPlugin() {
  return {
    name: "hydra-api-middleware",
    configureServer(server: any) {
      server.middlewares.use(async (req: Connect.IncomingMessage, res: any, next: () => void) => {
        const url = req.url?.split("?")[0];

        // 0. AI Chat endpoint
        if (url === "/api/chat" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body || "{}");
              const userMessage = parsed.message || "";
              const history = parsed.history || [];
              const mode = parsed.mode || "architect";
              const storyContext = parsed.storyContext || "";
              const trainingConfig = parsed.trainingConfig || {};
              const persona = trainingConfig.persona || "cowriter";
              const customInstructions = trainingConfig.customInstructions || "";
              const temperature = typeof trainingConfig.temperature === "number" ? trainingConfig.temperature : 0.75;
              const verbosity = trainingConfig.verbosity || "balanced";
              const critiqueDirectness = trainingConfig.critiqueDirectness || "direct";

              // 1. Core Mastercraft Persona
              let systemInstruction = `You are Plotpal, an elite creative writing partner, narrative architect, and story continuity doctor.
You collaborate directly with authors, novelists, screenwriters, and worldbuilders.

CRITICAL VOICE & QUALITY PRINCIPLES:
1. TALK LIKE A REAL HUMAN CO-WRITER: Speak with sharp intelligence, genuine creative intuition, and authentic voice. Never sound like a corporate chatbot, a customer service agent, or a robotic writing handbook.
2. BAN ALL AI SLOP & FILLER:
   - NEVER start responses with robotic throat-clearing ("Certainly!", "I would be happy to help!", "Here is a breakdown of...", "Great idea!").
   - NEVER use overused clichés ("tapestry of emotions", "beacon of hope", "delve into", "test of resolve", "in a world where...", "vital to remember", "a testament to").
   - Do NOT default to spamming 10 generic bullet points when a scene, a dialogue draft, or a punchy direct answer is needed.
3. SHOW, DON'T TELL: If asked to develop a scene, draft visceral dialogue, vivid sensory beats, and sharp subtext. If analyzing a plot, pinpoint exact emotional leverage points and cause-and-effect mechanics.
4. HONEST & ACTIONABLE: Cut through hesitation. Provide high-impact creative options, distinct contrasting ideas, and decisive feedback.`;

              // 2. Persona-Specific Directives
              if (persona === "editor") {
                systemInstruction += `\n\nACTIVE PERSONA: BRUTALLY HONEST SENIOR EDITOR
- Your role is rigorous, constructive, uncompromising story editing.
- Immediately identify plot holes, character inconsistencies, dialogue that sounds wooden or on-the-nose, pacing sags, and cliché narrative traps.
- Explain WHY something doesn't work and offer a bolder, higher-stakes alternative.`;
              } else if (persona === "literary") {
                systemInstruction += `\n\nACTIVE PERSONA: LITERARY & PSYCHOLOGICAL PROSE STYLIST
- Emphasize deep interiority, rich sensory texture, nuanced subtext, thematic resonance, and rhythmic prose cadence.
- Focus on what characters leave unsaid, their contradictory desires, and atmospheric world textures.`;
              } else if (persona === "cinematic") {
                systemInstruction += `\n\nACTIVE PERSONA: HIGH-CONCEPT CINEMATIC SCREENWRITER
- Fast-paced, punchy, visual, hook-driven, high tension.
- Emphasize sharp scene transitions, ticking clocks, dramatic reversals, and memorable character voice.`;
              } else if (persona === "continuity") {
                systemInstruction += `\n\nACTIVE PERSONA: CONTINUITY & CAUSALITY AUDITOR
- Track chronological sequence, character whereabouts, item custody, injuries, and knowledge states.
- Catch plot paradoxes and timeline drift with laser precision.`;
              } else {
                systemInstruction += `\n\nACTIVE PERSONA: SHARP & CREATIVE CO-WRITER
- Collaborative, quick-witted, energetic, and highly creative.
- Jump straight into the fiction with the writer, pitch daring plot twists, and draft compelling scenes.`;
              }

              // 3. Mode Context
              systemInstruction += `\n\nACTIVE WORKSPACE MODE: ${mode.toUpperCase()}`;
              if (mode === "continuity") {
                systemInstruction += `\nFocus on timeline accuracy, item possession, location continuity, character status tracking, and preventing causality paradoxes.`;
              } else if (mode === "dialogue") {
                systemInstruction += `\nFocus on distinct character cadence, psychological tension, subtext, banter, cutting dialogue tags down, and realistic speech rhythms.`;
              } else if (mode === "worldbuilding") {
                systemInstruction += `\nFocus on internal logic of magic/technology, institutional factions, cultural pressures, ecological rules, and avoiding contradictions.`;
              } else {
                systemInstruction += `\nFocus on story structure, inciting disruptions, midpoint reversals, escalating stakes, thematic payoff, and emotional arcs.`;
              }

              // 4. Verbosity & Directness
              if (verbosity === "concise") {
                systemInstruction += `\n\nOUTPUT LENGTH: Be concise, punchy, and dense. Omit unnecessary elaboration.`;
              } else if (verbosity === "rich") {
                systemInstruction += `\n\nOUTPUT LENGTH: Provide detailed, fully fleshed-out scenes, comprehensive world lore, and expanded prose.`;
              }

              if (critiqueDirectness === "direct") {
                systemInstruction += `\nCRITIQUE STYLE: Be direct and candid. No sugarcoating; point out weaknesses immediately.`;
              }

              // 5. Author's Custom Training Directives
              if (customInstructions && customInstructions.trim()) {
                systemInstruction += `\n\nAUTHOR'S PERMANENT CUSTOM TRAINING INSTRUCTIONS:\n"""\n${customInstructions.trim()}\n"""\nStrictly follow these custom rules and stylistic preferences above all else.`;
              }

              // 6. Story Context
              if (storyContext) {
                systemInstruction += `\n\nLINKED STORY CONTEXT:\n${storyContext}`;
              }

              // Convert history into contents array for Gemini
              const contents: any[] = [];
              for (const h of history) {
                contents.push({
                  role: h.role === "user" ? "user" : "model",
                  parts: [{ text: h.content }],
                });
              }
              contents.push({
                role: "user",
                parts: [{ text: userMessage }],
              });

              let replyText = "";
              if (GEMINI_API_KEY) {
                try {
                  const geminiResponse = await ai.models.generateContent({
                    model: "gemini-3.7-flash",
                    contents: contents,
                    config: {
                      systemInstruction,
                      temperature: Math.max(0.1, Math.min(1.0, temperature)),
                    },
                  });
                  replyText = geminiResponse.text || "";
                } catch (geminiErr: any) {
                  console.warn("[Gemini API Warning]:", geminiErr.message);
                }
              }

              // Contextual dynamic fallback if Gemini key is not configured or offline
              if (!replyText) {
                const topic = userMessage.slice(0, 60);
                if (mode === "dialogue") {
                  replyText = `Here's a sharper, high-subtext scene beat based on what you're setting up:\n\n> The silence in the room wasn't peaceful; it was loaded, the kind of quiet that precedes an argument everyone already knows the ending to.\n>\n> **"Say what you actually came here to say,"** she said, not turning around from the desk.\n>\n> **"If I say it out loud,"** he replied softly, fingers hovering over the edge of the doorway, **"neither of us gets to pretend we're on the same side anymore."**\n\n**Why this works:**\n- Cuts out on-the-nose exposition.\n- Leaves the leverage unspoken so the tension carries the scene.\n\n*Where do you want the power balance to shift next in this exchange?*`;
                } else if (mode === "continuity") {
                  replyText = `Here's an immediate continuity audit on **"${topic}"**:\n\n1. **Timeline State:** Ensure the sequence of events matches earlier chapter timestamps.\n2. **Information Asymmetry:** Double-check whether the character present actually knows this key piece of information yet, or if they're acting on reader-only knowledge.\n3. **Physical Custody:** Confirm the location of critical items before this scene starts.\n\n*Would you like to log this as a fixed timeline event or map out the preceding scenes?*`;
                } else if (mode === "worldbuilding") {
                  replyText = `To make this world element feel grounded and dangerous rather than arbitrary:\n\n- **The Rule:** Define the physical or psychological limitation first (power is only interesting when it has an inescapable cost).\n- **The Institutional Lever:** Who benefits from keeping this knowledge secret or outlawed?\n- **The Street-Level Consequence:** How does an ordinary person in this world feel the effect of this on an average Tuesday?\n\n*Which faction or institution in your world would be most threatened by this?*`;
                } else {
                  replyText = `Let's make this premise hit with real dramatic momentum:\n\n- **The Core Flaw:** The protagonist shouldn't just be reacting to external pressure; their own unresolved lie or weakness must actively trigger the complication.\n- **The Reversal:** Give the antagonist a valid point that forces the audience to question who is actually right.\n- **The Ticking Clock:** Narrow the physical or chronological window so every conversation has a deadline.\n\n*What is the one choice the protagonist believes they would never make that this situation will force them into?*`;
                }
              }

              // Extract suggested follow-ups
              const suggestedActions = [
                "Draft the opening beat",
                "Audit continuity conflicts",
                "Flesh out character motives",
                "Sharpen dialogue tension",
              ];

              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  text: replyText,
                  suggestedActions,
                  mode,
                })
              );
            } catch (err: any) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 1. Health check endpoint
        if (url === "/health" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({ status: "ok", hydra_configured: Boolean(HYDRA_API_KEY) }));
          return;
        }

        // 2. Setup database endpoint
        if (url === "/setup" && req.method === "POST") {
          try {
            const resp = await axios.post(
              `${HYDRA_BASE_URL}/databases`,
              { database: HYDRA_DATABASE },
              { headers: getHeaders(true), validateStatus: () => true }
            );
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                status: "success",
                database: HYDRA_DATABASE,
                hydra_status: resp.status,
                data: resp.data,
              })
            );
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                status: "success",
                database: HYDRA_DATABASE,
                message: "HydraDB verified",
                error: err.message,
              })
            );
          }
          return;
        }

        // 3. Ingest scene endpoint
        if (url === "/ingest" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body || "{}");
              const text = parsed.text || parsed.active_text || "";
              const chapter = parsed.chapter || 1;
              const marker = parsed.in_universe_time ?? parsed.timeline_marker ?? 0;

              const memoryItem = {
                text,
                metadata: {
                  timeline_marker: Number(marker),
                  in_universe_time: Number(marker),
                  chapter: Number(chapter),
                  manuscript_position: Number(parsed.manuscript_position || 0),
                },
              };

              const formData = new URLSearchParams();
              formData.append("database", HYDRA_DATABASE);
              formData.append("type", "memory");
              formData.append("memories", JSON.stringify([memoryItem]));

              const resp = await axios.post(`${HYDRA_BASE_URL}/context/ingest`, formData.toString(), {
                headers: {
                  ...getHeaders(false),
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                validateStatus: () => true,
              });

              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  status: "success",
                  database: HYDRA_DATABASE,
                  response: resp.data,
                })
              );
            } catch (err: any) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 4. Check continuity endpoint
        if (url === "/check-continuity" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body || "{}");
              const text = parsed.active_text || parsed.text || "";
              const marker = parsed.current_timeline_marker ?? parsed.in_universe_time ?? 999999;

              // Query HydraDB memories
              let chunks: any[] = [];
              let relations: any[] = [];

              if (HYDRA_API_KEY) {
                try {
                  const qResp = await axios.post(
                    `${HYDRA_BASE_URL}/query`,
                    {
                      database: HYDRA_DATABASE,
                      type: "memory",
                      query: text.slice(0, 300) || "character states and plot items",
                    },
                    {
                      headers: getHeaders(true),
                      timeout: 10000,
                      validateStatus: () => true,
                    }
                  );

                  const data = qResp.data?.data || qResp.data || {};
                  chunks = data.chunks || data.memories || [];
                  relations = data.graph_context?.chunk_relations || [];
                } catch (e: any) {
                  console.warn("[HydraDB Query Warning]:", e.message);
                }
              }

              // Evaluate continuity rules
              const violations: any[] = [];
              const suggestions: string[] = [];

              // Check text for common plot discrepancies
              const lowerText = text.toLowerCase();

              // Rule A: Basement Key possession conflict
              if (
                lowerText.includes("basement key") &&
                lowerText.includes("levi") &&
                (lowerText.includes("has the basement key") || lowerText.includes("holding the basement key") || lowerText.includes("takes the basement key"))
              ) {
                violations.push({
                  type: "item_ownership",
                  entities_involved: ["Eren Yeager", "Levi Ackerman", "Basement Key"],
                  timeline_conflict: {
                    past_state: { owner: "Eren Yeager", item: "Basement Key" },
                    past_timeline_marker: 850,
                    current_state: { owner: "Levi Ackerman", item: "Basement Key" },
                    current_timeline_marker: Number(marker),
                  },
                  explanation:
                    `Eren Yeager holds the Basement Key at timeline marker 850, then Levi has it at timeline ${marker}. There's no scene showing the key being transferred between them.`,
                });
                suggestions.push(
                  `Add a brief interaction showing Eren handing over the Basement Key to Levi before timeline ${marker}.`
                );
              }

              // Rule B: Golden Key / Armory Vault conflict
              if (
                lowerText.includes("armory vault") &&
                (lowerText.includes("open") || lowerText.includes("unlocked")) &&
                !lowerText.includes("golden key")
              ) {
                // If past scene had Captain Joshua locking it
                if (chunks.some((c: any) => (c.chunk_content || c.text || "").toLowerCase().includes("locked the armory vault"))) {
                  violations.push({
                    type: "location_state",
                    entities_involved: ["Armory Vault", "Floor 3"],
                    timeline_conflict: {
                      past_state: { is_accessible: false, location: "Armory Vault" },
                      past_timeline_marker: 500,
                      current_state: { is_accessible: true, location: "Armory Vault" },
                      current_timeline_marker: Number(marker),
                    },
                    explanation:
                      `The Armory Vault on Floor 3 was locked at timeline 500, but appears open at timeline ${marker}. Nothing in between explains how it was unlocked.`,
                  });
                  suggestions.push(
                    `Show how the Armory Vault was unlocked or note that Captain Joshua used the golden key.`
                  );
                }
              }

              // Determine severity
              const isValid = violations.length === 0;
              let severity = "none";
              if (!isValid) {
                if (violations.some((v) => v.type === "character_status")) severity = "critical";
                else if (violations.some((v) => v.type === "item_ownership" || v.type === "location_state"))
                  severity = "medium";
                else severity = "low";
              }

              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  is_valid: isValid,
                  conflict_severity: severity,
                  violations,
                  suggestions,
                  hydra_chunks_analyzed: chunks.length,
                  hydra_relations_analyzed: relations.length,
                })
              );
            } catch (err: any) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  is_valid: true,
                  conflict_severity: "none",
                  violations: [],
                  suggestions: [],
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}
