import React from "react";
import {
  ArrowRight,
  Flame
} from "lucide-react";
import { UserProfile, GenreFilter, NavTab } from "../types";

interface LandingProps {
  onNavigateToStudio: (genre?: GenreFilter) => void;
  onNavigateToAuth: () => void;
  onOpenGoogleAuth: () => void;
  currentUser: UserProfile | null;
  onSignOut: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

interface SpineItem {
  id: string;
  genre: GenreFilter;
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
  height: string;
  zIndex: number;
}

const SPINES: SpineItem[] = [
  {
    id: "spine-scifi",
    genre: "scifi",
    title: "Sci-Fi Timelines",
    subtitle: "Dilation & Tech Lifelines",
    bgColor: "#F07138",
    textColor: "#FFFFFF",
    height: "360px",
    zIndex: 10,
  },
  {
    id: "spine-mystery",
    genre: "mystery",
    title: "Item Ownership",
    subtitle: "Alibis & Key Transfers",
    bgColor: "#234C6E",
    textColor: "#FFFFFF",
    height: "410px",
    zIndex: 20,
  },
  {
    id: "spine-fantasy",
    genre: "fantasy",
    title: "Worldbuilding Lore",
    subtitle: "Gate States & Magic Laws",
    bgColor: "#347952",
    textColor: "#FFFFFF",
    height: "460px",
    zIndex: 30,
  },
  {
    id: "spine-historical",
    genre: "historical",
    title: "Historical Epics",
    subtitle: "Chronology & Era Events",
    bgColor: "#E25A65",
    textColor: "#FFFFFF",
    height: "510px",
    zIndex: 40,
  },
];

export const Landing: React.FC<LandingProps> = ({
  onNavigateToStudio,
  onNavigateToAuth,
  currentUser,
  onSignOut
}) => {
  const handleSpineClick = (genre: GenreFilter) => {
    onNavigateToStudio(genre);
  };

  return (
    <div className="landing-root">
      {/* Top Bar */}
      <header className="landing-topbar">
        {/* Left: Flame Brand Icon + Nav Links */}
        <div className="landing-nav-left">
          <div
            className="landing-brand-badge"
            onClick={() => onNavigateToStudio()}
            title="Plotpal Home"
          >
            <div className="flame-icon-circle-landing">
              <Flame size={18} className="flame-svg-landing" />
            </div>
            <span className="landing-brand-text">plotpal</span>
          </div>

          <nav className="landing-links">
            <button
              type="button"
              className="landing-link"
              onClick={() => onNavigateToStudio()}
            >
              Studio
            </button>
            <button
              type="button"
              className="landing-link"
              onClick={() => onNavigateToStudio("all")}
            >
              Storylines
            </button>
            <button
              type="button"
              className="landing-link"
              onClick={onNavigateToAuth}
            >
              Sign In
            </button>
          </nav>
        </div>

        {/* Right: Auth Action */}
        <div className="landing-nav-right">
          {currentUser?.isAuthenticated ? (
            <div className="landing-user-profile">
              <button
                type="button"
                className="landing-launch-btn"
                onClick={() => onNavigateToStudio()}
              >
                Go to Studio
              </button>
              <img
                src={currentUser.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt={currentUser.name}
                className="landing-avatar"
                title={`Signed in as ${currentUser.name}`}
                onClick={onSignOut}
              />
            </div>
          ) : (
            <button
              type="button"
              className="landing-signin-btn"
              onClick={onNavigateToAuth}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Main Hero Viewport */}
      <main className="landing-hero-container">
        {/* Left / Center Section: Typographic Brand + Actions */}
        <div className="landing-hero-content">
          <div className="landing-brand-mark">
            <svg
              viewBox="0 0 340 220"
              className="plotpal-typographic-svg"
              aria-label="PLOTPAL Logo"
            >
              {/* Row 1: PL [capsule 1] [capsule 2] T */}
              <text
                x="12"
                y="90"
                className="brand-letter"
                fontFamily="'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
                fontWeight="900"
                fontSize="84"
                fill="#1E1B18"
                letterSpacing="-2px"
              >
                PL
              </text>

              <text
                x="285"
                y="90"
                className="brand-letter"
                fontFamily="'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
                fontWeight="900"
                fontSize="84"
                fill="#1E1B18"
                letterSpacing="-2px"
              >
                T
              </text>

              {/* Row 2: PA [capsule 1] [capsule 2] L */}
              <text
                x="12"
                y="196"
                className="brand-letter"
                fontFamily="'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
                fontWeight="900"
                fontSize="84"
                fill="#1E1B18"
                letterSpacing="-2px"
              >
                PA
              </text>

              <text
                x="285"
                y="196"
                className="brand-letter"
                fontFamily="'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
                fontWeight="900"
                fontSize="84"
                fill="#1E1B18"
                letterSpacing="-2px"
              >
                L
              </text>

              {/* Capsule 1: Tilted Coral / Terracotta Orange Pill */}
              <g transform="translate(142, 105) rotate(-14)">
                <rect
                  x="-20"
                  y="-84"
                  width="40"
                  height="168"
                  rx="20"
                  ry="20"
                  fill="none"
                  stroke="#FA541C"
                  strokeWidth="14"
                />
              </g>

              {/* Capsule 2: Upright Deep Navy Pill */}
              <g transform="translate(225, 105)">
                <rect
                  x="-20"
                  y="-84"
                  width="40"
                  height="168"
                  rx="20"
                  ry="20"
                  fill="none"
                  stroke="#234668"
                  strokeWidth="14"
                />
              </g>
            </svg>
          </div>

          {/* Direct CTA button to studio */}
          <div className="landing-cta-row">
            <button
              type="button"
              className="landing-hero-cta-btn"
              onClick={() => onNavigateToStudio()}
            >
              <span>Open Studio</span>
              <div className="enter-arrow-circle">
                <ArrowRight size={14} />
              </div>
            </button>
          </div>

          {/* Editorial Hook Copy */}
          <div className="landing-editorial-copy">
            <p>
              Narrative timeline and story continuity workspace for writers.
            </p>
          </div>
        </div>

        {/* Right Section: Slanted Book Spines */}
        <div className="landing-spines-composition">
          <div className="spines-angle-wrapper">
            {SPINES.map((spine, idx) => (
              <div
                key={spine.id}
                className={`spine-bar spine-bar-${idx}`}
                style={{
                  backgroundColor: spine.bgColor,
                  color: spine.textColor,
                  height: spine.height,
                  zIndex: spine.zIndex,
                }}
                onClick={() => handleSpineClick(spine.genre)}
                title={`Open ${spine.title}`}
              >
                <div className="spine-circle-icon">
                  <ArrowRight size={13} className="spine-arrow-svg" />
                </div>
                <div className="spine-vertical-text">
                  <span className="spine-main-title">{spine.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="landing-footer-minimal">
        <div className="footer-quick-links">
          <button
            type="button"
            className="footer-btn"
            onClick={() => onNavigateToStudio()}
          >
            Studio
          </button>
          <span className="divider">•</span>
          <button
            type="button"
            className="footer-btn"
            onClick={onNavigateToAuth}
          >
            Sign In / Account
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
