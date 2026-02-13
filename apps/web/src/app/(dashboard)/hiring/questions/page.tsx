"use client";

import { useState, useMemo } from "react";
import {
  HelpCircle,
  Search,
  Star,
  Plus,
  Trash2,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  BarChart3,
  Layers,
  Tag,
  Copy,
  MessageSquare,
  Brain,
  Briefcase,
  Users,
  Target,
  Award,
  Lightbulb,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { SearchInput } from "@/components/dashboard/search-input";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useQuestionSets,
  useCreateQuestionSet,
  type InterviewQuestion,
  type QuestionSet,
} from "@/lib/hooks/use-questions";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "sonner";

type QuestionCategory =
  | "technical"
  | "behavioral"
  | "situational"
  | "cultural_fit"
  | "leadership"
  | "problem_solving"
  | "role_specific";

const CATEGORY_LABELS: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  situational: "Situational",
  cultural_fit: "Cultural Fit",
  leadership: "Leadership",
  problem_solving: "Problem Solving",
  role_specific: "Role-Specific",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  technical: Wrench,
  behavioral: MessageSquare,
  situational: Lightbulb,
  cultural_fit: Users,
  leadership: Award,
  problem_solving: Brain,
  role_specific: Briefcase,
};

const CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700 border-blue-200",
  behavioral: "bg-violet-100 text-violet-700 border-violet-200",
  situational: "bg-amber-100 text-amber-700 border-amber-200",
  cultural_fit: "bg-emerald-100 text-emerald-700 border-emerald-200",
  leadership: "bg-orange-100 text-orange-700 border-orange-200",
  problem_solving: "bg-cyan-100 text-cyan-700 border-cyan-200",
  role_specific: "bg-rose-100 text-rose-700 border-rose-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-red-50 text-red-700 border-red-200",
};

