"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Mail,
  Loader2,
  Check,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Building2,
  CreditCard,
  Link2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

const firmSchema = z.object({
  name: z.string().min(1, "Firm name is required"),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(12, "Password must be at least 12 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.string().min(1, "Role is required"),
});

type ProfileForm = z.infer<typeof profileSchema>;
type FirmForm = z.infer<typeof firmSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type InviteForm = z.infer<typeof inviteSchema>;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get("/settings/profile");
      return data;
    },
  });

  // Fetch firm settings
  const { data: firm } = useQuery({
    queryKey: ["firm"],
    queryFn: async () => {
      const { data } = await api.get("/settings/firm");
      return data;
    },
  });

  // Fetch team members
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data } = await api.get("/settings/users");
      return data;
    },
  });

  const team = teamData?.data ?? [];

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      first_name: profile?.first_name || user?.first_name || "",
      last_name: profile?.last_name || user?.last_name || "",
    },
  });

  // Firm form
  const firmForm = useForm<FirmForm>({
    resolver: zodResolver(firmSchema),
    values: { name: firm?.name || "" },
  });

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  // Invite form
  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", first_name: "", last_name: "", role: "staff_accountant" },
  });

  // Mutations
  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => api.put("/settings/profile", data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const updateFirm = useMutation({
    mutationFn: (data: FirmForm) => api.put("/settings/firm", data),
    onSuccess: () => {
      toast.success("Firm settings updated");
      queryClient.invalidateQueries({ queryKey: ["firm"] });
    },
    onError: () => toast.error("Failed to update firm settings"),
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) => api.post("/auth/change-password", {
      current_password: data.current_password,
      new_password: data.new_password,
    }),
    onSuccess: () => {
      toast.success("Password updated successfully");
      passwordForm.reset();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(axiosErr.response?.data?.error?.message || "Failed to change password");
    },
  });

  const inviteUser = useMutation({
    mutationFn: (data: InviteForm) => api.post("/settings/users/invite", data),
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      inviteForm.reset();
      setShowInviteForm(false);
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(axiosErr.response?.data?.error?.message || "Failed to send invitation");
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => api.delete(`/settings/users/${userId}`),
    onSuccess: () => {
      toast.success("Team member removed");
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: () => toast.error("Failed to remove team member"),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.put(`/settings/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: () => toast.error("Failed to update role"),
  });

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-700 dark:text-red-400",
    partner: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    manager: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    senior_accountant: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    staff_accountant: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  };

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and firm settings</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="firm">Firm</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* === PROFILE TAB === */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={profileForm.control} name="first_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input {...field} className="bg-muted/50 border-0" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={profileForm.control} name="last_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input {...field} className="bg-muted/50 border-0" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={profile?.email || user?.email || ""} disabled className="bg-muted/30 border-0" />
                      <p className="text-xs text-muted-foreground">Contact support to change your email</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={roleColors[profile?.role || user?.role || ""]}>
                        <Shield className="mr-1 h-3 w-3" />
                        {(profile?.role || user?.role || "").replace(/_/g, " ")}
                      </Badge>
                      {profile?.mfa_enabled && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          MFA Enabled
                        </Badge>
                      )}
                    </div>
                    <Button type="submit" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === FIRM TAB === */}
          <TabsContent value="firm">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Firm Settings
                </CardTitle>
                <CardDescription>Manage your firm profile and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...firmForm}>
                  <form onSubmit={firmForm.handleSubmit((d) => updateFirm.mutate(d))} className="space-y-4">
                    <FormField control={firmForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firm Name</FormLabel>
                        <FormControl><Input {...field} className="bg-muted/50 border-0" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {firm && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Tier</Label>
                          <Badge variant="outline" className="capitalize">{firm.tier}</Badge>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 capitalize">{firm.status}</Badge>
                        </div>
                      </div>
                    )}
                    <Button type="submit" disabled={updateFirm.isPending}>
                      {updateFirm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TEAM TAB === */}
          <TabsContent value="team">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Team Members</CardTitle>
                    <CardDescription>Manage your team and roles</CardDescription>
                  </div>
                  <Button onClick={() => setShowInviteForm(!showInviteForm)} className="shadow-sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {showInviteForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg border bg-muted/30 p-4 space-y-3 mb-4">
                        <h3 className="text-sm font-semibold">Invite New Member</h3>
                        <Form {...inviteForm}>
                          <form onSubmit={inviteForm.handleSubmit((d) => inviteUser.mutate(d))} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <FormField control={inviteForm.control} name="first_name" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">First Name</FormLabel><FormControl><Input {...field} className="h-9 bg-background" /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={inviteForm.control} name="last_name" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Last Name</FormLabel><FormControl><Input {...field} className="h-9 bg-background" /></FormControl><FormMessage /></FormItem>
                              )} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <FormField control={inviteForm.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Email</FormLabel><FormControl><Input type="email" {...field} className="h-9 bg-background" /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={inviteForm.control} name="role" render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Role</FormLabel>
                                  <FormControl>
                                    <select {...field} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                                      <option value="staff_accountant">Staff Accountant</option>
                                      <option value="senior_accountant">Senior Accountant</option>
                                      <option value="manager">Manager</option>
                                      <option value="admin">Admin</option>
                                      <option value="partner">Partner</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" disabled={inviteUser.isPending}>
                                {inviteUser.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Mail className="mr-2 h-3 w-3" />}
                                Send Invite
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setShowInviteForm(false)}>Cancel</Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  {teamLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : team.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
                      <Users className="h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No team members yet. Invite your first!</p>
                    </div>
                  ) : (
                    team.map((member: { id: string; first_name: string; last_name: string; email: string; role: string; status: string; mfa_enabled: boolean }) => (
                      <motion.div
                        key={member.id}
                        layout
                        className="flex items-center justify-between rounded-lg border p-3 card-hover"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.first_name} {member.last_name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => updateRole.mutate({ userId: member.id, role: e.target.value })}
                            className="h-7 rounded border bg-transparent px-2 text-xs"
                            disabled={member.id === user?.id}
                          >
                            <option value="staff_accountant">Staff</option>
                            <option value="senior_accountant">Senior</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                            <option value="partner">Partner</option>
                          </select>
                          <Badge variant="outline" className="text-[10px]">
                            {member.status}
                          </Badge>
                          {member.id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove {member.first_name} {member.last_name} from your firm. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser.mutate(member.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === INTEGRATIONS TAB === */}
          <TabsContent value="integrations">
            <div className="space-y-4">
              {[
                { name: "QuickBooks Online", desc: "Sync clients, invoices, and payments", icon: RefreshCw },
                { name: "Google Drive", desc: "Sync documents with Google Drive", icon: Link2 },
                { name: "Stripe", desc: "Accept online payments from clients", icon: CreditCard },
              ].map((integration) => (
                <Card key={integration.name} className="border-0 shadow-sm card-hover">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <integration.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* === BILLING TAB === */}
          <TabsContent value="billing">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Subscription
                </CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-chart-2/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                      <p className="text-xl font-bold capitalize">{firm?.tier || "Solo"}</p>
                      <p className="text-sm text-muted-foreground mt-1">$49/month</p>
                    </div>
                    <Button variant="outline">Upgrade Plan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === SECURITY TAB === */}
          <TabsContent value="security">
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))} className="space-y-4">
                      <FormField control={passwordForm.control} name="current_password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showCurrentPassword ? "text" : "password"} {...field} className="bg-muted/50 border-0 pr-10" />
                              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={passwordForm.control} name="new_password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showNewPassword ? "text" : "password"} {...field} className="bg-muted/50 border-0 pr-10" />
                              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={passwordForm.control} name="confirm_password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl><Input type="password" {...field} className="bg-muted/50 border-0" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={changePassword.isPending}>
                        {changePassword.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Update Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.mfa_enabled ? (
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <ShieldCheck className="mr-1 h-3 w-3" /> MFA Active
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => toast.info("Use the API endpoint to disable MFA")}>
                        Disable MFA
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => toast.info("MFA setup requires authenticator app integration")}>
                      <Shield className="mr-2 h-4 w-4" /> Enable MFA
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
