import React from 'react';
import { 
  Home, 
  GitBranch, 
  Search, 
  Bookmark, 
  Settings, 
  HelpCircle, 
  LogOut,
  Flame,
  Layers,
  X,
  Database,
  ShieldCheck
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  manuscriptCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  manuscriptCount,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'home', label: 'Plot Dashboard', icon: <Home size={19} /> },
    { id: 'manuscripts', label: 'My Storylines', icon: <GitBranch size={19} />, badge: manuscriptCount },
    { id: 'search', label: 'Plot Search', icon: <Search size={19} /> },
    { id: 'saved', label: 'Saved Blueprints', icon: <Bookmark size={19} /> },
    { id: 'settings', label: 'HydraDB Settings', icon: <Settings size={19} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside 
        id="litverse-sidebar" 
        className={`sidebar-container ${isOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* Brand / Logo + Mobile Close */}
        <div className="sidebar-header-row">
          <div 
            className="sidebar-logo-container" 
            onClick={() => {
              onSelectTab('home');
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <div className="logo-flame-icon">
              <Flame size={22} className="flame-svg" />
            </div>
            <div className="logo-text-group">
              <span className="logo-text">plotpal</span>
              <span className="logo-tagline">plot & continuity engine</span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              className="sidebar-mobile-close-btn"
              onClick={onCloseMobile}
              aria-label="Close Navigation Menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <div className="nav-section-label">Navigation</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                type="button"
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={item.label}
              >
                <span className="nav-icon-wrapper">{item.icon}</span>
                <span className="nav-label-text">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`nav-badge ${isActive ? 'active-badge' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* HydraDB Status Card */}
        <div className="sidebar-hydra-card">
          <div className="hydra-card-header">
            <Database size={14} className="hydra-icon" />
            <span>HydraDB Graph</span>
          </div>
          <div className="hydra-card-status">
            <span className="hydra-pulse-dot"></span>
            <span>Vector & Graph Synced</span>
          </div>
          <p className="hydra-card-sub">No Firebase / Pure HydraDB</p>
        </div>

        {/* Secondary Bottom Links */}
        <div className="sidebar-bottom-links">
          <button
            type="button"
            className="sidebar-bottom-btn"
            onClick={() => {
              console.log('[Plotpal] Opened Support modal');
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <HelpCircle size={16} />
            <span>Plot Help & Docs</span>
          </button>
        </div>
      </aside>
    </>
  );
};
