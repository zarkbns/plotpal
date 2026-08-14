import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Sparkles, 
  User, 
  ShieldCheck, 
  FileText, 
  Menu, 
  LogOut, 
  LogIn, 
  Sliders,
  Sparkle
} from 'lucide-react';
import { UserProfile } from '../types';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onToggleMobileSidebar?: () => void;
  onToggleDetails?: () => void;
  hasSelectedManuscript?: boolean;
  isDetailsOpen?: boolean;
  currentUser: UserProfile | null;
  onOpenGoogleAuth: () => void;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onToggleMobileSidebar,
  onToggleDetails,
  hasSelectedManuscript = false,
  isDetailsOpen = false,
  currentUser,
  onOpenGoogleAuth,
  onSignOut
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'W';

  return (
    <header id="litverse-topbar" className="topbar-container">
      {/* Left: Mobile Hamburger & Search Banner */}
      <div className="topbar-left-group">
        {/* Mobile / Tablet Menu Toggle */}
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

        {/* Search Bar - Litverse Yellow Banner Style */}
        <div className="search-banner-wrapper">
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input
              id="main-search-input"
              type="text"
              placeholder="Search plotlines, timeline markers, character arcs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input-field"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls: Quick Actions, Notifications & Profile / Google Sign-In */}
      <div className="topbar-right-actions">
        {/* Details Toggle Button for Tablet / Mobile */}
        {hasSelectedManuscript && onToggleDetails && (
          <button
            id="topbar-details-toggle-btn"
            type="button"
            className={`topbar-details-btn ${isDetailsOpen ? 'active' : ''}`}
            onClick={onToggleDetails}
            title={isDetailsOpen ? 'Hide Diagnostics' : 'View Plot Diagnostics'}
          >
            <Sliders size={16} />
            <span className="details-toggle-label">Inspector</span>
          </button>
        )}

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

        {/* Notification Bell */}
        <div className="notification-wrapper">
          <button
            id="topbar-notifications-btn"
            type="button"
            className="topbar-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            title="Continuity Alerts"
          >
            <Bell size={18} />
            <span className="notification-badge">2</span>
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <span>Recent Continuity Alerts</span>
                <span className="dropdown-badge">2 active</span>
              </div>
              <div className="dropdown-item">
                <div className="alert-dot critical" />
                <div>
                  <div className="dropdown-item-title">Astrolabe ownership unaccounted</div>
                  <div className="dropdown-item-time">The Clockwork Conspiracy • Act III</div>
                </div>
              </div>
              <div className="dropdown-item">
                <div className="alert-dot medium" />
                <div>
                  <div className="dropdown-item-title">North Tower Gate state mismatch</div>
                  <div className="dropdown-item-time">The Clockwork Conspiracy • Act III</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google Sign-in / User Profile Dropdown */}
        {currentUser?.isAuthenticated ? (
          <div className="profile-dropdown-wrapper">
            <button
              id="topbar-profile-btn"
              type="button"
              className="profile-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
            >
              <div className="profile-avatar-circle">
                <span className="avatar-initials">{initials}</span>
              </div>
              <div className="profile-info-text">
                <span className="profile-name">{currentUser.name}</span>
                <span className="profile-role">{currentUser.role}</span>
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
                  className="menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                  }}
                >
                  <User size={15} />
                  <span>Story Plot Profile</span>
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>HydraDB Graph Settings</span>
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                  }}
                >
                  <FileText size={15} />
                  <span>Export Plot Continuity Reports</span>
                </button>
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
                <div className="menu-divider" />
                <div className="menu-footer-status">
                  <span>HydraDB Engine: Active</span>
                  <span className="status-indicator-dot" />
                </div>
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
