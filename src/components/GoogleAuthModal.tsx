import React, { useState } from "react";
import {
  X,
  Flame,
  Home,
  LayoutGrid,
  BookOpen,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { syncUserProfile, getUserProfile } from "../userStore";
import { UserProfile } from "../types";
import { EditorialIllustration } from "./EditorialIllustration";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFirebaseGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);

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
      onLoginSuccess(userProfile);
      setIsSigningIn(false);
      onClose();
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setIsSigningIn(false);

      if (error.code === "auth/popup-closed-by-user") {
        setErrorMessage("Sign-in popup was closed before completing.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setErrorMessage("Sign-in was cancelled.");
      } else {
        setErrorMessage(
          error.message || "Failed to sign in with Google. Please try again."
        );
      }
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter email and password.");
      return;
    }
    const dummyName = email.split("@")[0] || "Author";
    const userProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      name: dummyName.charAt(0).toUpperCase() + dummyName.slice(1),
      email: email.trim(),
      picture:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Author",
      isAuthenticated: true,
      manuscripts: [],
    };
    onLoginSuccess(userProfile);
    onClose();
  };

  return (
    <div className="editorial-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="editorial-auth-frame modal-framed-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top right */}
        <button
          type="button"
          className="editorial-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Left Slim Vertical Sidebar */}
        <aside className="editorial-slim-sidebar">
          <div className="slim-brand-flame" title="Plotpal">
            <div className="flame-icon-circle">
              <Flame size={20} className="flame-icon-svg" />
            </div>
          </div>

          <nav className="slim-nav-group">
            <div className="slim-nav-item active">
              <Home size={19} />
              <span className="slim-nav-label">Home</span>
            </div>
            <div className="slim-nav-item">
              <LayoutGrid size={19} />
              <span className="slim-nav-label">Studio</span>
            </div>
            <div className="slim-nav-item">
              <BookOpen size={19} />
              <span className="slim-nav-label">Storylines</span>
            </div>
          </nav>

          <div className="slim-nav-bottom" />
        </aside>

        {/* Main Inner Content Area (2 Columns) */}
        <main className="editorial-auth-inner-box">
          {/* Left Column: Illustration */}
          <section className="editorial-feature-panel">
            <div className="feature-illustration-card">
              <EditorialIllustration className="feature-illustration-svg" />
            </div>

            <div className="feature-text-block">
              <h2 className="feature-title">Story Continuity Workspace</h2>
              <p className="feature-description">
                Write scene drafts and track characters, timelines, and narrative consistency seamlessly.
              </p>
            </div>
          </section>

          {/* Right Column: Clean Framed Account Form */}
          <section className="editorial-form-panel">
            <div className="form-header-block">
              <h1 className="form-main-heading">
                {isSignUp ? "Create an account" : "Sign in to account"}
              </h1>
              <p className="form-sub-heading">
                Sign in with your Google account to access your Plotpal dashboard
              </p>
            </div>

            {errorMessage && (
              <div className="auth-alert-banner error">
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="social-auth-stack">
              <button
                type="button"
                className="btn-social-outline"
                onClick={handleFirebaseGoogleSignIn}
                disabled={isSigningIn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="social-brand-icon">
                  <path fill="#EA4335" d="M12 5c1.56 0 2.96.57 4.07 1.5l3.05-3.05C17.26 1.7 14.81 1 12 1 7.37 1 3.4 3.66 1.44 7.54l3.66 2.84C6.01 7.39 8.76 5 12 5z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.17-2 3.71-4.96 3.71-8.7z" />
                  <path fill="#FBBC05" d="M5.1 14.62c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L1.44 7.08C.52 8.92 0 10.98 0 13.14s.52 4.22 1.44 6.06l3.66-2.84z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.08.72-2.46 1.16-4.22 1.16-3.24 0-5.99-2.39-6.9-5.38L1.44 15.83C3.4 19.71 7.37 23 12 23z" />
                </svg>
                <span>{isSigningIn ? "Connecting..." : "Continue with Google"}</span>
              </button>
            </div>

            <div className="editorial-divider">
              <span className="divider-rule" />
              <span className="divider-label">
                {isSignUp ? "or sign up with email" : "or sign in with email"}
              </span>
              <span className="divider-rule" />
            </div>

            <form onSubmit={handleEmailSubmit} className="editorial-credentials-form">
              <div className="form-field-group">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="editorial-input-text"
                  required
                />
              </div>

              <div className="form-field-group password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="editorial-input-text"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                className="btn-editorial-primary-orange"
                disabled={isSigningIn}
              >
                {isSigningIn ? "Please wait..." : "Continue"}
              </button>
            </form>

            <div className="form-footer-toggle">
              <span>{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>
              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                }}
              >
                {isSignUp ? "Sign In" : "Create Account"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
