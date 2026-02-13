import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CandidateNote {
  id: string;
  candidate_id: string;
  application_id: string | null;
  author_id: string;
  author_name?: string;
  content: string;
  is_private: boolean;
  note_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCandidateNotePayload {
  content: string;
  application_id?: string;
  is_private?: boolean;
  note_type?: string;
}

export interface UpdateCandidateNotePayload {
  content?: string;
  is_private?: boolean;
  note_type?: string;
}

export function useCandidateNotes(candidateId: string) {
  return useQuery({
    queryKey: ["candidate-notes", candidateId],
    queryFn: async () => {
      const { data } = await api.get<CandidateNote[]>(
        `/candidates/${candidateId}/notes`
      );
      return data;
    },
    enabled: !!candidateId,
  });
}

export function useCreateCandidateNote(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCandidateNotePayload) => {
      const { data } = await api.post<CandidateNote>(
        `/candidates/${candidateId}/notes`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-notes", candidateId],
      });
    },
  });
}

export function useUpdateCandidateNote(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateCandidateNotePayload & { id: string }) => {
      const { data } = await api.put<CandidateNote>(
        `/candidates/${candidateId}/notes/${id}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-notes", candidateId],
      });
    },
  });
}

export function useDeleteCandidateNote(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      await api.delete(`/candidates/${candidateId}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-notes", candidateId],
      });
    },
  });
}
