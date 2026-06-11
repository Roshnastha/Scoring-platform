/**
 * Shared domain types used across the entire frontend.
 * Single source of truth for API response shapes.
 */

export interface Score {
  id: number;
  category: string;
  score: number;
  note: string | null;
  reviewer_id: number;
  created_at: string;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  role_applied: string;
  status: string;
  skills: string[];
  created_at: string;
  ai_summary: string | null;
  scores: Score[];
  internal_notes?: string | null;
}

export interface PaginatedCandidates {
  items: Candidate[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CandidateFilters {
  status?: string;
  role_applied?: string;
  skill?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface ScorePayload {
  category: string;
  score: number;
  note?: string;
}
