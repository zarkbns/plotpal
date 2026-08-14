export type ViolationType = 
  | 'character_status' 
  | 'item_ownership' 
  | 'location_state' 
  | 'causality'
  | 'faction_allegiance'
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
  id?: string;
  type: ViolationType;
  entities_involved: string[];
  timeline_conflict: TimelineConflict;
  explanation: string;
  suggestions?: string[];
  severity?: ConflictSeverity;
}

export interface ContinuityResponse {
  is_valid: boolean;
  conflict_severity?: ConflictSeverity;
  violations: Violation[];
  suggestions?: string[];
  error?: string;
}

export interface Chapter {
  id: number;
  title: string;
  timelineMarker: number;
  text: string;
  wordCount: number;
}

export interface TrackedEntity {
  name: string;
  type: 'character' | 'item' | 'location' | 'faction';
  status: string;
  lastSeenMarker: number;
}

export interface Manuscript {
  id: string;
  title: string;
  author: string;
  genre: string;
  chaptersCount: number;
  currentChapter: number;
  lastCheckedDate: string;
  coverBg: string;
  coverAccent: string;
  textColor?: string;
  status: 'clean' | 'has_violations' | 'unverified';
  violationsCount: number;
  excerpt: string;
  inUniverseTime: number;
  timelineSpan: string;
  description: string;
  ratingScore?: string;
  chapters: Chapter[];
  violations: Violation[];
  trackedEntities: TrackedEntity[];
}

export interface UserManuscriptMeta {
  id: string;
  title: string;
  genre: string;
  inUniverseTime: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: string;
  isAuthenticated: boolean;
  manuscripts?: UserManuscriptMeta[];
}

export interface ManuscriptFormData {
  text: string;
  in_universe_time: number | string;
  chapter: number | string;
  manuscript_position?: number | string;
}

export type NavTab = 'home' | 'manuscripts' | 'search' | 'saved' | 'settings';
export type GenreFilter = 'all' | 'fantasy' | 'scifi' | 'romance' | 'mystery' | 'thriller' | 'historical' | 'dystopian';
