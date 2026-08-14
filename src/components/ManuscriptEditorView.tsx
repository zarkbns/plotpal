import React, { useState } from 'react';
import { 
  ArrowLeft, 
  RotateCw, 
  Check, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  FileEdit, 
  ShieldAlert, 
  Type, 
  Plus, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Database,
  Sliders
} from 'lucide-react';
import { Manuscript, Violation } from '../types';

interface ManuscriptEditorViewProps {
  manuscript: Manuscript;
  onBack: () => void;
  onCheckContinuity: (text: string, timeMarker: number, chapter: number) => void;
  onIngestScene?: (text: string, timeMarker: number, chapter: number) => void;
}

export const ManuscriptEditorView: React.FC<ManuscriptEditorViewProps> = ({
  manuscript,
  onBack,
  onCheckContinuity,
  onIngestScene
}) => {
  const currentChapterData = manuscript.chapters.find(c => c.id === manuscript.currentChapter) || manuscript.chapters[0] || {
    id: 1,
    title: 'Act I: The Beginning',
    timelineMarker: manuscript.inUniverseTime,
    text: manuscript.excerpt,
    wordCount: 1200
  };

  const [selectedChapterId, setSelectedChapterId] = useState<number>(currentChapterData.id);
  const [editorText, setEditorText] = useState<string>(currentChapterData.text || manuscript.excerpt);
  const [timelineMarker, setTimelineMarker] = useState<number>(currentChapterData.timelineMarker || manuscript.inUniverseTime);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(15);
  const [fontFamily, setFontFamily] = useState<'serif' | 'mono' | 'sans'>('serif');
  const [showFormatBar, setShowFormatBar] = useState<boolean>(false);
  const [activeBeat, setActiveBeat] = useState<string>('Act I');
  // Mobile / Tablet Tab switch: 'editor' | 'violations'
  const [mobileTab, setMobileTab] = useState<'editor' | 'violations'>('editor');

  const wordCount = editorText.trim() ? editorText.trim().split(/\s+/).length : 0;
  const charCount = editorText.length;

  const handleChapterChange = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    const ch = manuscript.chapters.find(c => c.id === chapterId);
    if (ch) {
      setEditorText(ch.text);
      setTimelineMarker(ch.timelineMarker);
    }
  };

  const handleRunCheck = async () => {
    setIsChecking(true);
    try {
      // Call backend API if available
      const payload = {
        active_text: editorText,
        current_timeline_marker: timelineMarker,
        chapter: selectedChapterId,
        in_universe_time: timelineMarker,
        text: editorText
      };
      
      const response = await fetch('/check-continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Plotpal] Backend check response:', data);
      }
    } catch (err) {
      console.warn('[Plotpal] Check continuity API fallback to client logic:', err);
    } finally {
      onCheckContinuity(editorText, timelineMarker, selectedChapterId);
      setTimeout(() => {
        setIsChecking(false);
      }, 500);
    }
  };

  const handleIngestScene = async () => {
    setIsSaving(true);
    try {
      const payload = {
        text: editorText,
        chapter: selectedChapterId,
        in_universe_time: timelineMarker,
        manuscript_position: 0.1
      };
      await fetch('/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('[Plotpal] Ingest API called:', err);
    } finally {
      if (onIngestScene) {
        onIngestScene(editorText, timelineMarker, selectedChapterId);
      }
      setTimeout(() => {
        setIsSaving(false);
      }, 400);
    }
  };

  const violations: Violation[] = manuscript.violations;

  return (
    <div id="litverse-editor-view" className="editor-view-container">
      {/* Top Header of Editor */}
      <header className="editor-top-nav">
        <div className="editor-top-left">
          <button
            id="editor-back-btn"
            type="button"
            className="editor-back-button"
            onClick={onBack}
            aria-label="Back to Storylines"
          >
            <ArrowLeft size={16} />
            <span className="back-btn-text">Storylines</span>
          </button>

          <div className="editor-title-divider" />

          <div className="editor-manuscript-title-group">
            <h2 className="editor-manuscript-heading" title={manuscript.title}>{manuscript.title}</h2>
            <span className="editor-author-sub">by {manuscript.author}</span>
          </div>
        </div>

        {/* Center: Chapter / Scene Selector */}
        <div className="editor-chapter-selector-wrapper">
          <label htmlFor="chapter-select" className="sr-only">Select Scene or Chapter</label>
          <div className="chapter-select-box">
            <select
              id="chapter-select"
              value={selectedChapterId}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              className="chapter-dropdown"
            >
              {manuscript.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Ch. {ch.id}: {ch.title} (Marker {ch.timelineMarker})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>

        {/* Right: Controls & Check Trigger */}
        <div className="editor-top-right">
          <button
            type="button"
            className={`editor-format-btn ${showFormatBar ? 'active' : ''}`}
            onClick={() => setShowFormatBar(!showFormatBar)}
            title="Typography Settings"
          >
            <Type size={16} />
            <span className="format-btn-text">Format</span>
          </button>

          <button
            id="editor-save-ingest-btn"
            type="button"
            className="editor-save-btn"
            onClick={handleIngestScene}
            disabled={isSaving}
            title="Save and Ingest scene into HydraDB vector graph"
          >
            <Save size={14} />
            <span className="save-btn-text">{isSaving ? 'Syncing...' : 'Save Scene'}</span>
          </button>

          <button
            id="editor-check-continuity-btn"
            type="button"
            className="editor-primary-check-btn"
            onClick={handleRunCheck}
            disabled={isChecking}
          >
            <RotateCw size={15} className={isChecking ? 'spin' : ''} />
            <span className="check-btn-text">{isChecking ? 'Auditing...' : 'Audit Plot'}</span>
          </button>
        </div>
      </header>

      {/* Typography Formatting Bar (Collapsible) */}
      {showFormatBar && (
        <div className="editor-format-panel">
          <div className="format-option-group">
            <span className="format-label">Font:</span>
            <button
              type="button"
              className={`format-toggle ${fontFamily === 'serif' ? 'active' : ''}`}
              onClick={() => setFontFamily('serif')}
            >
              Serif
            </button>
            <button
              type="button"
              className={`format-toggle ${fontFamily === 'sans' ? 'active' : ''}`}
              onClick={() => setFontFamily('sans')}
            >
              Sans
            </button>
            <button
              type="button"
              className={`format-toggle ${fontFamily === 'mono' ? 'active' : ''}`}
              onClick={() => setFontFamily('mono')}
            >
              Mono
            </button>
          </div>

          <div className="format-option-group">
            <span className="format-label">Size:</span>
            <button
              type="button"
              className="format-size-btn"
              onClick={() => setFontSize(Math.max(13, fontSize - 1))}
              aria-label="Decrease font size"
            >
              -
            </button>
            <span className="format-size-val">{fontSize}px</span>
            <button
              type="button"
              className="format-size-btn"
              onClick={() => setFontSize(Math.min(22, fontSize + 1))}
              aria-label="Increase font size"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Mobile / Tablet Segmented Tabs */}
      <div className="editor-mobile-tab-switch" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'editor'}
          className={`editor-tab-btn ${mobileTab === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileTab('editor')}
        >
          <FileEdit size={14} />
          <span>Scene Draft</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'violations'}
          className={`editor-tab-btn ${mobileTab === 'violations' ? 'active' : ''}`}
          onClick={() => setMobileTab('violations')}
        >
          <ShieldAlert size={14} />
          <span>Plot Violations</span>
          <span className={`tab-badge ${violations.length > 0 ? 'badge-alert' : 'badge-clean'}`}>
            {violations.length}
          </span>
        </button>
      </div>

      {/* Split Workspace Body */}
      <main className={`editor-workspace-split active-tab-${mobileTab}`}>
        {/* Left Pane: Manuscript Text Editor */}
        <section className={`editor-manuscript-pane ${mobileTab === 'editor' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="manuscript-pane-header">
            <div className="pane-title-group">
              <span className="manuscript-badge">Scene Draft & Narrative Flow</span>
              <h3 className="chapter-display-title">
                {manuscript.chapters.find(c => c.id === selectedChapterId)?.title || `Chapter ${selectedChapterId}`}
              </h3>
            </div>

            <div className="timeline-marker-input-group">
              <span className="marker-label">Timeline Marker (T):</span>
              <input
                id="timeline-marker-input"
                type="number"
                value={timelineMarker}
                onChange={(e) => setTimelineMarker(Number(e.target.value) || 0)}
                className="timeline-marker-input"
                title="In-universe timeline marker (e.g. year, day, or scene timestamp)"
              />
            </div>
          </div>

          {/* Textarea with Literary Styling */}
          <div className="editor-textarea-container">
            <textarea
              id="manuscript-editor-textarea"
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder="Write or paste your story scene draft here. Add character dialogues, item exchanges, and locked location descriptions..."
              className={`manuscript-textarea font-${fontFamily}`}
              style={{ fontSize: `${fontSize}px` }}
            />
          </div>

          {/* Editor Stats Footer */}
          <div className="editor-stats-footer">
            <div className="stats-counters">
              <span>{wordCount} words</span>
              <span className="stats-dot">•</span>
              <span>{charCount} characters</span>
              <span className="stats-dot">•</span>
              <span>Scene {selectedChapterId} of {manuscript.chaptersCount}</span>
            </div>

            <div className="hydra-sync-indicator">
              <Database size={13} />
              <span>HydraDB Graph Connected</span>
            </div>
          </div>
        </section>

        {/* Right Pane: Continuity Violations Panel */}
        <aside className={`editor-continuity-pane ${mobileTab === 'violations' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="continuity-pane-header">
            <div className="continuity-title-group">
              <Sparkles size={16} className="text-orange" />
              <h3 className="continuity-heading">Plot Hole & Continuity Diagnostics</h3>
            </div>
            <span className={`violations-count-badge ${violations.length > 0 ? 'badge-alert' : 'badge-clean'}`}>
              {violations.length} {violations.length === 1 ? 'Contradiction' : 'Contradictions'}
            </span>
          </div>

          {/* Violations List */}
          <div className="continuity-alerts-list">
            {violations.length === 0 ? (
              <div className="no-violations-card">
                <Check size={28} className="clean-hero-icon" />
                <h4>No Plot Holes Detected</h4>
                <p>
                  This scene aligns with all previous narrative states, character lifelines, item transfers, and locked gates recorded in HydraDB.
                </p>
                <div className="clean-tip-box">
                  <strong>Writer Insight:</strong> Advance the timeline marker to test future scene sequences or add new character interactions.
                </div>
              </div>
            ) : (
              violations.map((v, index) => {
                const isCritical = v.severity === 'critical';
                return (
                  <div 
                    key={v.id || index}
                    id={`violation-alert-${index}`}
                    className={`violation-alert-card ${isCritical ? 'critical-card' : 'warning-card'}`}
                  >
                    {/* Header */}
                    <div className="violation-card-top">
                      <div className="violation-type-badge">
                        <AlertTriangle size={13} />
                        <span>{v.type.replace('_', ' ')}</span>
                      </div>
                      <span className="violation-severity-label">
                        {v.severity || 'medium'}
                      </span>
                    </div>

                    {/* Entities Involved */}
                    {v.entities_involved && v.entities_involved.length > 0 && (
                      <div className="violation-entities-row">
                        <span className="entities-label">Entities:</span>
                        <div className="entities-tags">
                          {v.entities_involved.map((entity, eIdx) => (
                            <span key={eIdx} className="entity-pill">{entity}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Co-writer direct feedback */}
                    <div className="violation-explanation-box">
                      <p className="violation-feedback-text">
                        "{v.explanation}"
                      </p>
                    </div>

                    {/* Timeline State Diff Comparison */}
                    {v.timeline_conflict && (
                      <div className="timeline-diff-box">
                        <div className="diff-col past">
                          <span className="diff-label">PAST STATE (T = {v.timeline_conflict.past_timeline_marker ?? v.timeline_conflict.past_marker ?? 'Early'})</span>
                          <span className="diff-val">
                            {typeof v.timeline_conflict.past_state === 'object'
                              ? JSON.stringify(v.timeline_conflict.past_state).replace(/[{"}]/g, ' ')
                              : String(v.timeline_conflict.past_state)}
                          </span>
                        </div>

                        <div className="diff-divider">→</div>

                        <div className="diff-col current">
                          <span className="diff-label">CURRENT SCENE (T = {v.timeline_conflict.current_timeline_marker ?? v.timeline_conflict.current_marker ?? timelineMarker})</span>
                          <span className="diff-val">
                            {typeof v.timeline_conflict.current_state === 'object'
                              ? JSON.stringify(v.timeline_conflict.current_state).replace(/[{"}]/g, ' ')
                              : String(v.timeline_conflict.current_state)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Practical Suggestions */}
                    {v.suggestions && v.suggestions.length > 0 && (
                      <div className="violation-suggestions-group">
                        <span className="suggestions-header">Continuity Fix Suggestions:</span>
                        <ul className="suggestions-list">
                          {v.suggestions.map((sug, sIdx) => (
                            <li key={sIdx} className="suggestion-item">
                              {sug}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </main>

      {/* Bottom Story Plot Beat & Timeline Navigator Bar (No Audio elements) */}
      <footer id="litverse-plot-navigator" className="plot-navigator-bar">
        {/* Left: Active Story & Chapter Overview */}
        <div className="plot-nav-left-info">
          <div className="plot-marker-icon-box">
            <Clock size={16} color="#FFFFFF" />
          </div>
          <div className="plot-nav-text-group">
            <span className="plot-nav-title">{manuscript.title}</span>
            <span className="plot-nav-marker-info">Marker T={timelineMarker} • Chapter {selectedChapterId}</span>
          </div>
        </div>

        {/* Center: Beat Sheet & Timeline Marker Controls */}
        <div className="plot-nav-center-controls">
          <div className="plot-beat-buttons-row">
            <span className="plot-beats-label">Plot Beats:</span>
            {['Act I (Setup)', 'Act II (Rising)', 'Act III (Climax)', 'Act IV (Resolution)'].map((beatName) => {
              const isActive = activeBeat === beatName.split(' ')[0] + ' ' + beatName.split(' ')[1];
              return (
                <button
                  key={beatName}
                  type="button"
                  className={`plot-beat-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveBeat(beatName.split(' ')[0] + ' ' + beatName.split(' ')[1]);
                    if (beatName.includes('Act I')) setTimelineMarker(100);
                    if (beatName.includes('Act II')) setTimelineMarker(300);
                    if (beatName.includes('Act III')) setTimelineMarker(500);
                    if (beatName.includes('Act IV')) setTimelineMarker(700);
                  }}
                >
                  {beatName}
                </button>
              );
            })}
          </div>

          <div className="plot-scrubber-controls-row">
            <button
              type="button"
              className="plot-step-btn"
              onClick={() => setTimelineMarker(Math.max(10, timelineMarker - 50))}
              title="Step Back 50 Markers"
            >
              <ChevronLeft size={15} />
              <span>-50</span>
            </button>

            <div className="plot-range-wrapper">
              <span className="scrubber-bound-text">T=100</span>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={timelineMarker}
                onChange={(e) => setTimelineMarker(Number(e.target.value))}
                className="plot-timeline-range"
                aria-label="Timeline sequence scrubber"
              />
              <span className="scrubber-bound-text">T=1000</span>
            </div>

            <button
              type="button"
              className="plot-step-btn"
              onClick={() => setTimelineMarker(timelineMarker + 50)}
              title="Step Forward 50 Markers"
            >
              <span>+50</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Right: Quick Ingest & Status */}
        <div className="plot-nav-right-status">
          <div className="hydra-status-pill">
            <span className="status-live-dot" />
            <span>HydraDB Graph</span>
          </div>

          <button
            type="button"
            className="plot-quick-tool-btn"
            onClick={handleRunCheck}
            title="Re-run Plot Audit"
          >
            <RotateCw size={15} className={isChecking ? 'spin' : ''} />
          </button>
        </div>
      </footer>
    </div>
  );
};
