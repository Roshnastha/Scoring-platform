/**
 * api/candidates.ts
 * -----------------
 * All candidate-related API calls.
 * Types are defined in src/types/index.ts (single source of truth).
 */
import api from './client';
import type {
  Candidate,
  PaginatedCandidates,
  CandidateFilters,
  ScorePayload,
  Score,
} from '../types';

export type { Candidate, PaginatedCandidates, CandidateFilters, ScorePayload, Score };

export async function getCandidates(filters: CandidateFilters = {}): Promise<PaginatedCandidates> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  const res = await api.get<PaginatedCandidates>('/candidates/', { params });
  return res.data;
}

export async function getCandidate(id: number): Promise<Candidate> {
  const res = await api.get<Candidate>(`/candidates/${id}`);
  return res.data;
}

export async function createCandidate(data: {
  name: string;
  email: string;
  role_applied: string;
  skills: string[];
}): Promise<Candidate> {
  const res = await api.post<Candidate>('/candidates/', data);
  return res.data;
}

export async function submitScore(candidateId: number, payload: ScorePayload): Promise<Score> {
  const res = await api.post<Score>(`/candidates/${candidateId}/scores`, payload);
  return res.data;
}

export async function generateSummary(candidateId: number): Promise<{ summary: string }> {
  const res = await api.post<{ summary: string }>(`/candidates/${candidateId}/summary`);
  return res.data;
}

export async function updateNotes(candidateId: number, internal_notes: string): Promise<Candidate> {
  const res = await api.patch<Candidate>(`/candidates/${candidateId}/notes`, { internal_notes });
  return res.data;
}

export async function deleteCandidate(candidateId: number): Promise<void> {
  await api.delete(`/candidates/${candidateId}`);
}

export async function updateStatus(candidateId: number, status: string): Promise<Candidate> {
  const res = await api.patch<Candidate>(`/candidates/${candidateId}/status`, { status });
  return res.data;
}
