"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Building2,
  Briefcase,
  Users,
  FileText,
  CheckSquare,
  Square,
  Lightbulb,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Globe,
  Star,
  Target,
  Clipboard,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useMeeting } from "@/lib/hooks/use-meetings";
import { cn } from "@/lib/utils";

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDurationMinutes(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
}

function getTimeUntil(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "Interview has passed";

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} and ${hours} hour${hours !== 1 ? "s" : ""} away`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""} away`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} away`;
}

function interviewTypeLabel(type: string): string {
  switch (type) {
    case "phone_screen":
      return "Phone Screen";
    case "technical":
      return "Technical Interview";
    case "onsite":
      return "On-site Interview";
    case "final":
      return "Final Round";
    case "video":
      return "Video Interview";
    case "behavioral":
      return "Behavioral Interview";
    default:
      return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

function getChecklistForType(type: string): ChecklistItem[] {
  const common: ChecklistItem[] = [
    { id: "resume", label: "Update and print copies of your resume", checked: false },
    { id: "company", label: "Research the company thoroughly", checked: false },
    { id: "questions", label: "Prepare questions to ask the interviewer", checked: false },
    { id: "attire", label: "Plan your outfit or set up your background", checked: false },
    { id: "directions", label: "Confirm interview time and logistics", checked: false },
  ];

  switch (type) {
    case "phone_screen":
      return [
        { id: "quiet", label: "Find a quiet location with good cell reception", checked: false },
        { id: "elevator", label: "Prepare your elevator pitch (30-60 seconds)", checked: false },
        { id: "resume-handy", label: "Have your resume in front of you for reference", checked: false },
        { id: "research", label: "Research the company, recent news, and mission", checked: false },
        { id: "questions-ps", label: "Prepare 2-3 thoughtful questions about the role", checked: false },
        { id: "salary", label: "Know your salary expectations if asked", checked: false },
        { id: "water", label: "Have water and a notepad nearby", checked: false },
      ];
    case "technical":
      return [
        { id: "tech-stack", label: "Review the job description and required tech stack", checked: false },
        { id: "coding", label: "Practice coding problems (arrays, strings, trees, graphs)", checked: false },
        { id: "system-design", label: "Review system design concepts and patterns", checked: false },
        { id: "past-projects", label: "Prepare to discuss past technical projects in depth", checked: false },
        { id: "ide", label: "Set up your coding environment or whiteboard", checked: false },
        { id: "think-aloud", label: "Practice thinking out loud while problem-solving", checked: false },
        { id: "edge-cases", label: "Remember to discuss edge cases and trade-offs", checked: false },
        ...common.slice(0, 2),
      ];
    case "onsite":
      return [
        { id: "route", label: "Plan your route and aim to arrive 10-15 minutes early", checked: false },
        { id: "dress", label: "Dress appropriately for the company culture", checked: false },
        { id: "copies", label: "Bring 5+ copies of your resume", checked: false },
        { id: "portfolio", label: "Prepare your portfolio or work samples", checked: false },
        { id: "references", label: "Have a list of references ready", checked: false },
        { id: "schedule", label: "Review the interview schedule and who you will meet", checked: false },
        { id: "lunch", label: "Eat a good meal beforehand and bring a water bottle", checked: false },
        { id: "notepad", label: "Bring a professional notepad and pen", checked: false },
        { id: "id", label: "Bring a valid ID for building access", checked: false },
      ];
    case "final":
      return [
        { id: "feedback", label: "Review feedback and notes from previous rounds", checked: false },
        { id: "leadership", label: "Prepare for senior leadership style questions", checked: false },
        { id: "compensation", label: "Have your compensation expectations ready", checked: false },
        { id: "culture", label: "Prepare questions about team culture and growth", checked: false },
        { id: "goals", label: "Be ready to discuss long-term career goals", checked: false },
        { id: "value", label: "Articulate the unique value you bring to the team", checked: false },
        { id: "start-date", label: "Know your earliest possible start date", checked: false },
        ...common.slice(0, 3),
      ];
    default:
      return [
        { id: "video-test", label: "Test your camera, microphone, and internet connection", checked: false },
        { id: "background", label: "Choose a clean, professional background", checked: false },
        { id: "lighting", label: "Ensure good lighting on your face", checked: false },
        ...common,
      ];
  }
}

interface TipSection {
  title: string;
  icon: React.ReactNode;
  tips: string[];
}

function getTipsForType(type: string): TipSection[] {
  switch (type) {
    case "phone_screen":
      return [
        {
          title: "Before the Call",
          icon: <Phone className="h-4 w-4" />,
          tips: [
            "Research the company's mission, products, and recent news",
            "Review the job description and match your experience to requirements",
            "Prepare a concise elevator pitch about yourself",
            "Write down key accomplishments with specific numbers and metrics",
            "Practice common phone screen questions out loud",
          ],
        },
        {
          title: "During the Call",
          icon: <MessageSquare className="h-4 w-4" />,
          tips: [
            "Smile while you talk - it changes your tone of voice",
            "Speak clearly and at a moderate pace",
            "Use the STAR method for behavioral questions (Situation, Task, Action, Result)",
            "Take brief pauses to organize your thoughts before answering",
            "Have your resume and notes visible for quick reference",
          ],
        },
        {
          title: "Questions to Ask",
          icon: <Lightbulb className="h-4 w-4" />,
          tips: [
            "What does a typical day look like in this role?",
            "What are the biggest challenges the team is currently facing?",
            "What does success look like in the first 90 days?",
            "Can you tell me about the team I would be working with?",
            "What are the next steps in the interview process?",
          ],
        },
      ];
    case "technical":
      return [
        {
          title: "Coding Interview Tips",
          icon: <FileText className="h-4 w-4" />,
          tips: [
            "Clarify the problem before jumping into code",
            "Talk through your approach before writing code",
            "Start with a brute force solution, then optimize",
            "Consider edge cases: empty input, single element, duplicates, very large input",
            "Test your solution with examples and walk through the logic",
            "Discuss time and space complexity of your solution",
          ],
        },
        {
          title: "System Design Tips",
          icon: <Target className="h-4 w-4" />,
          tips: [
            "Ask clarifying questions about scale and requirements",
            "Start with a high-level design, then dive into details",
            "Consider scalability, reliability, and performance",
            "Discuss trade-offs between different approaches",
            "Draw clear diagrams to illustrate your design",
            "Address data storage, caching, and API design",
          ],
        },
        {
          title: "Common Topics to Review",
          icon: <BookOpen className="h-4 w-4" />,
          tips: [
            "Data structures: arrays, linked lists, trees, graphs, hash tables",
            "Algorithms: sorting, searching, dynamic programming, BFS/DFS",
            "Object-oriented design principles (SOLID)",
            "Database concepts: SQL vs NoSQL, indexing, normalization",
            "API design: REST, GraphQL, authentication patterns",
            "Concurrency and distributed systems basics",
          ],
        },
      ];
    case "onsite":
      return [
        {
          title: "Logistics",
          icon: <MapPin className="h-4 w-4" />,
          tips: [
            "Confirm the office address and which entrance to use",
            "Plan to arrive 10-15 minutes early",
            "Dress one level above the company's dress code",
            "Bring a professional bag with all your materials",
            "Know the name and contact info of your interview coordinator",
          ],
        },
        {
          title: "During the Day",
          icon: <Star className="h-4 w-4" />,
          tips: [
            "Be friendly to everyone you meet - receptionists, other employees",
            "Maintain positive energy throughout the day",
            "Each interview is a fresh start - do not dwell on previous sessions",
            "Take notes between sessions about key discussion points",
            "Ask each interviewer what they enjoy about working there",
          ],
        },
        {
          title: "Body Language",
          icon: <Users className="h-4 w-4" />,
          tips: [
            "Offer a firm handshake and make eye contact",
            "Sit up straight and lean slightly forward to show engagement",
            "Nod and smile to show you are actively listening",
            "Avoid crossing your arms or fidgeting",
            "Mirror the interviewer's energy level appropriately",
          ],
        },
      ];
    case "final":
      return [
        {
          title: "Senior Leadership Questions",
          icon: <Users className="h-4 w-4" />,
          tips: [
            "Be prepared to discuss your vision for the role",
            "Show strategic thinking beyond day-to-day tasks",
            "Demonstrate cultural fit and alignment with company values",
            "Have clear examples of leadership and impact at previous companies",
            "Be authentic - senior leaders value genuine conversations",
          ],
        },
        {
          title: "Compensation Discussion",
          icon: <Briefcase className="h-4 w-4" />,
          tips: [
            "Research market rates for the role and location",
            "Know your minimum acceptable compensation",
            "Consider total compensation: base, bonus, equity, benefits",
            "Be prepared to justify your expectations with data",
            "Express flexibility and willingness to negotiate",
          ],
        },
        {
          title: "Closing Strong",
          icon: <Target className="h-4 w-4" />,
          tips: [
            "Reiterate your excitement about the role and company",
            "Summarize why you are the best fit for the position",
            "Ask about the decision timeline and next steps",
            "Request feedback on your interview performance",
            "Send personalized thank-you notes within 24 hours",
          ],
        },
      ];
    default:
      return [
        {
          title: "General Interview Tips",
          icon: <Lightbulb className="h-4 w-4" />,
          tips: [
            "Research the company, their products, and recent news",
            "Practice the STAR method for behavioral questions",
            "Prepare specific examples that demonstrate your skills",
            "Be ready to explain gaps or transitions in your career",
            "Show enthusiasm and genuine interest in the role",
          ],
        },
        {
          title: "Video Interview Setup",
          icon: <Video className="h-4 w-4" />,
          tips: [
            "Test your camera, microphone, and internet 30 minutes before",
            "Use a clean, professional background",
            "Position your camera at eye level",
            "Close unnecessary browser tabs and applications",
            "Have a backup plan (phone number) in case of technical issues",
          ],
        },
        {
          title: "Questions to Ask",
          icon: <MessageSquare className="h-4 w-4" />,
          tips: [
            "What are the team's current priorities and challenges?",
            "How do you measure success in this role?",
            "What opportunities for growth and development exist?",
            "What is the team's approach to collaboration?",
            "What does the onboarding process look like?",
          ],
        },
      ];
  }
}

export default function InterviewPrepPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as string;
  const { data: meeting, isLoading, isError } = useMeeting(meetingId);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistInitialized, setChecklistInitialized] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Initialize checklist when meeting data loads
  if (meeting && !checklistInitialized) {
    setChecklist(getChecklistForType(meeting.meeting_type));
    setChecklistInitialized(true);
  }

  const checkedCount = checklist.filter((item) => item.checked).length;
  const checklistProgress =
    checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0;

  function toggleChecklistItem(id: string) {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  function handleSaveNotes() {
    // In a real app, this would save to the API
    setNotesSaved(true);
    toast.success("Notes saved");
    setTimeout(() => setNotesSaved(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Interview Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          This interview may have been cancelled or removed.
        </p>
        <Link href="/candidate/interviews">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Interviews
          </Button>
        </Link>
      </div>
    );
  }

  const startTime = meeting.confirmed_start || meeting.proposed_start;
  const endTime = meeting.confirmed_end || meeting.proposed_end;
  const duration = getDurationMinutes(startTime, endTime);
  const isVirtual = !!meeting.meeting_link || !!meeting.video_room_id;
  const tips = getTipsForType(meeting.meeting_type);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => router.push("/candidate/interviews")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Interviews
      </Button>

      {/* Interview Details Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div>
                  <Badge className="mb-2">
                    {interviewTypeLabel(meeting.meeting_type)}
                  </Badge>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {meeting.title}
                  </h1>
                  {meeting.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {meeting.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{duration} minutes</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  {isVirtual && !meeting.location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span>Virtual Meeting</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    {getTimeUntil(startTime)}
                  </Badge>
                  {meeting.timezone && (
                    <span className="text-xs text-muted-foreground">
                      {meeting.timezone}
                    </span>
                  )}
                </div>
              </div>

              {isVirtual && meeting.meeting_link && (
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg">
                    <Video className="mr-2 h-4 w-4" />
                    Join Video Call
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Tips */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tips Sections */}
          {tips.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: sectionIndex * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {section.tips.map((tip, tipIndex) => (
                      <li
                        key={tipIndex}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {tipIndex + 1}
                        </div>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Company Research Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" />
                Company Research
              </CardTitle>
              <CardDescription>
                Key information to review before your interview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    About the Company
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Review the company website, About page, and LinkedIn profile.
                    Understand their products, services, and target market.
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Recent News
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Search for recent press releases, blog posts, or news articles.
                    Mention something current during the interview to show genuine interest.
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Team & Culture
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Look up your interviewers on LinkedIn. Check Glassdoor for
                    company culture reviews and interview experiences.
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Role Alignment
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Re-read the job description. Map your specific experiences and
                    skills to each requirement listed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preparation Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clipboard className="h-4 w-4" />
                Preparation Checklist
              </CardTitle>
              <CardDescription>
                {checkedCount} of {checklist.length} completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={checklistProgress} className="h-2" />
              <div className="space-y-1">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className="flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-muted/50"
                  >
                    {item.checked ? (
                      <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        "text-xs leading-relaxed",
                        item.checked && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Your Notes
              </CardTitle>
              <CardDescription>
                Prepare talking points and key things to remember
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Write your preparation notes here...&#10;&#10;- Key experiences to mention&#10;- Questions to ask&#10;- Important points about your background&#10;- Why this role excites you"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesSaved(false);
                }}
                rows={10}
                className="text-sm"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={notesSaved}
                className="w-full"
                variant={notesSaved ? "outline" : "default"}
              >
                <Save className="mr-2 h-4 w-4" />
                {notesSaved ? "Notes Saved" : "Save Notes"}
              </Button>
            </CardContent>
          </Card>

          {/* STAR Method Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4" />
                STAR Method
              </CardTitle>
              <CardDescription>
                Framework for answering behavioral questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  letter: "S",
                  title: "Situation",
                  desc: "Set the scene. Describe the context and background.",
                },
                {
                  letter: "T",
                  title: "Task",
                  desc: "Explain your responsibility or the challenge you faced.",
                },
                {
                  letter: "A",
                  title: "Action",
                  desc: "Detail the specific steps you took to address the situation.",
                },
                {
                  letter: "R",
                  title: "Result",
                  desc: "Share the outcome. Use metrics when possible.",
                },
              ].map((item) => (
                <div key={item.letter} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.letter}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
