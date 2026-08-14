import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  Zap,
  ShieldAlert,
  Feather,
  Film,
  Brain,
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { AiTrainingConfig, PersonaTone } from "../types";

interface AiTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiTrainingConfig;
  onSaveConfig: (newConfig: AiTrainingConfig) => void;
}

export const PERSONA_PRESETS: Array<{
  id: PersonaTone;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  defaultTemp: number;
  badgeColor: string;
}> = [
  {
    id: "cowriter",
    label: "Sharp Co-Writer",
    tagline: "Direct & Collaborative",
    icon: Zap,
    description:
      "Jumps straight into brainstorming and prose drafting without robotic filler. Fast-paced, punchy, and highly creative.",
    defaultTemp: 0.75,
    badgeColor: "bg-[#FFF4EF] text-[#FA541C] border-[#FA541C]/30",
  },
  {
    id: "editor",
    label: "Brutally Honest Editor",
    tagline: "Uncompromising Critique",
    icon: ShieldAlert,
    description:
      "Ruthlessly identifies plot holes, wooden dialogue, pacing sags, and clichés. Pinpoints flaws with actionable solutions.",
    defaultTemp: 0.45,
    badgeColor: "bg-[#FFF1F0] text-[#E03131] border-[#E03131]/30",
  },
  {
    id: "literary",
    label: "Literary Stylist",
    tagline: "Subtext & Atmospheric Prose",
    icon: Feather,
    description:
      "Focuses on psychological depth, visceral sensory details, rhythmic sentence cadence, and characters' unspoken tension.",
    defaultTemp: 0.8,
    badgeColor: "bg-[#F3E8FF] text-[#7928CA] border-[#7928CA]/30",
  },
  {
    id: "cinematic",
    label: "Cinematic Screenwriter",
    tagline: "Hook-Driven & High Tension",
    icon: Film,
    description:
      "Fast-moving scene beats, ticking clocks, sharp reversals, and visual storytelling tailored for page-turners.",
    defaultTemp: 0.7,
    badgeColor: "bg-[#E6FFFA] text-[#00897B] border-[#00897B]/30",
  },
  {
    id: "continuity",
    label: "Continuity Auditor",
    tagline: "Rigid Logic & Timelines",
    icon: Brain,
    description:
      "Strict chronological tracking, entity possession verification, causality checks, and zero tolerance for timeline paradoxes.",
    defaultTemp: 0.25,
    badgeColor: "bg-[#EFF6FF] text-[#1D4ED8] border-[#1D4ED8]/30",
  },
];

const QUICK_PROMPT_SNIPPETS = [
  "Write like Hemingway: short, active sentences with zero fluff",
  "Grimdark tone: morally gray, visceral stakes, realistic grit",
  "Ruthlessly call out weak dialogue and cliché descriptions",
  "Focus on psychological subtext and unsaid character desires",
  "Write punchy scene dialogue with minimal dialogue tags",
  "Never give generic advice—draft actual scenes and beats",
];

