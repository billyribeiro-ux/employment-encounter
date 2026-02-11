"use client";

import { Calendar as CalendarIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compliance Calendar
        </h1>
        <p className="text-muted-foreground">
          Track tax deadlines, filing dates, and compliance milestones
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Calendar view coming soon</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              The compliance calendar will display IRS deadlines, state filing
              dates, and custom reminders for your clients.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
