import React, { useState, useRef, useEffect } from "react";
import {
  Flame,
  Send,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  BookOpen,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  Layers,
  FileText,
  User,
  LogOut,
  ShieldCheck,
  Compass,
  Menu,
  ArrowDown,
  Sliders,
  Zap,
  ShieldAlert,
  Feather,
  Film,
  Brain,
} from "lucide-react";
import { ChatMessage, ChatThread, ChatMode, Manuscript, UserProfile, AiTrainingConfig } from "../types";
import { Sidebar } from "./Sidebar";
import { AiTrainingModal, PERSONA_PRESETS } from "./AiTrainingModal";

interface ChatInterfaceProps {
  currentUser: UserProfile;
  manuscripts: Manuscript[];
  onOpenStorylines: () => void;
  onOpenEditor: (manuscript: Manuscript) => void;
  onCreateManuscript: (partial: Partial<Manuscript>) => void;
  onSignOut: () => void;
}

const MODE_DEFINITIONS: Record<
  ChatMode,
  { label: string; icon: any; tagline: string; placeholder: string }
> = {
  architect: {
    label: "Plot Architect",
    icon: Compass,
    tagline: "Beat sheets, 3-act arcs, escalation curves & plot twists",
    placeholder: "Describe your story premise, inciting incident, or plot dilemma...",
  },
  continuity: {
    label: "Continuity Auditor",
    icon: Clock,
    tagline: "Timeline markers, item ownership, location states & paradox checks",
    placeholder: "Paste a scene or describe a sequence to check for continuity errors...",
  },
  dialogue: {
    label: "Dialogue & Scene",
    icon: MessageSquare,
    tagline: "Character voice, psychological subtext & tense confrontation beats",
    placeholder: "Who is speaking, what are they hiding, and what is at stake?...",
  },
  worldbuilding: {
    label: "Worldbuilding",
    icon: Layers,
    tagline: "Magic systems, tech rules, factions & cultural lore logic",
    placeholder: "Ask about lore consistency, magic constraints, or faction tensions...",
  },
};