export const AiTrainingModal: React.FC<AiTrainingModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<AiTrainingConfig>(config);
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen) return null;

  const handleSelectPersona = (p: PersonaTone) => {
    const preset = PERSONA_PRESETS.find((item) => item.id === p);
    setLocalConfig((prev) => ({
      ...prev,
      persona: p,
      temperature: preset ? preset.defaultTemp : prev.temperature,
    }));
  };

  const handleAddSnippet = (snippet: string) => {
    setLocalConfig((prev) => {
      const current = prev.customInstructions.trim();
      const next = current ? `${current}\n- ${snippet}` : `- ${snippet}`;
      return { ...prev, customInstructions: next };
    });
  };

  const handleResetDefaults = () => {
    setLocalConfig({
      persona: "cowriter",
      customInstructions: "",
      temperature: 0.75,
      verbosity: "balanced",
      critiqueDirectness: "direct",
      autoInjectStoryContext: true,
    });
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF7F0] border-2 border-[#1E1B18] rounded-md shadow-[6px_6px_0px_#1E1B18] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#1E1B18] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1E1B18] text-[#FAF7F0] flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E1B18] font-display leading-none">
                AI Voice & Persona Training
              </h2>
              <p className="text-xs text-[#635A50] mt-0.5">
                Train your co-writer's tone, critique sharpness, and custom rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded border border-[#1E1B18] hover:bg-[#FAF7F0] text-[#1E1B18] transition-colors"
            aria-label="Close training dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Voice & Persona Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E1B18]">
                1. Voice & Writing Style Persona
              </label>
              <span className="text-[11px] text-[#8A7E73]">
                Sets baseline tone & personality
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERSONA_PRESETS.map((preset) => {
                const isSelected = localConfig.persona === preset.id;
                const IconComponent = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPersona(preset.id)}
                    className={`text-left p-3 rounded border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-white border-[#1E1B18] shadow-[3px_3px_0px_#1E1B18]"
                        : "bg-[#FAF7F0] border-[#1E1B18]/30 hover:border-[#1E1B18] hover:bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-[#1E1B18]">
                          <IconComponent size={16} className="shrink-0 text-[#FA541C]" />
                          <span>{preset.label}</span>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#1E1B18] text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#635A50] line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Author Directives / Training Memory */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E1B18]">
                2. Custom Directives & Rules (Train Your Assistant)
              </label>
              <span className="text-[11px] text-[#8A7E73]">
                Applied to every chat response
              </span>
            </div>

            <textarea
              value={localConfig.customInstructions}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, customInstructions: e.target.value })
              }
              rows={4}
              placeholder="e.g. Write in concise, punchy prose. Ban cliché metaphors. Never give conversational fluff—jump straight into the scene. Call out when dialogue feels unnatural."
              className="w-full p-3 text-sm bg-white border-2 border-[#1E1B18] rounded focus:outline-none focus:ring-2 focus:ring-[#FA541C] text-[#1E1B18] placeholder-[#8A7E73]"
            />

            {/* Quick Prompt Inserters */}
            <div className="mt-2.5">
              <div className="text-[11px] font-bold text-[#635A50] mb-1.5 flex items-center gap-1">
                <Sparkles size={12} className="text-[#FA541C]" />
                <span>Click to insert quick writing rules:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPT_SNIPPETS.map((snippet, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSnippet(snippet)}
                    className="text-[11px] py-1 px-2 bg-white hover:bg-[#FFF4EF] border border-[#1E1B18]/40 hover:border-[#FA541C] rounded text-[#1E1B18] transition-colors whitespace-nowrap"
                  >
                    + {snippet}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Fine-Tuning Sliders & Formatting */}
          <div className="border-t border-[#1E1B18]/20 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E1B18] flex items-center gap-1.5">
                <SlidersHorizontal size={14} />
                <span>3. Creativity & Response Controls</span>
              </label>
            </div>

            {/* Temperature Slider */}
            <div className="bg-white p-3.5 border border-[#1E1B18]/30 rounded">
              <div className="flex items-center justify-between text-xs font-bold text-[#1E1B18] mb-1.5">
                <span>Creativity & Imagination:</span>
                <span className="font-mono bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#1E1B18]/20">
                  {localConfig.temperature < 0.4
                    ? `${localConfig.temperature} (Logical & Strict)`
                    : localConfig.temperature > 0.8
                    ? `${localConfig.temperature} (Wild & Uninhibited)`
                    : `${localConfig.temperature} (Balanced Creative)`}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={localConfig.temperature}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-[#FA541C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8A7E73] mt-1">
                <span>Strict / Precise (0.1)</span>
                <span>Balanced (0.7)</span>
                <span>High Imagination (1.0)</span>
              </div>
            </div>

            {/* Verbosity & Critique Style Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Output Length */}
              <div className="bg-white p-3 border border-[#1E1B18]/30 rounded">
                <label className="block text-xs font-bold text-[#1E1B18] mb-1.5">
                  Output Length
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["concise", "balanced", "rich"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, verbosity: v })}
                      className={`text-xs py-1 px-1.5 rounded font-semibold capitalize border ${
                        localConfig.verbosity === v
                          ? "bg-[#1E1B18] text-white border-[#1E1B18]"
                          : "bg-[#FAF7F0] text-[#635A50] border-transparent hover:border-[#1E1B18]/30"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Critique Directness */}
              <div className="bg-white p-3 border border-[#1E1B18]/30 rounded">
                <label className="block text-xs font-bold text-[#1E1B18] mb-1.5">
                  Critique Style
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      { id: "direct", label: "Candid & Direct" },
                      { id: "gentle", label: "Encouraging" },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setLocalConfig({
                          ...localConfig,
                          critiqueDirectness: c.id as any,
                        })
                      }
                      className={`text-xs py-1 px-1.5 rounded font-semibold border ${
                        localConfig.critiqueDirectness === c.id
                          ? "bg-[#1E1B18] text-white border-[#1E1B18]"
                          : "bg-[#FAF7F0] text-[#635A50] border-transparent hover:border-[#1E1B18]/30"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-[#1E1B18] bg-white">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-[#635A50] hover:text-[#1E1B18] font-bold py-1.5 px-3 rounded hover:bg-[#FAF7F0] transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold py-2 px-4 rounded border border-[#1E1B18] text-[#1E1B18] hover:bg-[#FAF7F0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-bold py-2 px-5 rounded bg-[#FA541C] hover:bg-[#E04511] text-white border-2 border-[#1E1B18] shadow-[2px_2px_0px_#1E1B18] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
            >
              {saveToast ? <Check size={14} /> : <Sparkles size={14} />}
              <span>{saveToast ? "Saved Training!" : "Apply Training"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
