import React from 'react';
import { 
  Flame,
  X,
  Plus,
  MessageSquare,
  Clock,
  Compass,
  Layers,
  Trash2,
  LogOut,
  Sparkles
} from 'lucide-react';
import { ChatThread, ChatMode, UserProfile } from '../types';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewPlot: () => void;
  onDeleteThread: (threadId: string, e: React.MouseEvent) => void;
  currentUser: UserProfile | null;
  onSignOut: () => void;
}

const MODE_ICONS: Record<ChatMode, React.FC<{ size?: number; className?: string }>> = {
  architect: Compass,
  continuity: Clock,
  dialogue: MessageSquare,
  worldbuilding: Layers,
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  threads,
  activeThreadId,
  onSelectThread,
  onNewPlot,
  onDeleteThread,
  currentUser,
  onSignOut,
}) => {
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
        id="plotpal-sidebar" 
        className={`sidebar-container ${isOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* Top Brand & Close Header */}
        <div className="sidebar-header-row">
          <div 
            className="sidebar-logo-container" 
            onClick={() => {
              onNewPlot();
              onCloseMobile();
            }}
          >
            <div className="logo-flame-icon">
              <Flame size={20} className="flame-svg text-white" />
            </div>
            <div className="logo-text-group">
              <span className="logo-text">plotpal</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. New Plot Action (Replaces Overview; Studio, Storylines, Account are removed) */}
        <div className="sidebar-top-action-group">
          <button
            type="button"
            className="sidebar-new-plot-btn"
            onClick={() => {
              onNewPlot();
              onCloseMobile();
            }}
          >
            <Plus size={18} className="text-white shrink-0" />
            <span className="font-bold">New Plot</span>
          </button>
        </div>

        {/* 2. Chat History / Recent Chats List */}
        <div className="sidebar-chat-history-section">
          <div className="sidebar-section-header">
            <span className="section-header-title">Recent Chats</span>
            {threads.length > 0 && (
              <span className="section-header-count">{threads.length}</span>
            )}
          </div>

          <div className="sidebar-threads-list-scroll">
            {threads.length === 0 ? (
              <div className="sidebar-empty-threads">
                <p>No recent plots yet.</p>
                <button
                  type="button"
                  className="sidebar-empty-cta"
                  onClick={() => {
                    onNewPlot();
                    onCloseMobile();
                  }}
                >
                  <Sparkles size={13} />
                  <span>Start your first plot</span>
                </button>
              </div>
            ) : (
              threads.map((thread) => {
                const ModeIcon = MODE_ICONS[thread.mode] || MessageSquare;
                const isActive = thread.id === activeThreadId;

                return (
                  <div
                    key={thread.id}
                    className={`sidebar-thread-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectThread(thread.id);
                      onCloseMobile();
                    }}
                    title={thread.title}
                  >
                    <div className="thread-item-icon">
                      <ModeIcon size={15} />
                    </div>

                    <div className="thread-item-content">
                      <span className="thread-item-title">{thread.title || 'Untitled Plot'}</span>
                      <span className="thread-item-mode">
                        {thread.mode === 'architect'
                          ? 'Plot Architect'
                          : thread.mode === 'continuity'
                          ? 'Continuity'
                          : thread.mode === 'dialogue'
                          ? 'Dialogue'
                          : 'Worldbuilding'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="thread-item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteThread(thread.id, e);
                      }}
                      title="Delete chat"
                      aria-label="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Bottom User Profile & Sign Out */}
        {currentUser && (
          <div className="sidebar-user-footer-row">
            <div className="sidebar-user-chip">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="sidebar-user-avatar"
                />
              ) : (
                <div className="sidebar-user-initial">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="sidebar-user-text">
                <span className="sidebar-user-name">{currentUser.name}</span>
                <span className="sidebar-user-email">{currentUser.email || 'Author'}</span>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-signout-btn"
              onClick={onSignOut}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
