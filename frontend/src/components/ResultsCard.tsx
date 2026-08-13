import React, { useState } from 'react';
import { ContinuityResponse, Violation, ConflictSeverity } from '../types';

interface ResultsCardProps {
  result: ContinuityResponse | null;
  isLoading: boolean;
  onRetry?: () => void;
}

const getSeverityClass = (severity?: ConflictSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'severity-critical';
    case 'medium':
      return 'severity-medium';
    case 'low':
      return 'severity-low';
    case 'none':
    default:
      return 'severity-none';
  }
};

const formatStateValue = (val: any): string => {
  if (!val) return 'None';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    // If it has physical_status, name, owner, etc.
    const parts = [];
    if (val.name) parts.push(`Name: ${val.name}`);
    if (val.physical_status) parts.push(`Status: ${val.physical_status}`);
    if (val.core_motivation) parts.push(`Motivation: ${val.core_motivation}`);
    if (val.owner) parts.push(`Owner: ${val.owner}`);
    if (val.held_by) parts.push(`Held By: ${val.held_by}`);
    if (val.is_accessible !== undefined) parts.push(`Accessible: ${val.is_accessible}`);
    if (val.controlling_faction) parts.push(`Faction: ${val.controlling_faction}`);
    if (val.item) parts.push(`Item: ${val.item}`);
    if (parts.length > 0) return parts.join(' | ');
    return JSON.stringify(val);
  }
  return String(val);
};

export const ResultsCard: React.FC<ResultsCardProps> = ({
  result,
  isLoading,
  onRetry
}) => {
  // Track open/collapsed state of each violation card
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({
    0: true, // Expand the first violation by default
    1: true,
    2: true
  });

  const toggleExpand = (idx: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (isLoading) {
    return (
      <div className="panel" id="results-loading-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>//</span> continuity analysis
          </div>
          <span className="panel-meta">processing graph...</span>
        </div>
        <div className="empty-state">
          <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }}></span>
          <p style={{ marginTop: '12px', color: 'var(--text-primary)' }}>
            Retrieving past world states & evaluating entity timeline graph...
          </p>
          <span className="panel-meta">Querying HydraDB vector memories & knowledge graph</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="panel" id="results-empty-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>//</span> continuity analysis
          </div>
          <span className="panel-meta">awaiting input</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">❖</div>
          <p>No manuscript segment submitted yet.</p>
          <span className="panel-meta">
            Enter a scene and click "Check Continuity" to scan for plot holes against established lore.
          </span>
        </div>
      </div>
    );
  }

  // Handle Error result
  if (result.error) {
    return (
      <div className="panel" id="results-error-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>//</span> error
          </div>
        </div>
        <div className="error-box">
          <div className="error-title">
            <span>✕</span> Verification Request Failed
          </div>
          <p className="error-message">{result.error}</p>
          {onRetry && (
            <button type="button" className="btn-retry" onClick={onRetry}>
              ↻ Retry Continuity Check
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasViolations = Array.isArray(result.violations) && result.violations.length > 0;
  const severity: ConflictSeverity = result.conflict_severity || (hasViolations ? 'critical' : 'none');

  return (
    <div className="panel" id="results-card-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span>//</span> continuity analysis
        </div>
        <div className="panel-meta">
          {hasViolations ? `${result.violations.length} issue(s) detected` : 'clean status'}
        </div>
      </div>

      <div className="results-container">
        {/* Top Status & Severity Badge */}
        {!hasViolations ? (
          <div className="status-banner valid" id="status-valid-banner">
            <span>✓ No plot holes detected</span>
            <span className="severity-badge severity-none">Severity: NONE</span>
          </div>
        ) : (
          <div className="status-banner invalid" id="status-invalid-banner">
            <div>
              <span style={{ color: '#e74c3c', fontWeight: 700 }}>⚠ Plot Holes & Continuity Conflicts Found</span>
              <div className="panel-meta" style={{ marginTop: '2px' }}>
                Found {result.violations.length} conflicting historical state(s)
              </div>
            </div>
            <span className={`severity-badge ${getSeverityClass(severity)}`} id="severity-badge">
              Severity: {severity.toUpperCase()}
            </span>
          </div>
        )}

        {/* Global Suggestions if provided at response level */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="suggestions-box" id="global-suggestions-box">
            <div className="detail-label" style={{ color: 'var(--accent-orange)' }}>
              ✦ Narrative Suggestions & Resolution Paths:
            </div>
            <ul className="suggestions-list">
              {result.suggestions.map((sug, sIdx) => (
                <li key={sIdx} className="suggestion-item">
                  {sug}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* List of Collapsible Violations */}
        {hasViolations && (
          <div className="violations-list" id="violations-list-container">
            {result.violations.map((violation: Violation, idx: number) => {
              const isExpanded = expandedIds[idx] ?? false;
              const conflict = violation.timeline_conflict || {};
              const pastMarker = conflict.past_timeline_marker ?? conflict.past_marker ?? 'Past';
              const currentMarker = conflict.current_timeline_marker ?? conflict.current_marker ?? 'Current';

              return (
                <div className="violation-card" key={idx} id={`violation-card-${idx}`}>
                  <div
                    className="violation-header"
                    onClick={() => toggleExpand(idx)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="violation-title-group">
                      <span className="violation-type-badge">
                        {violation.type || 'continuity'}
                      </span>
                      <span className="violation-summary">
                        {violation.explanation.length > 80
                          ? `${violation.explanation.slice(0, 80)}...`
                          : violation.explanation}
                      </span>
                    </div>
                    <span className="collapse-icon">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="violation-body">
                      {/* Full Explanation */}
                      <div className="detail-section">
                        <div className="detail-label">Explanation:</div>
                        <div style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>
                          {violation.explanation}
                        </div>
                      </div>

                      {/* Entities Involved */}
                      {violation.entities_involved && violation.entities_involved.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-label">Entities Involved:</div>
                          <div className="entities-tags">
                            {violation.entities_involved.map((entity, eIdx) => (
                              <span key={eIdx} className="entity-tag">
                                {entity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline Conflict Diff */}
                      <div className="detail-section">
                        <div className="detail-label">Timeline State Conflict:</div>
                        <div className="conflict-box">
                          <div className="conflict-row">
                            <div className="conflict-tag-past">
                              [T={pastMarker}] Past Established State:
                            </div>
                            <div className="conflict-val">
                              {formatStateValue(conflict.past_state)}
                            </div>
                          </div>
                          <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }}></div>
                          <div className="conflict-row">
                            <div className="conflict-tag-current">
                              [T={currentMarker}] Current Manuscript State:
                            </div>
                            <div className="conflict-val">
                              {formatStateValue(conflict.current_state)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Specific Violation Suggestions */}
                      {violation.suggestions && violation.suggestions.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-label" style={{ color: 'var(--accent-orange)' }}>
                            Fix Suggestions:
                          </div>
                          <ul className="suggestions-list">
                            {violation.suggestions.map((sug, sIdx) => (
                              <li key={sIdx} className="suggestion-item">
                                {sug}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
