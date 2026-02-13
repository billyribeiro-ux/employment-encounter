import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface MeetingRequest {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  meeting_type: string;
  status: string;
  application_id: string | null;
  job_id: string | null;
  organizer_id: string;
  proposed_start: string;
  proposed_end: string;
  confirmed_start: string | null;
  confirmed_end: string | null;
  timezone: string;
  location: string | null;
  video_room_id: string | null;
  meeting_link: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  role: string;
  rsvp_status: string;
  responded_at: string | null;
  created_at: string;
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  meeting_type?: string;
  application_id?: string;
  job_id?: string;
  proposed_start: string;
  proposed_end: string;
  timezone?: string;
  location?: string;
  participant_ids: string[];
}

export interface RescheduleMeetingPayload {
  id: string;
  proposed_start: string;
  proposed_end: string;
  reason?: string;
}

export function useMeetings(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  meeting_type?: string;
  application_id?: string;
  job_id?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<MeetingRequest>>(
        "/meetings",
        { params }
      );
      return data;
    },
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meetings", id],
    queryFn: async () => {
      const { data } = await api.get<MeetingRequest>(`/meetings/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMeetingPayload) => {
      const { data } = await api.post<MeetingRequest>(
        "/meetings/request",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useAcceptMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<MeetingRequest>(
        `/meetings/${id}/accept`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useDenyMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }) => {
      const { data } = await api.post<MeetingRequest>(
        `/meetings/${id}/deny`,
        { reason }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useRescheduleMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: RescheduleMeetingPayload) => {
      const { data } = await api.post<MeetingRequest>(
        `/meetings/${id}/reschedule`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useCancelMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }) => {
      const { data } = await api.post<MeetingRequest>(
        `/meetings/${id}/cancel`,
        { reason }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
