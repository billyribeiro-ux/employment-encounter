import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant_id: string;
  mfa_enabled?: boolean;
  status?: string;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
  staff_accountant: 1,
  senior_accountant: 2,
  manager: 3,
  partner: 4,
  admin: 5,
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCandidate: boolean;
  isEmployer: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (minRole: string) => boolean;
  isAdmin: () => boolean;
  isPartnerOrAbove: () => boolean;
  displayName: () => string;
  initials: () => string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isCandidate: false,
  isEmployer: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      isCandidate: user?.role === "candidate",
      isEmployer: user?.role !== "candidate",
    }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isCandidate: false,
      isEmployer: false,
    });
  },
  hasRole: (minRole: string) => {
    const user = get().user;
    if (!user) return false;
    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= requiredLevel;
  },
  isAdmin: () => {
    const user = get().user;
    return user?.role === "admin";
  },
  isPartnerOrAbove: () => {
    const user = get().user;
    if (!user) return false;
    return ["partner", "admin"].includes(user.role);
  },
  displayName: () => {
    const user = get().user;
    if (!user) return "User";
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.email;
  },
  initials: () => {
    const user = get().user;
    if (!user) return "U";
    const f = user.first_name?.[0] || "";
    const l = user.last_name?.[0] || "";
    return (f + l).toUpperCase() || "U";
  },
}));
