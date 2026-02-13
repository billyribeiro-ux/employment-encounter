import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TeamRole =
  | "admin"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "viewer";

export type MemberStatus = "active" | "invited" | "deactivated";

export interface TeamMember {
  id: string;
  tenant_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role: TeamRole;
  department_ids: string[];
  status: MemberStatus;
  last_active_at: string | null;
  interview_count_month: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  default_pipeline_id: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface InviteTeamMemberPayload {
  email: string;
  first_name: string;
  last_name: string;
  role: TeamRole;
  department_ids?: string[];
}

export interface UpdateTeamMemberPayload {
  role?: TeamRole;
  department_ids?: string[];
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  default_pipeline_id?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  default_pipeline_id?: string;
}

export function useTeamMembers(params?: {
  role?: TeamRole;
  status?: MemberStatus;
  department_id?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["team-members", params],
    queryFn: async () => {
      const { data } = await api.get<TeamMember[]>("/team/members", { params });
      return data;
    },
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: ["team-members", id],
    queryFn: async () => {
      const { data } = await api.get<TeamMember>(`/team/members/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InviteTeamMemberPayload) => {
      const { data } = await api.post<TeamMember>("/team/members/invite", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useUpdateTeamMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateTeamMemberPayload) => {
      const { data } = await api.put<TeamMember>(`/team/members/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useDeactivateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/team/members/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useReactivateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/team/members/${id}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get<Department[]>("/team/departments");
      return data;
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDepartmentPayload) => {
      const { data } = await api.post<Department>("/team/departments", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateDepartmentPayload) => {
      const { data } = await api.put<Department>(`/team/departments/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
