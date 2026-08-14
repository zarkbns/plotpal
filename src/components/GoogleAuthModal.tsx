import React, { useState } from "react";
import { X, ShieldCheck, AlertCircle } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { syncUserProfile, getUserProfile } from "../userStore";
import { UserProfile } from "../types";

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

      // Fetch or initialize Firestore profile (stores only name, email, manuscript titles/IDs)
      const existingProfile = await getUserProfile(user.uid);

      const userProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || existingProfile?.name || "Plot Author",
        email: user.email || existingProfile?.email || "",
        picture:
          user.photoURL ||
          existingProfile?.picture ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        role: "Narrative Architect",
        isAuthenticated: true,
        manuscripts: existingProfile?.manuscripts || [],
      };

      // Sync minimal profile to Firestore
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

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card google-auth-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="google-svg-logo"
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
            <span>Sign in with Google</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="google-auth-content">
          <p className="google-auth-intro">
            Sign in with your Google account to access your Plotpal dashboard,
            load your story manuscripts, and check plot continuity with HydraDB.
          </p>

          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                borderRadius: "6px",
                color: "#DC2626",
                fontSize: "12px",
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Firebase Google Sign-In button */}
          <button
            type="button"
            className="btn-google-sign-in"
            onClick={handleFirebaseGoogleSignIn}
            disabled={isSigningIn}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
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

          <div className="auth-security-notice">
            <ShieldCheck size={14} className="security-icon" />
            <span>
              Firebase Auth manages your identity securely. All manuscript
              text, vector embeddings, and continuity graph states are processed
              exclusively by HydraDB.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
