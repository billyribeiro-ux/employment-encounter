"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Users, Shield, Mail } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and firm settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="firm">Firm</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" defaultValue={user?.first_name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" defaultValue={user?.last_name || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" placeholder="e.g. Senior CPA, Partner" />
              </div>
              <Button onClick={() => toast.success("Profile updated")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firm">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Firm Settings</CardTitle>
                <CardDescription>Manage your firm profile and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firm_name">Firm Name</Label>
                    <Input id="firm_name" placeholder="Your Firm Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firm_phone">Phone</Label>
                    <Input id="firm_phone" type="tel" placeholder="(555) 000-0000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firm_email">Firm Email</Label>
                    <Input id="firm_email" type="email" placeholder="info@yourfirm.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firm_website">Website</Label>
                    <Input id="firm_website" placeholder="https://yourfirm.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firm_address">Address</Label>
                  <Input id="firm_address" placeholder="123 Main St, Suite 100, City, ST 12345" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      defaultValue="America/New_York"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_rate">Default Hourly Rate (cents)</Label>
                    <Input id="default_rate" type="number" defaultValue="15000" placeholder="15000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal_year">Default Fiscal Year End</Label>
                  <select
                    id="fiscal_year"
                    defaultValue="Calendar"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Calendar">Calendar Year (Dec 31)</option>
                    <option value="March">March 31</option>
                    <option value="June">June 30</option>
                    <option value="September">September 30</option>
                  </select>
                </div>
                <Button onClick={() => toast.success("Firm settings updated")}>Save Changes</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Invite and manage team members</CardDescription>
                </div>
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {user?.first_name?.[0] || "Y"}{user?.last_name?.[0] || "O"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user?.first_name || "You"} {user?.last_name || ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email || "you@firm.com"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      <Shield className="mr-1 h-3 w-3" />
                      {user?.role || "Partner"}
                    </Badge>
                    <Badge variant="outline">Owner</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-6 text-center border rounded-lg border-dashed">
                  <Users className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Invite CPAs, staff, and admins to your firm.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>QuickBooks Online</CardTitle>
                <CardDescription>Sync clients, invoices, and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Connect QuickBooks</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Google Drive</CardTitle>
                <CardDescription>Sync documents with Google Drive</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Connect Google Drive</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stripe</CardTitle>
                <CardDescription>Accept online payments from clients</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Connect Stripe</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-muted-foreground">Solo — $49/month</p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input id="current_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input id="new_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input id="confirm_password" type="password" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Enable MFA</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