const SUGGESTION_PROMPTS: Record<ChatMode, string[]> = {
  architect: [
    "Design a 3-act beat sheet for a psychological thriller",
    "Brainstorm 3 unpredictable midpoint plot twists",
    "Structure an escalating countdown climax for Act III",
    "How do I fix a sagging middle in a multi-POV novel?",
  ],
  continuity: [
    "Audit: Character A gives the key to B in Ch 1, but uses it in Ch 3",
    "Calculate travel time & timeline markers for a horse journey",
    "Track inventory & weapon ownership across 4 battle scenes",
    "Verify timeline sync between two parallel subplots",
  ],
  dialogue: [
    "Write a confrontation where both characters lie about the same secret",
    "Sharpen the dialogue voice between an old detective and a rookie",
    "Draft a terse negotiation scene where silence speaks louder than words",
    "Give character dialogue more distinct cadence and vocabulary",
  ],
  worldbuilding: [
    "Create a hard magic system with 3 severe physical consequences",
    "Develop conflicting faction laws between two rival city-states",
    "Establish the internal rules for an ancient memory-wiping relic",
    "Build a believable tech-decay hierarchy in a fallen metropolis",
  ],
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  manuscripts,
  onOpenStorylines,
  onOpenEditor,
  onCreateManuscript,
  onSignOut,
}) => {
  // Chat Threads State
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem(`plotpal_threads_${currentUser.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved chat threads", e);
      }
    }
    const initialThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: "Story Architecture & Plot Outline",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: "architect",
      messages: [
        {
          id: `msg-welcome`,
          role: "assistant",
          content: `### Welcome to Plotpal AI Studio, **${currentUser.name}**.\n\nI am your **AI narrative architect, story doctor, and timeline continuity assistant**. \n\nSelect a specialized mode above or try one of the prompt actions below:`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mode: "architect",
          suggestedActions: [
            "Design a 3-act beat sheet for a thriller",
            "Brainstorm 3 unpredictable plot twists",
            "Audit a timeline for continuity holes",
            "Draft a tense confrontation scene",
          ],
        },
      ],
    };
    return [initialThread];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(
    () => threads[0]?.id || ""
  );
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState<boolean>(false);

  // AI Voice & Training Configuration
  const [trainingConfig, setTrainingConfig] = useState<AiTrainingConfig>(() => {
    const saved = localStorage.getItem(`plotpal_ai_training_${currentUser.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (e) {
        console.error("Failed to parse saved AI training config", e);
      }
    }
    return {
      persona: "cowriter",
      customInstructions: "",
      temperature: 0.75,
      verbosity: "balanced",
      critiqueDirectness: "direct",
      autoInjectStoryContext: true,
    };
  });

  const handleSaveTrainingConfig = (newConfig: AiTrainingConfig) => {
    setTrainingConfig(newConfig);
    if (currentUser?.id) {
      localStorage.setItem(
        `plotpal_ai_training_${currentUser.id}`,
        JSON.stringify(newConfig)
      );
    }
  };

  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active Thread
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activeMode: ChatMode = activeThread?.mode || "architect";

  // Persist threads per user
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`plotpal_threads_${currentUser.id}`, JSON.stringify(threads));
    }
  }, [threads, currentUser]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesViewportRef.current) {
      messagesViewportRef.current.scrollTo({
        top: messagesViewportRef.current.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  // Scroll listener to detect if user scrolled up
  const handleScroll = () => {
    if (!messagesViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesViewportRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    // If user is more than 150px away from bottom, show scroll down button
    setShowScrollBottomBtn(distanceFromBottom > 150);
  };

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    scrollToBottom("smooth");
  }, [activeThread?.messages, isLoading]);

  // Instant scroll on active thread change
  useEffect(() => {
    scrollToBottom("auto");
    setShowScrollBottomBtn(false);
  }, [activeThreadId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  const handleCreateNewThread = (mode: ChatMode = "architect") => {
    const newId = `thread-${Date.now()}`;
    const modeConfig = MODE_DEFINITIONS[mode];
    const newThread: ChatThread = {
      id: newId,
      title: `New ${modeConfig.label} Session`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: mode,
      storylineId: selectedStoryId || undefined,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `### Plotpal ${modeConfig.label}\n\n${modeConfig.tagline}.\n\nHow would you like to begin this session?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mode: mode,
          suggestedActions: SUGGESTION_PROMPTS[mode],
        },
      ],
    };

    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length === 1) {
      // If deleting the only thread, recreate clean thread
      handleCreateNewThread("architect");
      return;
    }
    const nextThreads = threads.filter((t) => t.id !== id);
    setThreads(nextThreads);
    if (activeThreadId === id) {
      setActiveThreadId(nextThreads[0]?.id || "");
    }
  };

  const handleSwitchMode = (mode: ChatMode) => {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, mode } : t))
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading || !activeThread) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: userTimestamp,
      mode: activeMode,
    };

    // Update title if it's the default title
    const isFirstUserMsg = activeThread.messages.filter((m) => m.role === "user").length === 0;
    const updatedTitle = isFirstUserMsg
      ? query.slice(0, 32) + (query.length > 32 ? "..." : "")
      : activeThread.title;

    const updatedMessages = [...activeThread.messages, userMsg];

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              title: updatedTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : t
      )
    );

    setInputMessage("");
    setIsLoading(true);

    // Get storyline context if linked
    let storyContext = "";
    if (selectedStoryId) {
      const story = manuscripts.find((m) => m.id === selectedStoryId);
      if (story) {
        storyContext = `Story: "${story.title}" (${story.genre})\nTimeline: ${story.timelineSpan}\nExcerpt: ${story.excerpt}\nChapters: ${story.chaptersCount}`;
      }
    }

    try {
      // Build history for API
      const historyPayload = updatedMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload.slice(0, -1),
          mode: activeMode,
          storyContext,
          trainingConfig,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `msg-b-${Date.now()}`,
        role: "assistant",
        content: data.text || "I have analyzed your narrative beat.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: activeMode,
        suggestedActions: data.suggestedActions || SUGGESTION_PROMPTS[activeMode],
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: [...t.messages, botMsg],
              }
            : t
        )
      );
    } catch (err: any) {
      console.warn("Chat API error:", err);
      const fallbackMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: `### ⚠️ Notice\n\nI was unable to complete the live request (${err.message || "Network issue"}).\n\nHere is a narrative principle to keep in mind for **${activeMode}**:\n*Ensure the protagonist makes active choices under rising stakes, where each victory demands a proportional sacrifice.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: activeMode,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: [...t.messages, fallbackMsg],
              }
            : t
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleCreateStorylineFromChat = (content: string) => {
    const cleanExcerpt = content
      .replace(/[#*`>]/g, "")
      .trim()
      .slice(0, 300);
    onCreateManuscript({
      title: activeThread.title || "New Storyline",
      genre: activeMode === "worldbuilding" ? "Fantasy" : "Mystery",
      excerpt: cleanExcerpt || "Opening scene generated from Plotpal AI...",
      inUniverseTime: 100,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeModeConfig = MODE_DEFINITIONS[activeMode];
  const ModeIcon = activeModeConfig.icon;

  const activePersonaConfig =
    PERSONA_PRESETS.find((p) => p.id === trainingConfig.persona) ||
    PERSONA_PRESETS[0];
  const PersonaIcon = activePersonaConfig.icon;

  return (
    <div className="chat-layout-root">
      {/* Left Chat & Threads Sidebar with New Plot & Chat History */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={(id) => {
          setActiveThreadId(id);
          setIsMobileSidebarOpen(false);
        }}
        onNewPlot={() => handleCreateNewThread(activeMode)}
        onDeleteThread={handleDeleteThread}
        currentUser={currentUser}
        onSignOut={onSignOut}
      />

      {/* Main Chat Stream & Workspace Column */}
      <div className="chat-main-column">
        {/* Top Control Bar */}
        <header className="chat-topbar">
          <div className="chat-topbar-left">
            <button
              type="button"
              className="chat-mobile-toggle-btn"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-label="Open chats menu"
              title="Recent Plots & History"
            >
              <Menu size={20} />
              <span className="font-semibold text-sm">Chats</span>
            </button>

            <div className="active-thread-heading-group">
              <div className="mode-badge-pill">
                <ModeIcon size={14} className="text-[#FA541C]" />
                <span>{activeModeConfig.label}</span>
              </div>
              <h2 className="active-thread-title">
                {activeThread?.title || "Story Architecture Session"}
              </h2>
            </div>
          </div>

          {/* Topbar Right Controls */}
          <div className="chat-topbar-right">
            {/* Story Context Selector */}
            {manuscripts.length > 0 && (
              <div className="story-context-select-wrapper">
                <select
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  className="story-context-dropdown"
                  aria-label="Ground AI in Storyline"
                >
                  <option value="">No Story Linked</option>
                  {manuscripts.map((m) => (
                    <option key={m.id} value={m.id}>
                      📖 {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* AI Voice & Persona Training Button */}
            <button
              type="button"
              className="text-xs py-1.5 px-2.5 flex items-center gap-1.5 bg-white hover:bg-[#FAF7F0] border border-[#1E1B18] rounded font-bold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] active:translate-y-[1px] active:shadow-none transition-all"
              onClick={() => setIsTrainingModalOpen(true)}
              title="Train AI Voice, Persona & Rules"
            >
              <Sliders size={13} className="text-[#FA541C]" />
              <span className="hidden md:inline font-bold">
                Voice: {activePersonaConfig.label.split(" ")[0]}
              </span>
              <span className="md:hidden font-bold">Voice</span>
            </button>

            {/* New Plot Top Action Button */}
            <button
              type="button"
              className="btn-editorial-primary-orange text-xs py-1.5 px-3 flex items-center gap-1.5"
              onClick={() => handleCreateNewThread(activeMode)}
              title="Create New Plot"
            >
              <Plus size={14} />
              <span className="font-bold hidden sm:inline">New Plot</span>
            </button>

            {/* Profile Dropdown */}
            <div className="profile-menu-container">
              <button
                type="button"
                className="topbar-profile-trigger"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="profile-thumb"
                  />
                ) : (
                  <span className="profile-initial">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="profile-label">{currentUser.name}</span>
                <ChevronDown size={13} />
              </button>

              {isProfileMenuOpen && (
                <div className="topbar-profile-dropdown">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{currentUser.name}</div>
                    <div className="dropdown-user-email">{currentUser.email}</div>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-action-btn text-danger"
                    onClick={onSignOut}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Specialized Mode Switcher Bar */}
        <div className="chat-mode-tabs-bar">
          {(Object.keys(MODE_DEFINITIONS) as ChatMode[]).map((modeKey) => {
            const config = MODE_DEFINITIONS[modeKey];
            const Icon = config.icon;
            const isSelected = activeMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                className={`mode-tab-pill ${isSelected ? "active" : ""}`}
                onClick={() => handleSwitchMode(modeKey)}
              >
                <Icon size={14} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Feed Stream with Auto-Scroll Tracking */}
        <main
          ref={messagesViewportRef}
          onScroll={handleScroll}
          className="chat-messages-viewport"
        >
          <div className="chat-messages-container">
            {activeThread?.messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <article
                  key={msg.id}
                  className={`chat-message-row ${
                    isAssistant ? "assistant-row" : "user-row"
                  }`}
                >
                  <div className="message-body-col">
                    <div
                      className={`message-content-box ${
                        isAssistant ? "assistant-bubble" : "user-bubble"
                      }`}
                    >
                      {/* Render formatted message content */}
                      {formatMessageContent(msg.content, !isAssistant)}
                    </div>

                    <div className="message-meta-footer">
                      <span className="msg-timestamp">{msg.timestamp}</span>
                    </div>

                    {/* AI Message Action Tools */}
                    {isAssistant && (
                      <div className="message-tools-row">
                        <button
                          type="button"
                          className="msg-tool-btn"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check size={13} className="text-green-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="msg-tool-btn primary"
                          onClick={() => handleCreateStorylineFromChat(msg.content)}
                          title="Create a new storyline draft with this content"
                        >
                          <BookOpen size={13} />
                          <span>Send to Storyline Draft</span>
                        </button>
                      </div>
                    )}

                    {/* Follow-up Prompt Suggestions */}
                    {isAssistant &&
                      msg.suggestedActions &&
                      msg.suggestedActions.length > 0 && (
                        <div className="suggested-prompts-tray">
                          <span className="tray-label">Quick Follow-ups:</span>
                          <div className="prompt-chips-flow">
                            {msg.suggestedActions.map((sug, i) => (
                              <button
                                key={i}
                                type="button"
                                className="suggestion-chip"
                                onClick={() => handleSendMessage(sug)}
                              >
                                <span>{sug}</span>
                                <ArrowRight size={11} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </article>
              );
            })}

            {/* Live Typing / Thinking Indicator */}
            {isLoading && (
              <div className="chat-message-row assistant-row thinking-row">
                <div className="message-body-col">
                  <div className="thinking-bubble">
                    <div className="typing-dots">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                    <span className="thinking-text">
                      Plotpal is analyzing narrative structure & timeline...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="messages-bottom-anchor" />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottomBtn && (
            <button
              type="button"
              className="scroll-bottom-floating-pill"
              onClick={() => scrollToBottom("smooth")}
              aria-label="Scroll to latest messages"
              title="Jump to latest messages"
            >
              <ArrowDown size={14} />
              <span>Jump to latest</span>
            </button>
          )}
        </main>

        {/* Input Bar Section */}
        <footer className="chat-input-footer">
          <div className="chat-input-wrapper">
            <div className="input-header-indicator flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="active-mode-label">
                  Mode: <strong>{activeModeConfig.label}</strong>
                </span>
                {selectedStoryId && (
                  <span className="linked-story-tag">
                    📖 Linked to:{" "}
                    {manuscripts.find((m) => m.id === selectedStoryId)?.title}
                  </span>
                )}
              </div>

              {/* Active Persona Pill & Quick Trainer Access */}
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E1B18] hover:text-[#FA541C] bg-white hover:bg-[#FFF4EF] px-2 py-0.5 rounded border border-[#1E1B18]/30 transition-all shadow-[1px_1px_0_#1E1B18]"
                title="Click to tune voice, persona, or custom training instructions"
              >
                <PersonaIcon size={12} className="text-[#FA541C] shrink-0" />
                <span>Voice: {activePersonaConfig.label}</span>
                {trainingConfig.customInstructions?.trim() && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#FA541C]"
                    title="Custom rules active"
                  />
                )}
                <span className="text-[10px] text-[#8A7E73] ml-0.5">⚙️</span>
              </button>
            </div>

            <div className="input-textarea-row">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeModeConfig.placeholder}
                rows={1}
                className="chat-textarea"
                disabled={isLoading}
              />

              <button
                type="button"
                className="btn-send-message"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>

            <div className="input-footer-hints">
              <span>
                <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line
              </span>
              <span>Plotpal Narrative Engine</span>
            </div>
          </div>
        </footer>
      </div>

      {/* AI Voice & Persona Training Modal */}
      <AiTrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        config={trainingConfig}
        onSaveConfig={handleSaveTrainingConfig}
      />
    </div>
  );
};

/**
 * Format markdown paragraphs, headings, blockquotes, bold text, and lists cleanly
 */
function formatMessageContent(content: string, isUser = false) {
  if (isUser) {
    return <div className="user-message-plain">{content}</div>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentBlockquote: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushBlockquote = (key: string) => {
    if (currentBlockquote.length > 0) {
      elements.push(
        <blockquote key={key} className="editorial-blockquote">
          {currentBlockquote.map((line, li) => (
            <p key={li}>{renderInlineFormatting(line)}</p>
          ))}
        </blockquote>
      );
      currentBlockquote = [];
    }
  };

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="editorial-list">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith(">")) {
      flushList(`flush-list-${index}`);
      currentBlockquote.push(trimmed.replace(/^>\s?/, ""));
      return;
    } else {
      flushBlockquote(`flush-bq-${index}`);
    }

    if (trimmed.startsWith("### ")) {
      flushList(`flush-list-${index}`);
      elements.push(
        <h3 key={index} className="editorial-h3">
          {renderInlineFormatting(trimmed.replace(/^###\s+/, ""))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList(`flush-list-${index}`);
      elements.push(
        <h2 key={index} className="editorial-h2">
          {renderInlineFormatting(trimmed.replace(/^##\s+/, ""))}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      flushList(`flush-list-${index}`);
      elements.push(
        <div key={index} className="editorial-numbered-step">
          {renderInlineFormatting(trimmed)}
        </div>
      );
    } else if (trimmed === "") {
      flushList(`flush-list-${index}`);
    } else {
      flushList(`flush-list-${index}`);
      elements.push(
        <p key={index} className="editorial-p">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  });

  flushBlockquote("final-bq");
  flushList("final-list");

  return <>{elements}</>;
}

/**
 * Handle bolding (**text**) and code (`text`) in lines
 */
function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[#1E1B18]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-[#EFE8DC] text-[#1E1B18] px-1.5 py-0.5 rounded font-mono text-[12px] border border-[#1E1B18]/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default ChatInterface;
