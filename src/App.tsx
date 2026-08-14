import React, { useState, useMemo, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getUserProfile, saveUserManuscriptMeta } from "./userStore";
import { ChatInterface } from "./components/ChatInterface";
import { ManuscriptEditorView } from "./components/ManuscriptEditorView";
import { CreateManuscriptModal } from "./components/CreateManuscriptModal";
import { AuthPage } from "./pages/AuthPage";
import { Manuscript, UserProfile } from "./types";
import "./App.css";

export const App: React.FC = () => {
  // Session manuscript state (clean user storylines, start fresh without mock clutter)
  const [manuscripts, setManuscripts] = useState<Manuscript[]>(() => {
    const saved = localStorage.getItem("plotpal_storylines");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock data if present
          const clean = parsed.filter(
            (m) =>
              m.title !== "The Clockwork Conspiracy" &&
              m.title !== "Echoes of the Void" &&
              m.author !== "Elena Vance" &&
              m.author !== "Marcus Reed"
          );
          return clean;
        }
      } catch (e) {
        console.error("Failed to parse saved manuscripts", e);
      }
    }
    return [];
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

  const [selectedManuscriptId, setSelectedManuscriptId] = useState<string>(
    manuscripts[0]?.id || ""
  );

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Clear legacy mock data once on mount
  useEffect(() => {
    const legacyStorylines = localStorage.getItem("plotpal_storylines");
    if (legacyStorylines) {
      try {
        const parsed = JSON.parse(legacyStorylines);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (m) =>
              m.title !== "The Clockwork Conspiracy" &&
              m.title !== "Echoes of the Void" &&
              m.author !== "Elena Vance" &&
              m.author !== "Marcus Reed"
          );
          if (clean.length !== parsed.length) {
            localStorage.setItem("plotpal_storylines", JSON.stringify(clean));
            setManuscripts(clean);
          }
        }
      } catch (e) {
        console.warn("Storage cleanup notice:", e);
      }
    }
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);

        const loadedUser: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || profile?.name || "Author",
          email: firebaseUser.email || profile?.email || "",
          picture:
            firebaseUser.photoURL ||
            profile?.picture ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          role: "Author",
          isAuthenticated: true,
          manuscripts: profile?.manuscripts || [],
        };

        setCurrentUser(loadedUser);
        localStorage.setItem("plotpal_user", JSON.stringify(loadedUser));
      } else {
        if (currentUser?.isAuthenticated) {
          setCurrentUser(null);
          localStorage.removeItem("plotpal_user");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync storylines to localStorage
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

  const handleSelectManuscript = (manuscript: Manuscript) => {
    setSelectedManuscriptId(manuscript.id);
  };

  const handleOpenEditor = (manuscript: Manuscript) => {
    setSelectedManuscriptId(manuscript.id);
    setIsEditorOpen(true);
  };

  // Handle checking continuity in editor
  const handleCheckContinuity = async (
    text: string,
    timeMarker: number,
    chapterId: number
  ) => {
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
                      ? "Continuity Verified"
                      : `${data.violations.length} Issues`,
                };
              }
              return m;
            })
          );
        }
      }
    } catch (e) {
      console.warn("Check continuity error:", e);
    }

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
      console.warn("Ingest API:", e);
    }
  };

  // Handle creating a new storyline
  const handleCreateManuscript = async (newPartial: Partial<Manuscript>) => {
    const newId = `storyline-${Date.now()}`;
    const newManuscript: Manuscript = {
      id: newId,
      title: newPartial.title || "Untitled Storyline",
      author: newPartial.author || currentUser?.name || "Author",
      genre: newPartial.genre || "Mystery",
      chaptersCount: 1,
      currentChapter: 1,
      lastCheckedDate: "Just now",
      coverBg: "linear-gradient(135deg, #2b201a 0%, #17100c 100%)",
      coverAccent: "#FA541C",
      textColor: "#F7F3EA",
      status: "clean",
      violationsCount: 0,
      excerpt: newPartial.excerpt || "Opening scene begins...",
      inUniverseTime: newPartial.inUniverseTime || 100,
      timelineSpan: `Timeline ${newPartial.inUniverseTime || 100} – ...`,
      description: newPartial.description || "A new storyline.",
      ratingScore: "Continuity Verified",
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
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
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

  // =========================================================================
  // GATED AUTHENTICATION: Must log in before being able to see the app
  // =========================================================================
  if (!currentUser || !currentUser.isAuthenticated) {
    return (
      <div id="plotpal-app-root" className="litverse-dashboard-root">
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          currentUser={null}
          onSignOut={handleSignOut}
          initialMode="signin"
        />
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED APP VIEWS: AI Chat Studio with New Plot & Chat History Slide
  // =========================================================================
  return (
    <div id="plotpal-app-root" className="litverse-dashboard-root">
      {isEditorOpen && selectedManuscript ? (
        /* Full Storyline Editor View */
        <ManuscriptEditorView
          manuscript={selectedManuscript}
          onBack={() => setIsEditorOpen(false)}
          onCheckContinuity={handleCheckContinuity}
          onIngestScene={handleIngestScene}
        />
      ) : (
        /* Primary Home View: Plotpal AI Chat Studio */
        <ChatInterface
          currentUser={currentUser}
          manuscripts={manuscripts}
          onOpenStorylines={() => {}}
          onOpenEditor={handleOpenEditor}
          onCreateManuscript={handleCreateManuscript}
          onSignOut={handleSignOut}
        />
      )}

      {/* Create Storyline Modal */}
      <CreateManuscriptModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateManuscript}
        defaultAuthor={currentUser?.name || "Author"}
      />
    </div>
  );
};

export default App;
