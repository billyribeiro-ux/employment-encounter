"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Users,
  Briefcase,
  MapPin,
  Globe,
  Edit,
  Trash2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Departments for organizational structure
interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  headcount: number;
  openPositions: number;
  location: string;
  budget: string;
}

const SAMPLE_DEPARTMENTS: Department[] = [
  { id: "1", name: "Engineering", description: "Software development and infrastructure", head: "Jane Smith", headcount: 45, openPositions: 8, location: "San Francisco, CA", budget: "$2.4M" },
  { id: "2", name: "Product Design", description: "UX/UI design and user research", head: "Alex Kim", headcount: 12, openPositions: 3, location: "San Francisco, CA", budget: "$800K" },
  { id: "3", name: "Marketing", description: "Brand, growth, and content marketing", head: "Maria Garcia", headcount: 18, openPositions: 2, location: "New York, NY", budget: "$1.2M" },
  { id: "4", name: "Sales", description: "Enterprise and mid-market sales", head: "Tom Wilson", headcount: 25, openPositions: 5, location: "New York, NY", budget: "$1.8M" },
  { id: "5", name: "People Operations", description: "HR, recruiting, and employee experience", head: "Sarah Chen", headcount: 8, openPositions: 1, location: "San Francisco, CA", budget: "$500K" },
  { id: "6", name: "Customer Success", description: "Client onboarding and retention", head: "David Park", headcount: 15, openPositions: 4, location: "Austin, TX", budget: "$900K" },
  { id: "7", name: "Finance", description: "Financial planning, accounting, and compliance", head: "Lisa Wang", headcount: 6, openPositions: 1, location: "San Francisco, CA", budget: "$400K" },
  { id: "8", name: "Data Science", description: "Analytics, ML, and business intelligence", head: "Chris Lee", headcount: 10, openPositions: 3, location: "Remote", budget: "$1.1M" },
];

export default function DepartmentsPage() {
  const [departments] = useState(SAMPLE_DEPARTMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filtered = departments.filter(
    d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalHeadcount = departments.reduce((sum, d) => sum + d.headcount, 0);
  const totalOpenPositions = departments.reduce((sum, d) => sum + d.openPositions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage organizational departments and hiring allocation
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Headcount</p>
                <p className="text-2xl font-bold">{totalHeadcount}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-2xl font-bold">{totalOpenPositions}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Departments Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((dept, idx) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{dept.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {dept.openPositions} open
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{dept.description}</p>

                <Separator className="my-3" />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Department Head</span>
                    <span className="font-medium">{dept.head}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Team Size</span>
                    <span className="font-medium">{dept.headcount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </span>
                    <span className="font-medium">{dept.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hiring Budget</span>
                    <span className="font-medium">{dept.budget}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                    View Jobs
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>Create a new department in your organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Department Name</Label>
              <Input placeholder="e.g., Engineering" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="What does this department do?" rows={2} className="mt-1" />
            </div>
            <div>
              <Label>Department Head</Label>
              <Input placeholder="Name of department head" className="mt-1" />
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="e.g., San Francisco, CA" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { setCreateDialogOpen(false); toast.success("Department created"); }}>
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