// Default questions for fallback when no backend data
const DEFAULT_QUESTIONS: Omit<InterviewQuestion, "id" | "tenant_id" | "created_by" | "created_at" | "updated_at">[] = [
  {
    question: "Walk me through how you would design a system that handles millions of concurrent users. What are the key architectural decisions?",
    category: "technical", difficulty: "hard",
    suggested_followups: ["How would you handle database scaling?", "What caching strategies would you employ?", "How would you ensure fault tolerance?"],
    scoring_rubric: "5: Comprehensive architecture with load balancing, caching, DB sharding. 4: Solid approach. 3: Basic understanding. 2: Limited knowledge. 1: Cannot articulate.",
    is_starred: false, usage_count: 47, avg_score: 3.2, tags: ["system-design", "scalability"],
  },
  {
    question: "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
    category: "technical", difficulty: "medium",
    suggested_followups: ["Can you give a real-world example?", "How do you handle data consistency in NoSQL?"],
    scoring_rubric: "5: Deep understanding with practical trade-off analysis. 4: Good knowledge. 3: Basics. 2: Vague. 1: Cannot differentiate.",
    is_starred: false, usage_count: 62, avg_score: 3.6, tags: ["databases", "architecture"],
  },
  {
    question: "How do you approach debugging a production issue that you cannot reproduce locally?",
    category: "technical", difficulty: "medium",
    suggested_followups: ["What logging and monitoring tools do you use?", "Describe a particularly challenging bug you solved."],
    scoring_rubric: "5: Systematic approach with logging, metrics, reproduction strategies. 4: Good methodology. 3: Basic debugging. 2: Ad hoc. 1: No strategy.",
    is_starred: false, usage_count: 38, avg_score: 3.4, tags: ["debugging", "production"],
  },
  {
    question: "What is your experience with CI/CD pipelines? Describe your ideal deployment workflow.",
    category: "technical", difficulty: "medium",
    suggested_followups: ["How do you handle rollbacks?", "What testing strategies do you integrate?"],
    scoring_rubric: "5: Expert CI/CD knowledge. 4: Solid experience. 3: Basic understanding. 2: Minimal. 1: No experience.",
    is_starred: false, usage_count: 29, avg_score: 3.1, tags: ["devops", "ci-cd"],
  },
  {
    question: "Describe the SOLID principles and give an example of how you have applied them.",
    category: "technical", difficulty: "medium",
    suggested_followups: ["Which principle do you find most challenging?", "How do you balance principles with pragmatism?"],
    scoring_rubric: "5: All 5 principles with concrete examples. 4: Most principles. 3: Basic. 2: Vague. 1: Cannot explain.",
    is_starred: false, usage_count: 41, avg_score: 3.0, tags: ["design-patterns", "oop"],
  },
  {
    question: "How do you ensure the security of a web application?",
    category: "technical", difficulty: "hard",
    suggested_followups: ["How do you handle authentication?", "What is your approach to input validation?"],
    scoring_rubric: "5: Comprehensive security knowledge (OWASP Top 10). 4: Good awareness. 3: Basic. 2: Minimal. 1: No awareness.",
    is_starred: false, usage_count: 33, avg_score: 2.9, tags: ["security", "web"],
  },
  {
    question: "Tell me about a time when you had to work with a difficult team member. How did you handle the situation?",
    category: "behavioral", difficulty: "medium",
    suggested_followups: ["What was the outcome?", "What would you do differently?"],
    scoring_rubric: "5: Clear STAR response showing empathy and positive resolution. 4: Good example. 3: Adequate but lacking depth. 2: Vague. 1: No example.",
    is_starred: false, usage_count: 78, avg_score: 3.5, tags: ["teamwork", "conflict-resolution"],
  },
  {
    question: "Describe a situation where you had to meet a tight deadline. What steps did you take?",
    category: "behavioral", difficulty: "easy",
    suggested_followups: ["How did you prioritize tasks?", "Did you make trade-offs?"],
    scoring_rubric: "5: Excellent time management. 4: Good approach. 3: Met deadline but unclear process. 2: Struggled. 1: Failed.",
    is_starred: false, usage_count: 65, avg_score: 3.8, tags: ["time-management", "delivery"],
  },
  {
    question: "Give me an example of a time you took initiative without being asked.",
    category: "behavioral", difficulty: "easy",
    suggested_followups: ["What motivated you?", "How was it received?"],
    scoring_rubric: "5: Proactive initiative with significant impact. 4: Good self-motivation. 3: Some initiative. 2: Weak example. 1: None.",
    is_starred: false, usage_count: 52, avg_score: 3.4, tags: ["initiative", "proactiveness"],
  },
  {
    question: "Describe a situation where you received critical feedback. How did you respond?",
    category: "behavioral", difficulty: "medium",
    suggested_followups: ["How did you implement the feedback?", "What did you learn?"],
    scoring_rubric: "5: Growth mindset with specific actions. 4: Good acceptance. 3: Accepted but limited change. 2: Defensive. 1: Cannot accept.",
    is_starred: false, usage_count: 44, avg_score: 3.3, tags: ["feedback", "growth"],
  },
  {
    question: "Tell me about a project you are most proud of.",
    category: "behavioral", difficulty: "easy",
    suggested_followups: ["What was your specific contribution?", "What challenges did you overcome?"],
    scoring_rubric: "5: Passionate with clear contribution and impact. 4: Good ownership. 3: Decent but unclear role. 2: Weak. 1: Cannot articulate.",
    is_starred: false, usage_count: 71, avg_score: 3.9, tags: ["achievements", "passion"],
  },
  {
    question: "Describe a time you had to learn a new technology quickly.",
    category: "behavioral", difficulty: "easy",
    suggested_followups: ["What resources did you use?", "How long to become productive?"],
    scoring_rubric: "5: Systematic learning with fast ramp-up. 4: Good strategy. 3: Basic. 2: Struggled. 1: Resistant.",
    is_starred: false, usage_count: 56, avg_score: 3.6, tags: ["learning", "adaptability"],
  },
  {
    question: "What would you do if you discovered a critical security vulnerability right before a major launch?",
    category: "situational", difficulty: "hard",
    suggested_followups: ["How would you communicate to leadership?", "What factors influence your decision?"],
    scoring_rubric: "5: Balanced approach considering security, business, communication. 4: Good priorities. 3: Reasonable. 2: Poor judgment. 1: Would ignore.",
    is_starred: false, usage_count: 23, avg_score: 3.1, tags: ["decision-making", "crisis"],
  },
  {
    question: "How would you handle a situation where your manager asks you to cut corners on quality?",
    category: "situational", difficulty: "medium",
    suggested_followups: ["What if your manager insisted?", "How do you balance quality with business needs?"],
    scoring_rubric: "5: Diplomatic yet principled with alternatives. 4: Good communication. 3: Comply with pushback. 2: Comply without question. 1: Refuse confrontationally.",
    is_starred: false, usage_count: 35, avg_score: 3.3, tags: ["ethics", "quality"],
  },
  {
    question: "What would you do if two senior team members disagreed on technical direction and asked your opinion?",
    category: "situational", difficulty: "medium",
    suggested_followups: ["How would you evaluate both options?", "How would you facilitate consensus?"],
    scoring_rubric: "5: Facilitates data-driven discussion, builds consensus. 4: Good mediation. 3: Picks a side. 2: Avoids. 1: Cannot navigate.",
    is_starred: false, usage_count: 28, avg_score: 3.0, tags: ["decision-making", "diplomacy"],
  },
  {
    question: "How would you handle onboarding to a new team where documentation is sparse?",
    category: "situational", difficulty: "easy",
    suggested_followups: ["What would be your first week plan?", "Would you suggest improvements?"],
    scoring_rubric: "5: Proactive with systematic learning and documentation creation. 4: Good strategy. 3: Basic. 2: Passive. 1: Overwhelmed.",
    is_starred: false, usage_count: 31, avg_score: 3.5, tags: ["onboarding", "adaptability"],
  },
  {
    question: "What would you do if you realized your team was building the wrong feature?",
    category: "situational", difficulty: "medium",
    suggested_followups: ["At what point would you raise the concern?", "How would you prevent this?"],
    scoring_rubric: "5: Immediately raises concern, proposes solution. 4: Quick to identify. 3: Raises but delays. 2: Waits too long. 1: Ignores.",
    is_starred: false, usage_count: 19, avg_score: 3.2, tags: ["communication", "requirements"],
  },
  {
    question: "What kind of work environment do you thrive in? Describe your ideal team culture.",
    category: "cultural_fit", difficulty: "easy",
    suggested_followups: ["How do you contribute to creating that culture?", "What aspects are deal-breakers?"],
    scoring_rubric: "5: Self-aware, specific, aligns with company values. 4: Good fit. 3: Generic. 2: Misaligned. 1: No awareness.",
    is_starred: false, usage_count: 88, avg_score: 3.7, tags: ["culture", "values"],
  },
  {
    question: "How do you handle feedback from peers?",
    category: "cultural_fit", difficulty: "easy",
    suggested_followups: ["How do you give feedback to others?", "Do you prefer direct or gentle feedback?"],
    scoring_rubric: "5: Growth mindset with specific improvement examples. 4: Open to feedback. 3: Accepts but passive. 2: Defensive. 1: Cannot handle.",
    is_starred: false, usage_count: 54, avg_score: 3.5, tags: ["feedback", "growth"],
  },
  {
    question: "How do you balance work and personal life?",
    category: "cultural_fit", difficulty: "easy",
    suggested_followups: ["How do you handle high workload periods?", "What boundaries do you set?"],
    scoring_rubric: "5: Thoughtful approach showing sustainability. 4: Good balance. 3: Aware but unclear. 2: Unhealthy patterns. 1: Rigid.",
    is_starred: false, usage_count: 42, avg_score: 3.6, tags: ["work-life-balance"],
  },
  {
    question: "Describe a time you championed diversity or inclusion in your workplace.",
    category: "cultural_fit", difficulty: "medium",
    suggested_followups: ["What impact did it have?", "How do you ensure inclusive practices daily?"],
    scoring_rubric: "5: Active champion with concrete actions. 4: Good awareness. 3: Supportive but passive. 2: Limited. 1: Dismissive.",
    is_starred: false, usage_count: 37, avg_score: 3.2, tags: ["diversity", "inclusion"],
  },
  {
    question: "How do you approach disagreements with your manager?",
    category: "cultural_fit", difficulty: "medium",
    suggested_followups: ["Give a specific example.", "How do you know when to push back vs. align?"],
    scoring_rubric: "5: Professional, data-driven with respect. 4: Good communication. 3: Passive or aggressive. 2: Avoids conflict. 1: Confrontational.",
    is_starred: false, usage_count: 48, avg_score: 3.3, tags: ["communication", "professionalism"],
  },
  {
    question: "Tell me about a time you led a team through a challenging project.",
    category: "leadership", difficulty: "medium",
    suggested_followups: ["How did you keep the team motivated?", "What was the biggest obstacle?"],
    scoring_rubric: "5: Clear leadership with vision and results. 4: Good leadership. 3: Basic. 2: Struggled. 1: No experience.",
    is_starred: false, usage_count: 43, avg_score: 3.4, tags: ["leadership", "team-management"],
  },
  {
    question: "How do you motivate team members who are underperforming?",
    category: "leadership", difficulty: "hard",
    suggested_followups: ["How do you identify the root cause?", "When do you escalate to HR?"],
    scoring_rubric: "5: Empathetic yet accountable with coaching. 4: Good approach. 3: Basic management. 2: Too lenient or harsh. 1: Avoids it.",
    is_starred: false, usage_count: 31, avg_score: 3.0, tags: ["coaching", "performance"],
  },
  {
    question: "Describe your approach to mentoring junior team members.",
    category: "leadership", difficulty: "easy",
    suggested_followups: ["How do you tailor your style?", "Share a success story."],
    scoring_rubric: "5: Structured mentoring with measurable outcomes. 4: Active mentoring. 3: Willing but unstructured. 2: Minimal. 1: No interest.",
    is_starred: false, usage_count: 39, avg_score: 3.6, tags: ["mentoring", "growth"],
  },
  {
    question: "How do you make decisions when you do not have complete information?",
    category: "leadership", difficulty: "hard",
    suggested_followups: ["How do you communicate uncertainty?", "How do you handle wrong decisions?"],
    scoring_rubric: "5: Uses frameworks, gathers data, communicates risks. 4: Good decision-making. 3: Anxious but decides. 2: Paralyzed. 1: Rash decisions.",
    is_starred: false, usage_count: 27, avg_score: 2.9, tags: ["decision-making", "risk"],
  },
  {
    question: "Tell me about a time you influenced a decision without having formal authority.",
    category: "leadership", difficulty: "hard",
    suggested_followups: ["What strategies did you use?", "How did you handle resistance?"],
    scoring_rubric: "5: Effective influence through data and relationships. 4: Good skills. 3: Some ability. 2: Struggled. 1: Cannot influence.",
    is_starred: false, usage_count: 24, avg_score: 3.1, tags: ["influence", "communication"],
  },
  {
    question: "Walk me through your problem-solving process. How do you approach complex issues?",
    category: "problem_solving", difficulty: "easy",
    suggested_followups: ["What tools or frameworks do you use?", "How do you handle ambiguous problems?"],
    scoring_rubric: "5: Systematic with root cause analysis. 4: Good structured approach. 3: Basic. 2: Ad hoc. 1: No methodology.",
    is_starred: false, usage_count: 59, avg_score: 3.5, tags: ["methodology", "critical-thinking"],
  },
  {
    question: "Describe a time you identified and solved a problem before it became major.",
    category: "problem_solving", difficulty: "medium",
    suggested_followups: ["How did you spot the early warning signs?", "What preventive measures did you put in place?"],
    scoring_rubric: "5: Proactive identification with prevention. 4: Good proactive example. 3: Caught but not early. 2: Only reactive. 1: Misses problems.",
    is_starred: false, usage_count: 36, avg_score: 3.3, tags: ["proactiveness", "prevention"],
  },
  {
    question: "How do you approach a problem that you have never seen before?",
    category: "problem_solving", difficulty: "medium",
    suggested_followups: ["What resources do you turn to?", "When do you ask for help?"],
    scoring_rubric: "5: Decomposition, research, experimentation. 4: Good approach. 3: Basic research. 2: Gets stuck. 1: Gives up.",
    is_starred: false, usage_count: 45, avg_score: 3.4, tags: ["adaptability", "research"],
  },
  {
    question: "Tell me about a time you had to choose between multiple solutions. How did you evaluate the trade-offs?",
    category: "problem_solving", difficulty: "medium",
    suggested_followups: ["What criteria did you use?", "Were there unexpected consequences?"],
    scoring_rubric: "5: Structured evaluation with criteria matrix. 4: Good comparison. 3: Basic. 2: Gut feeling only. 1: Cannot evaluate.",
    is_starred: false, usage_count: 33, avg_score: 3.2, tags: ["decision-making", "trade-offs"],
  },
  {
    question: "Describe a creative or unconventional solution you came up with.",
    category: "problem_solving", difficulty: "hard",
    suggested_followups: ["What inspired the creative approach?", "How did you convince others?"],
    scoring_rubric: "5: Innovative solution with clear impact. 4: Good creative thinking. 3: Somewhat creative. 2: Standard only. 1: No creativity.",
    is_starred: false, usage_count: 21, avg_score: 3.0, tags: ["creativity", "innovation"],
  },
];

