import React, { useState } from 'react';
import { 
  Sparkles, 
  Menu, 
  LogOut, 
  ChevronDown
} from 'lucide-react';
import { UserProfile } from '../types';

interface TopBarProps {
  onOpenCreateModal: () => void;
  onToggleMobileSidebar?: () => void;
  currentUser: UserProfile | null;
  onOpenGoogleAuth: () => void;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCreateModal,
  onToggleMobileSidebar,
  currentUser,
  onOpenGoogleAuth,
  onSignOut
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'W';

  return (
    <header id="plotpal-topbar" className="topbar-container">
      {/* Left: Mobile Hamburger & Page Context */}
      <div className="topbar-left-group">
        <button
          id="topbar-mobile-menu-btn"
          type="button"
          className="topbar-mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Open Navigation Menu"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>
        <span className="topbar-title-tag">Storylines</span>
      </div>

      {/* Right Controls: Create Action & Profile / Google Sign-In */}
      <div className="topbar-right-actions">
        {/* Create Storyline Quick Action */}
        <button
          id="topbar-new-manuscript-btn"
          type="button"
          className="btn-create-header"
          onClick={onOpenCreateModal}
          title="Create New Storyline"
        >
          <Sparkles size={15} />
          <span className="btn-create-text">+ New Storyline</span>
        </button>

        {/* Google Sign-in / User Profile Dropdown */}
        {currentUser?.isAuthenticated ? (
          <div className="profile-dropdown-wrapper">
            <button
              id="topbar-profile-btn"
              type="button"
              className="profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-avatar-circle">
                <span className="avatar-initials">{initials}</span>
              </div>
              <div className="profile-info-text">
                <span className="profile-name">{currentUser.name}</span>
              </div>
              <ChevronDown size={14} className="profile-chevron" />
            </button>

            {showProfileMenu && (
              <div className="profile-menu-dropdown">
                <div className="menu-user-summary">
                  <div className="summary-name">{currentUser.name}</div>
                  <div className="summary-email">{currentUser.email}</div>
                </div>
                <div className="menu-divider" />
                <button
                  type="button"
                  className="menu-item text-danger"
                  onClick={() => {
                    onSignOut();
                    setShowProfileMenu(false);
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            id="topbar-google-signin-btn"
            type="button"
            className="btn-google-header-login"
            onClick={onOpenGoogleAuth}
            title="Sign in with Google"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" className="google-icon-sm">
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
          </button>
        )}
      </div>
    </header>
  );
};
