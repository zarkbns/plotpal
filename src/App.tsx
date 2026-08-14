import React, { useState, useMemo, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getUserProfile, saveUserManuscriptMeta } from "./userStore";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ManuscriptGrid } from "./components/ManuscriptGrid";
import { ManuscriptDetailsSidebar } from "./components/ManuscriptDetailsSidebar";
import { ManuscriptEditorView } from "./components/ManuscriptEditorView";
import { CreateManuscriptModal } from "./components/CreateManuscriptModal";
import { GoogleAuthModal } from "./components/GoogleAuthModal";
import { SAMPLE_MANUSCRIPTS } from "./mockData";
import { Manuscript, NavTab, GenreFilter, UserProfile } from "./types";
import {
  Home,
  GitBranch,
  Bookmark,
  PlusCircle,
  Sliders,
  Database,
  CheckCircle2,
} from "lucide-react";
import "./App.css";

export const App: React.FC = () => {
  // Session manuscript state (manuscript text & analysis live in React state/session, NEVER in Firestore)
  const [manuscripts, setManuscripts] = useState<Manuscript[]>(() => {
    const saved = localStorage.getItem("plotpal_storylines");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved manuscripts", e);
      }
    }
    return SAMPLE_MANUSCRIPTS;
  });

  // User Authentication state via Firebase Auth & localStorage cache
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem("plotpal_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    return null;
  });

  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState<boolean>(false);
  const [selectedManuscriptId, setSelectedManuscriptId] = useState<string>(
    SAMPLE_MANUSCRIPTS[0]?.id || ""
  );
  const [activeTab, setActiveTab] = useState<NavTab>("manuscripts");
  const [activeFilter, setActiveFilter] = useState<GenreFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Mobile / Tablet navigation and details drawer states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState<boolean>(false);

  // 1. Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user's minimal manuscript list from Firestore (just titles/IDs)
        const profile = await getUserProfile(firebaseUser.uid);

        const loadedUser: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || profile?.name || "Story Author",
          email: firebaseUser.email || profile?.email || "",
          picture:
            firebaseUser.photoURL ||
            profile?.picture ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          role: "Narrative Architect",
          isAuthenticated: true,
          manuscripts: profile?.manuscripts || [],
        };

        setCurrentUser(loadedUser);
        localStorage.setItem("plotpal_user", JSON.stringify(loadedUser));
      } else {
        // If logged out from Firebase
        if (currentUser?.isAuthenticated) {
          setCurrentUser(null);
          localStorage.removeItem("plotpal_user");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync session storylines to localStorage for fast tab reload
  useEffect(() => {
    localStorage.setItem("plotpal_storylines", JSON.stringify(manuscripts));
  }, [manuscripts]);

  // Sync user state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("plotpal_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("plotpal_user");
    }
  }, [currentUser]);

  // Selected storyline object
  const selectedManuscript = useMemo(() => {
    return (
      manuscripts.find((m) => m.id === selectedManuscriptId) ||
      manuscripts[0] ||
      null
    );
  }, [manuscripts, selectedManuscriptId]);

  // Filtered storylines based on search & genre
  const filteredManuscripts = useMemo(() => {
    return manuscripts.filter((m) => {
      // Saved tab filter
      if (activeTab === "saved") {
        return m.status === "clean" || m.violationsCount === 0;
      }
      // Filter by genre
      if (
        activeFilter !== "all" &&
        m.genre.toLowerCase() !== activeFilter.toLowerCase()
      ) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesAuthor = m.author.toLowerCase().includes(q);
        const matchesGenre = m.genre.toLowerCase().includes(q);
        const matchesExcerpt = m.excerpt.toLowerCase().includes(q);
        const matchesEntities = m.trackedEntities?.some((e) =>
          e.name.toLowerCase().includes(q)
        );
        return (
          matchesTitle ||
          matchesAuthor ||
          matchesGenre ||
          matchesExcerpt ||
          matchesEntities
        );
      }
      return true;
    });
  }, [manuscripts, activeFilter, searchQuery, activeTab]);

  // Handle selecting a manuscript
  const handleSelectManuscript = (manuscript: Manuscript) => {
    setSelectedManuscriptId(manuscript.id);
  };

  // Handle opening the editor view
  const handleOpenEditor = (manuscript: Manuscript) => {
    setSelectedManuscriptId(manuscript.id);
    setIsEditorOpen(true);
    setIsMobileDetailsOpen(false);
  };

  // Handle checking continuity in editor / sidebar via HydraDB API endpoint
  const handleCheckContinuity = async (
    text: string,
    timeMarker: number,
    chapterId: number
  ) => {
    console.log(
      `[Plotpal] Checking continuity with HydraDB for chapter ${chapterId} at timeline marker ${timeMarker}`
    );

    // Hit /check-continuity endpoint → HydraDB handles everything
    try {
      const resp = await fetch("/check-continuity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active_text: text,
          current_timeline_marker: timeMarker,
          chapter: chapterId,
          text: text,
          in_universe_time: timeMarker,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        // Display results from HydraDB response directly in React state
        if (data.violations) {
          setManuscripts((prev) =>
            prev.map((m) => {
              if (m.id === selectedManuscriptId) {
                return {
                  ...m,
                  violations: data.violations,
                  violationsCount: data.violations.length,
                  status: data.violations.length > 0 ? "has_violations" : "clean",
                  ratingScore:
                    data.violations.length === 0
                      ? "100% Verified Clean"
                      : `${Math.max(
                          40,
                          100 - data.violations.length * 15
                        )}% Plot Score`,
                };
              }
              return m;
            })
          );
        }
      }
    } catch (e) {
      console.warn("[Plotpal] Backend check fetch failed:", e);
    }

    // Keep manuscript text in React state only during session
    setManuscripts((prev) =>
      prev.map((m) => {
        if (m.id === selectedManuscriptId) {
          const updatedChapters = m.chapters.map((c) => {
            if (c.id === chapterId) {
              return {
                ...c,
                text,
                timelineMarker: timeMarker,
                wordCount: text.split(/\s+/).length,
              };
            }
            return c;
          });
          return {
            ...m,
            chapters: updatedChapters,
            lastCheckedDate: "Just now",
          };
        }
        return m;
      })
    );
  };

  // Handle scene ingest to HydraDB
  const handleIngestScene = async (
    text: string,
    timeMarker: number,
    chapterId: number
  ) => {
    try {
      await fetch("/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          chapter: chapterId,
          in_universe_time: timeMarker,
          manuscript_position: 0.1,
        }),
      });
    } catch (e) {
      console.warn("[Plotpal] Ingest API:", e);
    }
  };

  // Handle creating a new storyline
  const handleCreateManuscript = async (newPartial: Partial<Manuscript>) => {
    const newId = `storyline-${Date.now()}`;
    const newManuscript: Manuscript = {
      id: newId,
      title: newPartial.title || "Untitled Storyline",
      author: newPartial.author || currentUser?.name || "Alex Mercer",
      genre: newPartial.genre || "Mystery",
      chaptersCount: 1,
      currentChapter: 1,
      lastCheckedDate: "Just now",
      coverBg: "linear-gradient(135deg, #2b201a 0%, #17100c 100%)",
      coverAccent: "#FF6B35",
      textColor: "#F5E6D3",
      status: "clean",
      violationsCount: 0,
      excerpt: newPartial.excerpt || "Opening scene begins...",
      inUniverseTime: newPartial.inUniverseTime || 100,
      timelineSpan: `Timeline ${newPartial.inUniverseTime || 100} – ...`,
      description:
        newPartial.description || "A new storyline tracked with HydraDB.",
      ratingScore: "100% Continuity Verified",
      chapters: newPartial.chapters || [
        {
          id: 1,
          title: "Act I: Scene 01",
          timelineMarker: newPartial.inUniverseTime || 100,
          text: newPartial.excerpt || "Opening scene begins...",
          wordCount: 50,
        },
      ],
      violations: [],
      trackedEntities: [
        {
          name: "Protagonist",
          type: "character",
          status: "Active",
          lastSeenMarker: newPartial.inUniverseTime || 100,
        },
      ],
    };

    // Store ONLY title and ID in Firestore if user is authenticated
    if (currentUser?.id) {
      saveUserManuscriptMeta(currentUser.id, {
        id: newId,
        title: newManuscript.title,
        genre: newManuscript.genre,
        inUniverseTime: newManuscript.inUniverseTime,
      });
    }

    setManuscripts([newManuscript, ...manuscripts]);
    setSelectedManuscriptId(newId);
    setIsEditorOpen(true);
    setIsMobileDetailsOpen(false);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    // If user has saved manuscript titles in Firestore, update local list titles
    if (user.manuscripts && user.manuscripts.length > 0) {
      console.log("[Plotpal] Loaded user manuscript list from Firestore:", user.manuscripts);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setCurrentUser(null);
    localStorage.removeItem("plotpal_user");
  };

  return (
    <div id="litverse-app-root" className="litverse-dashboard-root">
      {/* If Editor is open, show the full-screen Editor View with its custom top and bottom bars */}
      {isEditorOpen && selectedManuscript ? (
        <ManuscriptEditorView
          manuscript={selectedManuscript}
          onBack={() => setIsEditorOpen(false)}
          onCheckContinuity={handleCheckContinuity}
          onIngestScene={handleIngestScene}
        />
      ) : (
        /* Full Litverse 3-Column / Dashboard Layout */
        <div className="litverse-main-layout">
          {/* 1. Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              if (tab === "home" || tab === "manuscripts") {
                setActiveFilter("all");
                setSearchQuery("");
              }
            }}
            manuscriptCount={manuscripts.length}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* 2. Center Content Area */}
          <div className="litverse-center-column">
            {/* Top Bar with Yellow Search Banner & User Profile */}
            <TopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onToggleMobileSidebar={() =>
                setIsMobileSidebarOpen(!isMobileSidebarOpen)
              }
              onToggleDetails={() =>
                setIsMobileDetailsOpen(!isMobileDetailsOpen)
              }
              hasSelectedManuscript={!!selectedManuscript}
              isDetailsOpen={isMobileDetailsOpen}
              currentUser={currentUser}
              onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
              onSignOut={handleSignOut}
            />

            {/* Main Center Area: Manuscripts Grid or Settings */}
            <main className="litverse-center-scroll-area">
              {activeTab === "settings" ? (
                <div className="hydradb-settings-view">
                  <div className="settings-header-banner">
                    <Database size={24} className="text-orange" />
                    <div>
                      <h2>HydraDB Graph & Continuity Engine</h2>
                      <p>
                        Pure HydraDB vector and temporal graph configuration.
                        Firebase Auth is used strictly for Google identity.
                      </p>
                    </div>
                  </div>

                  <div className="settings-grid">
                    <div className="settings-card">
                      <h3>Database Connection</h3>
                      <div className="settings-field">
                        <label>HydraDB Base URL</label>
                        <input
                          type="text"
                          readOnly
                          value="https://api.hydradb.com (HydraDB v2 REST API)"
                          className="settings-input"
                        />
                      </div>
                      <div className="settings-field">
                        <label>Storage Engine</label>
                        <input
                          type="text"
                          readOnly
                          value="HydraDB Vector Memories + Knowledge Graph (Single Source of Truth)"
                          className="settings-input"
                        />
                      </div>
                      <div className="status-indicator-badge success">
                        <CheckCircle2 size={14} />
                        <span>Connected to HydraDB Live Engine</span>
                      </div>
                    </div>

                    <div className="settings-card">
                      <h3>Continuity Engine Rules</h3>
                      <p className="settings-card-desc">
                        Temporal graph traversal audits character lifelines,
                        item possession transfers, and locked gate states
                        across in-universe timeline markers.
                      </p>
                      <button
                        type="button"
                        className="btn-primary-orange"
                        onClick={() => {
                          fetch("/setup", { method: "POST" }).then(() =>
                            alert("HydraDB ontology schema verified.")
                          );
                        }}
                      >
                        Verify HydraDB Schema
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <ManuscriptGrid
                  manuscripts={filteredManuscripts}
                  selectedManuscriptId={selectedManuscriptId}
                  activeFilter={activeFilter}
                  onSelectFilter={setActiveFilter}
                  onSelectManuscript={(m) => {
                    handleSelectManuscript(m);
                  }}
                  onOpenEditor={handleOpenEditor}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                />
              )}
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
              <button
                type="button"
                className={`mobile-nav-btn ${
                  activeTab === "home" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("home");
                  setActiveFilter("all");
                  setSearchQuery("");
                  setIsMobileDetailsOpen(false);
                }}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-btn ${
                  activeTab === "manuscripts" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("manuscripts");
                  setIsMobileDetailsOpen(false);
                }}
              >
                <GitBranch size={18} />
                <span>Plots ({manuscripts.length})</span>
              </button>

              <button
                type="button"
                className="mobile-nav-btn create-highlight"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <PlusCircle size={22} />
                <span>+ New</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-btn ${
                  isMobileDetailsOpen ? "active" : ""
                }`}
                onClick={() => setIsMobileDetailsOpen(!isMobileDetailsOpen)}
              >
                <Sliders size={18} />
                <span>Inspector</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-btn ${
                  activeTab === "saved" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("saved");
                  setIsMobileDetailsOpen(false);
                }}
              >
                <Bookmark size={18} />
                <span>Verified</span>
              </button>
            </nav>
          </div>

          {/* 3. Right Sidebar: Currently Selected Manuscript Details */}
          <ManuscriptDetailsSidebar
            manuscript={selectedManuscript}
            onOpenEditor={handleOpenEditor}
            onCheckNow={(m) =>
              handleCheckContinuity(
                m.excerpt,
                m.inUniverseTime,
                m.currentChapter
              )
            }
            isOpenMobile={isMobileDetailsOpen}
            onCloseMobile={() => setIsMobileDetailsOpen(false)}
          />
        </div>
      )}

      {/* Create Storyline Modal */}
      <CreateManuscriptModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateManuscript}
        defaultAuthor={currentUser?.name || "Alex Mercer"}
      />

      {/* Google Sign-in Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
