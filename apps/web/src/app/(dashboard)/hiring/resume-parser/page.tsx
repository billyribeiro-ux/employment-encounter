"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  UserPlus,
  Files,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  useResumeParser,
  type ParsedResume,
  type ParsedSkill,
} from "@/lib/hooks/use-resume-parser";
import { toast } from "sonner";

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (confidence >= 75) return "text-blue-700 bg-blue-50 border-blue-200";
  if (confidence >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

function formatDateRange(start: string, end: string): string {
  const formatMonth = (d: string) => {
    if (d === "Present") return "Present";
    const [year, month] = d.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };
  return `${formatMonth(start)} - ${formatMonth(end)}`;
}

function EditableField({
  label,
  value,
  onSave,
  multiline = false,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  function handleSave() {
    onSave(editValue);
    setIsEditing(false);
  }

  function handleCancel() {
    setEditValue(value);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            className="text-sm"
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-sm h-8"
            autoFocus
          />
        )}
        <div className="flex gap-1">
          <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSave}>
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-start gap-1">
        <p className="text-sm flex-1">{value || "Not extracted"}</p>
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-opacity"
        >
          <Edit2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function SkillTag({ skill }: { skill: ParsedSkill }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${confidenceColor(skill.confidence)}`}
    >
      <span className="font-medium">{skill.name}</span>
      <span className="text-[10px] opacity-70">{skill.confidence}%</span>
    </div>
  );
}

function ParsedResumeCard({
  resume,
  onUpdate,
  onRemove,
  onCreateProfile,
}: {
  resume: ParsedResume;
  onUpdate: typeof Function.prototype;
  onRemove: () => void;
  onCreateProfile: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (resume.status === "parsing") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-blue-500 animate-spin" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">{resume.fileName}</p>
              <p className="text-xs text-muted-foreground">
                AI is parsing this resume...
              </p>
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span className="text-xs text-blue-600">Extracting information</span>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resume.status === "error") {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{resume.fileName}</p>
              <p className="text-xs text-red-600">
                Failed to parse this resume. Please try again.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onRemove}>
              <Trash2 className="mr-1 h-3 w-3" />
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">{resume.fileName}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Parsed {new Date(resume.parsedAt).toLocaleString()} &middot;{" "}
                {resume.skills.length} skills &middot;{" "}
                {resume.workExperience.length} work experiences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs"
              onClick={onCreateProfile}
            >
              <UserPlus className="mr-1 h-3 w-3" />
              Create Candidate Profile
            </Button>
            <Button variant="outline" size="sm" onClick={onRemove} className="h-8">
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-600" />
              Contact Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EditableField
                label="Full Name"
                value={resume.contact.name}
                onSave={(v) => onUpdate(resume.id, "name", v)}
              />
              <EditableField
                label="Email"
                value={resume.contact.email}
                onSave={(v) => onUpdate(resume.id, "email", v)}
              />
              <EditableField
                label="Phone"
                value={resume.contact.phone}
                onSave={(v) => onUpdate(resume.id, "phone", v)}
              />
              <EditableField
                label="Location"
                value={resume.contact.location}
                onSave={(v) => onUpdate(resume.id, "location", v)}
              />
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-violet-600" />
              Professional Summary
            </h4>
            <EditableField
              label=""
              value={resume.summary}
              onSave={(v) => onUpdate(resume.id, "summary", v)}
              multiline
            />
          </div>

          <Separator />

          {/* Work Experience */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-amber-600" />
              Work Experience ({resume.workExperience.length})
            </h4>
            <div className="space-y-4">
              {resume.workExperience.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.company} &middot;{" "}
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {exp.endDate === "Present" ? "Current" : "Past"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Education */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-cyan-600" />
              Education ({resume.education.length})
            </h4>
            <div className="space-y-3">
              {resume.education.map((edu) => (
                <div
                  key={edu.id}
                  className="rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <p className="text-sm font-semibold">{edu.school}</p>
                  <p className="text-xs text-muted-foreground">
                    {edu.degree} in {edu.field} &middot;{" "}
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Skills */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Skills ({resume.skills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {resume.skills
                .sort((a, b) => b.confidence - a.confidence)
                .map((skill) => (
                  <SkillTag key={skill.id} skill={skill} />
                ))}
            </div>
          </div>

          {/* Certifications */}
          {resume.certifications.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-orange-600" />
                  Certifications ({resume.certifications.length})
                </h4>
                <div className="space-y-2">
                  {resume.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cert.issuer}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {cert.date}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Languages */}
          {resume.languages.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Languages className="h-4 w-4 text-indigo-600" />
                  Languages ({resume.languages.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {resume.languages.map((lang) => (
                    <Badge key={lang.id} variant="outline" className="text-xs py-1">
                      {lang.name} &middot; {lang.proficiency}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ResumeParserPage() {
  const {
    parsedResumes,
    isUploading,
    parseResume,
    parseMultipleResumes,
    updateContactField,
    updateSummary,
    removeResume,
  } = useResumeParser();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      if (files.length === 1) {
        parseResume(files[0].name);
        toast.success("Resume uploaded and parsing started");
      } else {
        parseMultipleResumes(files.map((f) => f.name));
        toast.success(`${files.length} resumes uploaded and parsing started`);
      }
    },
    [parseResume, parseMultipleResumes]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    parseResume(files[0].name);
    toast.success("Resume uploaded and parsing started");
    e.target.value = "";
  }

  function handleBatchSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    parseMultipleResumes(files.map((f) => f.name));
    toast.success(`${files.length} resumes uploaded and parsing started`);
    e.target.value = "";
  }

  function handleUpdate(resumeId: string, field: string, value: string) {
    if (["name", "email", "phone", "location"].includes(field)) {
      updateContactField(
        resumeId,
        field as "name" | "email" | "phone" | "location",
        value
      );
    } else if (field === "summary") {
      updateSummary(resumeId, value);
    }
    toast.success("Field updated");
  }

  function handleCreateProfile(resume: ParsedResume) {
    toast.success(
      `Candidate profile creation started for ${resume.contact.name}`
    );
  }

  const completedCount = parsedResumes.filter((r) => r.status === "completed").length;
  const parsingCount = parsedResumes.filter((r) => r.status === "parsing").length;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Smart Resume Parser" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            Smart Resume Parser
          </h1>
          <p className="text-muted-foreground">
            AI-powered resume parsing to extract candidate information automatically
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={batchInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            multiple
            onChange={handleBatchSelect}
          />
          <Button
            variant="outline"
            onClick={() => batchInputRef.current?.click()}
            disabled={isUploading}
          >
            <Files className="mr-2 h-4 w-4" />
            Batch Upload
          </Button>
        </div>
      </div>

      {/* Stats */}
      {parsedResumes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Total Uploaded
                </span>
              </div>
              <p className="text-2xl font-bold">{parsedResumes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Successfully Parsed
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Loader2 className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Currently Parsing
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{parsingCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-violet-500 bg-violet-50"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`rounded-full p-4 ${
              isDragging ? "bg-violet-100" : "bg-muted"
            }`}
          >
            <Upload
              className={`h-8 w-8 ${
                isDragging ? "text-violet-600" : "text-muted-foreground"
              }`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {isDragging ? "Drop resumes here" : "Upload Resumes"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop PDF or DOC files, or click to browse
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                parseResume("sample_resume_" + Date.now() + ".pdf");
                toast.success("Demo resume parsing started");
              }}
              disabled={isUploading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Try Demo
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Supported formats: PDF, DOC, DOCX &middot; Max size: 10MB
          </p>
        </div>
      </div>

      {/* Parsed Resumes */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Results ({parsedResumes.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          {parsedResumes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    No Resumes Parsed Yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Upload a resume above or try the demo to see AI-powered parsing
                    in action. The parser will extract contact information, work
                    experience, education, skills, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {parsedResumes.map((resume) => (
                <ParsedResumeCard
                  key={resume.id}
                  resume={resume}
                  onUpdate={handleUpdate}
                  onRemove={() => {
                    removeResume(resume.id);
                    toast.success("Resume removed");
                  }}
                  onCreateProfile={() => handleCreateProfile(resume)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {parsedResumes.filter((r) => r.status === "completed").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <History className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Parsing history will appear here once you upload and parse
                    resumes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {parsedResumes
                    .filter((r) => r.status === "completed")
                    .map((resume) => (
                      <div
                        key={resume.id}
                        className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {resume.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {resume.contact.name} &middot;{" "}
                              {resume.skills.length} skills &middot;{" "}
                              {resume.workExperience.length} experiences
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="mr-1 h-2.5 w-2.5" />
                            {new Date(resume.parsedAt).toLocaleDateString()}
                          </Badge>
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <Check className="mr-1 h-2.5 w-2.5" />
                            Parsed
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
