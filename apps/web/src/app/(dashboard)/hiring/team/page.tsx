"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  useTeamMembers,
  useInviteTeamMember,
  useUpdateTeamMember,
  useDeactivateTeamMember,
  useReactivateTeamMember,
  useDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  type TeamMember,
  type TeamRole,
  type MemberStatus,
  type Department,
} from "@/lib/hooks/use-team";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Mail,
  Shield,
  Search,
  MoreHorizontal,
  Pencil,
  UserMinus,
  UserPlus,
  Building2,
  Trash2,
  Loader2,
  Check,
  X,
  Calendar,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES: { value: TeamRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "interviewer", label: "Interviewer" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Admin",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  viewer: "Viewer",
};

const STATUS_VARIANT: Record<MemberStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  invited: "secondary",
  deactivated: "outline",
};

const PERMISSIONS_MATRIX: {
  permission: string;
  admin: boolean;
  recruiter: boolean;
  hiring_manager: boolean;
  interviewer: boolean;
  viewer: boolean;
}[] = [
  {
    permission: "Manage team members",
    admin: true,
    recruiter: false,
    hiring_manager: false,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "Manage company settings",
    admin: true,
    recruiter: false,
    hiring_manager: false,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "Create & edit job postings",
    admin: true,
    recruiter: true,
    hiring_manager: true,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "Publish job postings",
    admin: true,
    recruiter: true,
    hiring_manager: false,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "View all candidates",
    admin: true,
    recruiter: true,
    hiring_manager: true,
    interviewer: false,
    viewer: true,
  },
  {
    permission: "Manage candidate pipeline",
    admin: true,
    recruiter: true,
    hiring_manager: true,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "Schedule interviews",
    admin: true,
    recruiter: true,
    hiring_manager: true,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "Submit scorecards",
    admin: true,
    recruiter: true,
    hiring_manager: true,
    interviewer: true,
    viewer: false,
  },
  {
    permission: "View assigned candidates only",
    admin: false,
    recruiter: false,
    hiring_manager: false,
    interviewer: true,
    viewer: false,
  },
  {
    permission: "Make hiring decisions",
    admin: true,
    recruiter: false,
    hiring_manager: true,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "Create & send offers",
    admin: true,
    recruiter: true,
    hiring_manager: true,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "View analytics & reports",
    admin: true,
    recruiter: true,
    hiring_manager: true,
    interviewer: false,
    viewer: true,
  },
  {
    permission: "Manage email templates",
    admin: true,
    recruiter: true,
    hiring_manager: false,
    interviewer: false,
    viewer: false,
  },
  {
    permission: "Export data",
    admin: true,
    recruiter: true,
    hiring_manager: false,
    interviewer: false,
    viewer: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(first: string, last: string): string {
  return `${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase();
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Invite Dialog
// ---------------------------------------------------------------------------

function InviteMemberDialog({
  open,
  onOpenChange,
  departments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
}) {
  const inviteMember = useInviteTeamMember();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<TeamRole>("interviewer");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  function resetForm() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("interviewer");
    setSelectedDepts([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await inviteMember.mutateAsync({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
        department_ids: selectedDepts,
      });
      toast.success(`Invitation sent to ${email}`);
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Failed to send invitation");
    }
  }

  function toggleDept(deptId: string) {
    setSelectedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your hiring team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-first">First Name</Label>
              <Input
                id="invite-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-last">Last Name</Label>
              <Input
                id="invite-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {departments.length > 0 && (
            <div className="space-y-2">
              <Label>Departments</Label>
              <div className="grid grid-cols-2 gap-2">
                {departments.map((dept) => (
                  <label
                    key={dept.id}
                    className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2 hover:bg-accent transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(dept.id)}
                      onChange={() => toggleDept(dept.id)}
                      className="rounded"
                    />
                    {dept.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Role Dialog
// ---------------------------------------------------------------------------

function EditMemberDialog({
  open,
  onOpenChange,
  member,
  departments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  departments: Department[];
}) {
  const updateMember = useUpdateTeamMember(member?.id ?? "");
  const [role, setRole] = useState<TeamRole>(member?.role ?? "viewer");
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    member?.department_ids ?? []
  );

  async function handleSave() {
    try {
      await updateMember.mutateAsync({ role, department_ids: selectedDepts });
      toast.success("Team member updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update team member");
    }
  }

  function toggleDept(deptId: string) {
    setSelectedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  }

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update role and department assignments for {member.first_name}{" "}
            {member.last_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {departments.length > 0 && (
            <div className="space-y-2">
              <Label>Departments</Label>
              <div className="grid grid-cols-2 gap-2">
                {departments.map((dept) => (
                  <label
                    key={dept.id}
                    className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2 hover:bg-accent transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(dept.id)}
                      onChange={() => toggleDept(dept.id)}
                      className="rounded"
                    />
                    {dept.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMember.isPending}>
            {updateMember.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Department Dialog
// ---------------------------------------------------------------------------

function DepartmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createDepartment = useCreateDepartment();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }
    try {
      await createDepartment.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Department created");
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create department");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>
            Add a new department to organize your hiring team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department Name</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description (optional)</Label>
            <Textarea
              id="dept-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this department do?"
              className="min-h-[60px]"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDepartment.isPending}>
              {createDepartment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Members Tab
// ---------------------------------------------------------------------------

function MembersTab({
  members,
  departments,
  isLoading,
  onInvite,
}: {
  members: TeamMember[];
  departments: Department[];
  isLoading: boolean;
  onInvite: () => void;
}) {
  const deactivateMember = useDeactivateTeamMember();
  const reactivateMember = useReactivateTeamMember();
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = members;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.first_name.toLowerCase().includes(q) ||
          m.last_name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((m) => m.role === roleFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }
    return result;
  }, [members, searchQuery, roleFilter, statusFilter]);

  function handleDeactivate(member: TeamMember) {
    deactivateMember.mutate(member.id, {
      onSuccess: () => toast.success(`${member.first_name} has been deactivated`),
      onError: () => toast.error("Failed to deactivate member"),
    });
  }

  function handleReactivate(member: TeamMember) {
    reactivateMember.mutate(member.id, {
      onSuccess: () => toast.success(`${member.first_name} has been reactivated`),
      onError: () => toast.error("Failed to reactivate member"),
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onInvite}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No team members found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {members.length === 0
                  ? "Invite your first team member to get started."
                  : "No members match your current filters."}
              </p>
              {members.length === 0 && (
                <Button onClick={onInvite}>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-center">Interviews</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {member.role === "admin" && (
                            <Shield className="mr-1 h-3 w-3" />
                          )}
                          {ROLE_LABEL[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.department_ids.length > 0
                            ? member.department_ids.map((dId) => {
                                const dept = departments.find((d) => d.id === dId);
                                return (
                                  <Badge key={dId} variant="secondary" className="text-[10px]">
                                    {dept?.name ?? dId}
                                  </Badge>
                                );
                              })
                            : <span className="text-xs text-muted-foreground">--</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[member.status]} className="capitalize">
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(member.last_active_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">
                          {member.interview_count_month}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditMember(member);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit Role
                            </DropdownMenuItem>
                            {member.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(member)}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="mr-2 h-3.5 w-3.5" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : member.status === "deactivated" ? (
                              <DropdownMenuItem
                                onClick={() => handleReactivate(member)}
                              >
                                <UserPlus className="mr-2 h-3.5 w-3.5" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={editMember}
        departments={departments}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Departments Tab
// ---------------------------------------------------------------------------

function DepartmentsTab({
  departments,
  isLoading,
}: {
  departments: Department[];
  isLoading: boolean;
}) {
  const deleteDepartment = useDeleteDepartment();
  const [createOpen, setCreateOpen] = useState(false);

  function handleDelete(dept: Department) {
    deleteDepartment.mutate(dept.id, {
      onSuccess: () => toast.success(`Department "${dept.name}" deleted`),
      onError: () => toast.error("Failed to delete department"),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Departments</h3>
          <p className="text-sm text-muted-foreground">
            Organize your team by department and assign default hiring pipelines.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No departments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create departments to organize your hiring team.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm">{dept.name}</CardTitle>
                    {dept.description && (
                      <CardDescription className="text-xs mt-1">
                        {dept.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDelete(dept)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {dept.member_count} member{dept.member_count !== 1 ? "s" : ""}
                  </div>
                  {dept.default_pipeline_id && (
                    <Badge variant="outline" className="text-[10px]">
                      Pipeline assigned
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DepartmentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Permissions Tab
// ---------------------------------------------------------------------------

function PermissionsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Role Permissions Matrix</CardTitle>
        <CardDescription>
          Overview of what each role can access and manage.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Permission</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-center">Recruiter</TableHead>
                <TableHead className="text-center">Hiring Manager</TableHead>
                <TableHead className="text-center">Interviewer</TableHead>
                <TableHead className="text-center">Viewer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS_MATRIX.map((row) => (
                <TableRow key={row.permission}>
                  <TableCell className="text-sm">{row.permission}</TableCell>
                  <TableCell className="text-center">
                    {row.admin ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.recruiter ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.hiring_manager ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.interviewer ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.viewer ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeamManagementPage() {
  const { data: members = [], isLoading: membersLoading } = useTeamMembers();
  const { data: departments = [], isLoading: deptsLoading } = useDepartments();
  const [inviteOpen, setInviteOpen] = useState(false);

  const activeMembers = members.filter((m) => m.status === "active").length;
  const invitedMembers = members.filter((m) => m.status === "invited").length;
  const totalInterviews = members.reduce(
    (sum, m) => sum + m.interview_count_month,
    0
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Team Management" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Manage your hiring team members, roles, and departments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Active Members
              </span>
            </div>
            <p className="text-2xl font-bold">
              {membersLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                activeMembers
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Pending Invitations
              </span>
            </div>
            <p className="text-2xl font-bold">
              {membersLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                invitedMembers
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Departments
              </span>
            </div>
            <p className="text-2xl font-bold">
              {deptsLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                departments.length
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Interviews This Month
              </span>
            </div>
            <p className="text-2xl font-bold">
              {membersLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                totalInterviews
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTab
            members={members}
            departments={departments}
            isLoading={membersLoading}
            onInvite={() => setInviteOpen(true)}
          />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab departments={departments} isLoading={deptsLoading} />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTab />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        departments={departments}
      />
    </div>
  );
}
