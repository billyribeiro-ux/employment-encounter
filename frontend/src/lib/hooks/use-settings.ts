import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FirmSettings {
  id: string;
  name: string;
  slug: string;
  tier: string;
  status: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  mfa_enabled: boolean;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteUserPayload {
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

export function useFirmSettings() {
  return useQuery({
    queryKey: ["settings", "firm"],
    queryFn: async () => {
      const { data } = await api.get<FirmSettings>("/settings/firm");
      return data;
    },
  });
}

export function useUpdateFirmSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; settings?: Record<string, unknown> }) => {
      const { data } = await api.put<FirmSettings>("/settings/firm", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "firm"] });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["settings", "profile"],
    queryFn: async () => {
      const { data } = await api.get<UserProfile>("/settings/profile");
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { first_name?: string; last_name?: string }) => {
      const { data } = await api.put<UserProfile>("/settings/profile", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] });
    },
  });
}

export function useTeamUsers() {
  return useQuery({
    queryKey: ["settings", "users"],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfile[] }>("/settings/users");
      return data.data;
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InviteUserPayload) => {
      const { data } = await api.post<UserProfile>("/settings/users/invite", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await api.put<UserProfile>(`/settings/users/${userId}/role`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/settings/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
    },
  });
}
