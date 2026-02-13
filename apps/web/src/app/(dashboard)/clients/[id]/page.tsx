"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  Briefcase,
  MapPin,
  DollarSign,
  Edit,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// Department detail page
export default function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Simulated department data
  const department = {
    id,
    name: "Engineering",
    description: "Software development, infrastructure, and technical operations",
    head: "Jane Smith",
    headcount: 45,
    openPositions: 8,
    location: "San Francisco, CA",
    budget: "$2.4M",
    budgetUsed: 1800000,
    budgetTotal: 2400000,
    teams: [
      { name: "Frontend", members: 12, openRoles: 3 },
      { name: "Backend", members: 15, openRoles: 2 },
      { name: "Infrastructure", members: 8, openRoles: 1 },
      { name: "Mobile", members: 6, openRoles: 1 },
      { name: "QA", members: 4, openRoles: 1 },
    ],
    recentHires: [
      { name: "Alex Kim", role: "Senior Frontend Engineer", date: "2026-02-01" },
      { name: "Sarah Lee", role: "DevOps Engineer", date: "2026-01-15" },
      { name: "James Park", role: "Full Stack Developer", date: "2026-01-05" },
    ],
  };

  const budgetPercent = Math.round((department.budgetUsed / department.budgetTotal) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
        <Badge variant="secondary">{department.openPositions} open positions</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Department Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Department Overview</CardTitle>
                <Button variant="outline" size="sm">
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{department.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department Head</p>
                    <p className="text-sm font-medium">{department.head}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{department.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Team Size</p>
                    <p className="text-sm font-medium">{department.headcount} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Open Positions</p>
                    <p className="text-sm font-medium">{department.openPositions}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teams */}
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {department.teams.map((team) => (
                  <div key={team.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{team.members} members</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {team.openRoles > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {team.openRoles} open
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        <Briefcase className="mr-1 h-3 w-3" />
                        View Jobs
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Hiring Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hiring Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">${(department.budgetUsed / 1000000).toFixed(1)}M / {department.budget}</span>
                </div>
                <Progress value={budgetPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">{budgetPercent}% utilized</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Hires */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Hires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {department.recentHires.map((hire) => (
                  <div key={hire.name} className="flex items-start gap-2">
                    <UserPlus className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{hire.name}</p>
                      <p className="text-xs text-muted-foreground">{hire.role}</p>
                      <p className="text-xs text-muted-foreground">{new Date(hire.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button className="w-full" size="sm">
                  <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                  Create Job Posting
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
