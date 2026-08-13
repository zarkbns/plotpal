export type ViolationType = 
  | 'character_status' 
  | 'item_ownership' 
  | 'location_state' 
  | 'causality'
  | string;

export type ConflictSeverity = 'critical' | 'medium' | 'low' | 'none';

export interface TimelineConflict {
  past_state?: Record<string, any> | string;
  past_timeline_marker?: number;
  past_marker?: number;
  current_state?: Record<string, any> | string;
  current_timeline_marker?: number;
  current_marker?: number;
}

export interface Violation {
  type: ViolationType;
  entities_involved: string[];
  timeline_conflict: TimelineConflict;
  explanation: string;
  suggestions?: string[];
}

export interface ContinuityResponse {
  is_valid: boolean;
  conflict_severity?: ConflictSeverity;
  violations: Violation[];
  suggestions?: string[];
  error?: string;
}

export interface ManuscriptFormData {
  text: string;
  in_universe_time: number | string;
  chapter: number | string;
  manuscript_position?: number | string;
}
