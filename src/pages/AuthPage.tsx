import React, { useState } from "react";
import {
  Flame,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { syncUserProfile, getUserProfile } from "../userStore";
import { UserProfile, NavTab } from "../types";
import { EditorialIllustration } from "../components/EditorialIllustration";

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigate?: (tab: NavTab) => void;
  currentUser: UserProfile | null;
  onSignOut: () => void;
  initialMode?: "signin" | "signup";
}

const CAROUSEL_SLIDES = [
  {
    title: "Narrative Intelligence",
    description: "Architect multi-act plot structures, brainstorm mid-point twists, and polish dialogue seamlessly.",
  },
  {
    title: "Continuity & Timeline Auditor",
    description: "Track chronological markers, character status lifelines, and item ownership across chapters.",
  },
  {
    title: "Worldbuilding & Lore Engine",
    description: "Build robust magic constraints, technology rules, and faction hierarchies without contradictions.",
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  currentUser,
  onSignOut,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Firebase Google Sign In
  const handleFirebaseGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user) {
        throw new Error("No user credential returned from Google.");
      }

      const existingProfile = await getUserProfile(user.uid);

      const userProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || existingProfile?.name || "Author",
        email: user.email || existingProfile?.email || "",
        picture:
          user.photoURL ||
          existingProfile?.picture ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        role: "Author",
        isAuthenticated: true,
        manuscripts: existingProfile?.manuscripts || [],
      };

      await syncUserProfile(user.uid, userProfile);

      setSuccessMessage(`Welcome back, ${userProfile.name}! Opening your studio...`);
      setTimeout(() => {
        onLoginSuccess(userProfile);
      }, 400);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setIsSigningIn(false);

      if (error.code === "auth/popup-closed-by-user") {
        setErrorMessage("Sign-in popup was closed before completing.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setErrorMessage("Sign-in request was cancelled.");
      } else if (error.code === "auth/popup-blocked") {
        setErrorMessage("The sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setErrorMessage(
          error.message || "Failed to sign in with Google. Please try again."
        );
      }
    }
  };

  return (
    <div className="editorial-auth-screen">
      {/* Outer Framed Window Card */}
      <div className="editorial-auth-frame">
        {/* 1. Left Slim Vertical Sidebar */}
        <aside className="editorial-slim-sidebar">
          <div className="slim-brand-flame" title="Plotpal">
            <div className="flame-icon-circle">
              <Flame size={20} className="flame-icon-svg" />
            </div>
          </div>

          <nav className="slim-nav-group" aria-label="Quick navigation">
            <button
              type="button"
              className="slim-nav-item active"
              title="Studio"
            >
              <MessageSquare size={19} />
              <span className="slim-nav-label">Studio</span>
            </button>
          </nav>

          <div className="slim-nav-bottom">
            {currentUser?.isAuthenticated && (
              <button
                type="button"
                className="slim-nav-item"
                onClick={onSignOut}
                title="Logout"
              >
                <span className="slim-nav-label">Logout</span>
              </button>
            )}
          </div>
        </aside>

        {/* 2. Main Framed Inner Content Area (2 Columns) */}
        <main className="editorial-auth-inner-box">
          {/* Left Column: Feature Illustration */}
          <section className="editorial-feature-panel">
            <div className="feature-illustration-card">
              <EditorialIllustration className="feature-illustration-svg" />
            </div>

            <div className="feature-text-block">
              <h2 className="feature-title">{CAROUSEL_SLIDES[activeSlide].title}</h2>
              <p className="feature-description">
                {CAROUSEL_SLIDES[activeSlide].description}
              </p>

              {/* Carousel Pagination Dots */}
              <div className="feature-pagination-dots" role="tablist">
                {CAROUSEL_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pagination-dot ${activeSlide === idx ? "active" : ""}`}
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Right Column: Clean Framed Account Form with Google Sign-in only */}
          <section className="editorial-form-panel flex flex-col justify-center">
            <div className="form-header-block text-left mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF4EF] border border-[#FA541C] text-[#FA541C] text-xs font-bold rounded-sm mb-3">
                <Sparkles size={13} />
                <span>Author Workspace</span>
              </div>
              <h1 className="form-main-heading text-2xl font-bold text-[#1E1B18]">
                Sign in to Plotpal
              </h1>
              <p className="form-sub-heading text-sm text-[#635A50] mt-1.5">
                Sign in with your Google account to access your storylines, timeline auditors, and private plots.
              </p>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="auth-alert-banner error mb-4">
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="auth-alert-banner success mb-4">
                <CheckCircle2 size={15} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Google Authentication Single Action */}
            <div className="social-auth-stack mt-2">
              <button
                type="button"
                className="btn-social-outline w-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F0] border-2 border-[#1E1B18] rounded text-[#1E1B18] font-bold text-base shadow-[0_2px_0_#1E1B18] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleFirebaseGoogleSignIn}
                disabled={isSigningIn}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  className="social-brand-icon shrink-0"
                >
                  <path
                    fill="#EA4335"
                    d="M12 5c1.56 0 2.96.57 4.07 1.5l3.05-3.05C17.26 1.7 14.81 1 12 1 7.37 1 3.4 3.66 1.44 7.54l3.66 2.84C6.01 7.39 8.76 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.17-2 3.71-4.96 3.71-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.1 14.62c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L1.44 7.08C.52 8.92 0 10.98 0 13.14s.52 4.22 1.44 6.06l3.66-2.84z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.08.72-2.46 1.16-4.22 1.16-3.24 0-5.99-2.39-6.9-5.38L1.44 15.83C3.4 19.71 7.37 23 12 23z"
                  />
                </svg>
                <span>
                  {isSigningIn ? "Connecting to Google..." : "Continue with Google"}
                </span>
              </button>
            </div>

            {/* Security Assurance Badge */}
            <div className="mt-8 pt-6 border-t border-[#1E1B18]/10 flex items-center justify-center gap-2 text-xs text-[#8A7E73]">
              <ShieldCheck size={14} className="text-[#34A853]" />
              <span>Secure authentication protected by Firebase</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AuthPage;