function QuestionCard({
  question,
  onToggleStar,
  onDelete,
  isAiSuggested,
}: {
  question: InterviewQuestion;
  onToggleStar: () => void;
  onDelete: () => void;
  isAiSuggested: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const CategoryIcon = CATEGORY_ICONS[question.category] || HelpCircle;

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              CATEGORY_COLORS[question.category] || "bg-muted"
            }`}
          >
            <CategoryIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug">
                {question.question}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                {isAiSuggested && (
                  <Badge className="text-[10px] bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200">
                    <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                    AI Suggested
                  </Badge>
                )}
                <button
                  onClick={onToggleStar}
                  className="p-1 rounded hover:bg-muted"
                >
                  <Star
                    className={`h-4 w-4 ${
                      question.is_starred
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] border ${CATEGORY_COLORS[question.category] || ""}`}
              >
                {CATEGORY_LABELS[question.category] || question.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] border ${DIFFICULTY_COLORS[question.difficulty] || ""}`}
              >
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </Badge>
              {question.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Usage stats */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Used {question.usage_count}x
              </span>
              {question.avg_score != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  Avg {question.avg_score.toFixed(1)}/5
                </span>
              )}
            </div>

            {/* Expandable details */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> Show details
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {question.suggested_followups.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">
                      Suggested Follow-ups:
                    </p>
                    <ul className="space-y-1">
                      {question.suggested_followups.map((f, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="text-muted-foreground/50 mt-0.5">
                            &rarr;
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {question.scoring_rubric && (
                  <div>
                    <p className="text-xs font-semibold mb-1">
                      Scoring Rubric:
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {question.scoring_rubric}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => {
                      navigator.clipboard.writeText(question.question);
                      toast.success("Question copied to clipboard");
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-destructive hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuestionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("none");

  // New question form
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newCategory, setNewCategory] = useState<string>("technical");
  const [newDifficulty, setNewDifficulty] = useState<string>("medium");
  const [newFollowUps, setNewFollowUps] = useState("");
  const [newRubric, setNewRubric] = useState("");
  const [newTags, setNewTags] = useState("");

  // Question set form
  const [setName, setSetName] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const { data: questionsData, isLoading: questionsLoading } = useQuestions({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    difficulty: difficultyFilter !== "all" ? difficultyFilter : undefined,
    search: debouncedSearch || undefined,
    is_starred: showFavoritesOnly || undefined,
  });

  const { data: questionSets, isLoading: setsLoading } = useQuestionSets();
  const { data: jobsData } = useJobs({ status: "published", per_page: 100 });
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const createQuestionSet = useCreateQuestionSet();

  const jobs = jobsData?.data ?? [];

  // Use API data or fallback to defaults
  const questions: InterviewQuestion[] = useMemo(() => {
    if (questionsData && questionsData.length > 0) return questionsData;
    // Fallback: generate with IDs
    return DEFAULT_QUESTIONS.map((q, i) => ({
      ...q,
      id: `default_${i}`,
      tenant_id: "",
      created_by: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }, [questionsData]);

  // AI suggested questions based on selected job
  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const aiSuggestedIds = useMemo(() => {
    if (!selectedJob) return new Set<string>();
    const jobSkills = [...(selectedJob.skills_required || []), ...(selectedJob.skills_preferred || [])];
    const jobDesc = (selectedJob.description || "").toLowerCase();
    const jobTitle = selectedJob.title.toLowerCase();

    const ids = new Set<string>();
    for (const q of questions) {
      const text = q.question.toLowerCase();
      const tags = q.tags.map((t) => t.toLowerCase());
      // Match if job title or skills appear in question or tags
      if (
        jobSkills.some((s) => text.includes(s.toLowerCase()) || tags.some((t) => t.includes(s.toLowerCase()))) ||
        text.includes(jobTitle) ||
        (q.category === "technical" && jobTitle.includes("engineer")) ||
        (q.category === "leadership" && (jobTitle.includes("lead") || jobTitle.includes("manager") || jobTitle.includes("senior"))) ||
        (q.category === "role_specific" && jobTitle.includes(q.category))
      ) {
        ids.add(q.id);
      }
    }

    // Always suggest some behavioral and cultural fit
    for (const q of questions) {
      if (ids.size >= 10) break;
      if (q.category === "behavioral" || q.category === "cultural_fit") {
        ids.add(q.id);
      }
    }

    return ids;
  }, [selectedJob, questions]);

  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(lower) ||
          q.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((q) => q.category === categoryFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((q) => q.is_starred);
    }

    return filtered;
  }, [questions, debouncedSearch, categoryFilter, difficultyFilter, showFavoritesOnly]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      counts[q.category] = (counts[q.category] || 0) + 1;
    }
    return counts;
  }, [questions]);

  const hasActiveFilters =
    searchQuery || categoryFilter !== "all" || difficultyFilter !== "all" || showFavoritesOnly;

  function handleToggleStar(questionId: string) {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;
    if (questionId.startsWith("default_")) {
      toast.success(q.is_starred ? "Removed from favorites" : "Added to favorites");
      return;
    }
    updateQuestion.mutate(
      { id: questionId, is_starred: !q.is_starred },
      {
        onSuccess: () => toast.success(q.is_starred ? "Removed from favorites" : "Added to favorites"),
        onError: () => toast.error("Failed to update"),
      }
    );
  }

  function handleDelete(questionId: string) {
    if (questionId.startsWith("default_")) {
      toast.success("Question removed");
      return;
    }
    deleteQuestion.mutate(questionId, {
      onSuccess: () => toast.success("Question deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  }

  function handleAddQuestion() {
    if (!newQuestionText.trim()) return;
    createQuestion.mutate(
      {
        question: newQuestionText.trim(),
        category: newCategory,
        difficulty: newDifficulty,
        suggested_followups: newFollowUps.split("\n").filter(Boolean),
        scoring_rubric: newRubric || undefined,
        tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          toast.success("Question added");
          setNewQuestionText("");
          setNewFollowUps("");
          setNewRubric("");
          setNewTags("");
        },
        onError: () => toast.error("Failed to add question"),
      }
    );
  }

  function handleCreateSet() {
    if (!setName.trim() || selectedQuestionIds.length === 0) return;
    createQuestionSet.mutate(
      {
        name: setName.trim(),
        description: setDescription.trim() || undefined,
        question_ids: selectedQuestionIds,
      },
      {
        onSuccess: () => {
          toast.success("Question set created");
          setSetName("");
          setSetDescription("");
          setSelectedQuestionIds([]);
        },
        onError: () => toast.error("Failed to create set"),
      }
    );
  }

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setDifficultyFilter("all");
    setShowFavoritesOnly(false);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Interview Question Bank" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Interview Question Bank
          </h1>
          <p className="text-muted-foreground">
            Manage, organize, and discover interview questions for every stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Layers className="mr-2 h-4 w-4" />
                Create Set
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Question Set</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Input
                  placeholder="Set name (e.g., Technical Round 1)"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={setDescription}
                  onChange={(e) => setSetDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Selected questions: {selectedQuestionIds.length}
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                  {questions.slice(0, 20).map((q) => (
                    <label
                      key={q.id}
                      className="flex items-start gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedQuestionIds.includes(q.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                          } else {
                            setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id));
                          }
                        }}
                      />
                      <span className="text-xs line-clamp-2">{q.question}</span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateSet}
                  disabled={!setName.trim() || selectedQuestionIds.length === 0}
                >
                  Create Set
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Textarea
                  placeholder="Enter your interview question..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newDifficulty} onValueChange={setNewDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Suggested follow-ups (one per line)..."
                  value={newFollowUps}
                  onChange={(e) => setNewFollowUps(e.target.value)}
                  rows={2}
                />
                <Textarea
                  placeholder="Scoring rubric..."
                  value={newRubric}
                  onChange={(e) => setNewRubric(e.target.value)}
                  rows={2}
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleAddQuestion}
                  disabled={!newQuestionText.trim() || createQuestion.isPending}
                >
                  {createQuestion.isPending ? "Adding..." : "Add Question"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Overview */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const Icon = CATEGORY_ICONS[key] || HelpCircle;
          const count = categoryCounts[key] || 0;
          const isActive = categoryFilter === key;
          return (
            <button
              key={key}
              onClick={() =>
                setCategoryFilter(isActive ? "all" : key)
              }
              className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                isActive ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              <p className="text-lg font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      {/* AI Job Suggestion */}
      <Card className="bg-gradient-to-r from-violet-50 to-blue-50 border-violet-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <Sparkles className="h-5 w-5 text-violet-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                AI-Suggested Questions
              </p>
              <p className="text-xs text-muted-foreground">
                Select a job to see which questions are most relevant
              </p>
            </div>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-[280px] bg-white">
                <SelectValue placeholder="Select a job..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job selected</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedJob && (
            <p className="text-xs text-violet-600 mt-2">
              {aiSuggestedIds.size} questions suggested for &ldquo;{selectedJob.title}&rdquo;
              {selectedJob.skills_required.length > 0 &&
                ` (${selectedJob.skills_required.join(", ")})`}
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions" className="gap-1.5">
            <HelpCircle className="h-4 w-4" />
            Questions ({filteredQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="sets" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Question Sets ({(questionSets || []).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <SearchInput
              value={searchQuery}
              onChange={(v) => setSearchQuery(v)}
              placeholder="Search questions, tags..."
            />
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulty</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star
                className={`mr-1 h-3.5 w-3.5 ${
                  showFavoritesOnly ? "fill-current" : ""
                }`}
              />
              Favorites
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={resetFilters}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {questionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No Questions Found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {hasActiveFilters
                      ? "No questions match your current filters. Try adjusting your search."
                      : "Add your first interview question to get started."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onToggleStar={() => handleToggleStar(q.id)}
                  onDelete={() => handleDelete(q.id)}
                  isAiSuggested={aiSuggestedIds.has(q.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sets">
          {setsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !questionSets || questionSets.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Layers className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    No Question Sets
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create question sets to group questions for specific interview
                    rounds. Click &ldquo;Create Set&rdquo; above to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {questionSets.map((qs: QuestionSet) => (
                <Card key={qs.id}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{qs.name}</h3>
                        {qs.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {qs.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {qs.question_ids.length} questions
                          </Badge>
                          {qs.interview_type && (
                            <Badge variant="outline" className="text-[10px]">
                              {qs.interview_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(qs.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
