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

// Hiring-domain role hierarchy. `candidate` is outside the hierarchy —
// candidate-portal access is gated by `isCandidate`, not `hasRole`.
const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 1,
  recruiter: 2,
  hiring_manager: 3,
  admin: 4,
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
  isHiringManagerOrAbove: () => boolean;
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
  // Local clear only. Caller is responsible for hitting POST /auth/logout
  // first so the server expires the HttpOnly cookies — without that, the
  // browser will keep auto-attaching them on the next page load.
  logout: () => {
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
  isHiringManagerOrAbove: () => {
    const user = get().user;
    if (!user) return false;
    return ["hiring_manager", "admin"].includes(user.role);
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
