"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  Star,
  StarOff,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  ChevronDown,
  RotateCcw,
  Save,
  Users,
  Sparkles,
  Mail,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Candidate {
  id: string;
  name: string;
  email: string;
  title: string;
  location: string;
  experience: number;
  skills: string[];
  education: string;
  source: string;
  matchScore: number;
  status: string;
  lastActive: string;
  starred: boolean;
}

const CANDIDATES: Candidate[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@email.com", title: "Senior Software Engineer", location: "San Francisco, CA", experience: 6, skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"], education: "UC Berkeley - CS", source: "LinkedIn", matchScore: 95, status: "Active", lastActive: "2 hours ago", starred: true },
  { id: "2", name: "Marcus Johnson", email: "marcus@email.com", title: "Data Scientist", location: "New York, NY", experience: 5, skills: ["Python", "TensorFlow", "SQL", "Spark", "NLP"], education: "MIT - CS (MS)", source: "Referral", matchScore: 92, status: "Active", lastActive: "1 day ago", starred: false },
  { id: "3", name: "Emily Rodriguez", email: "emily@email.com", title: "Product Designer", location: "Austin, TX", experience: 4, skills: ["Figma", "UI/UX", "Design Systems", "User Research", "Prototyping"], education: "RISD - BFA", source: "Career Page", matchScore: 88, status: "Active", lastActive: "3 hours ago", starred: true },
  { id: "4", name: "James Park", email: "james@email.com", title: "DevOps Engineer", location: "Seattle, WA", experience: 7, skills: ["Kubernetes", "Docker", "Terraform", "CI/CD", "AWS", "GCP"], education: "U of Washington - CS", source: "Indeed", matchScore: 91, status: "Active", lastActive: "5 hours ago", starred: false },
  { id: "5", name: "Lisa Wang", email: "lisa@email.com", title: "Frontend Engineer", location: "Remote", experience: 3, skills: ["React", "Vue", "TypeScript", "CSS", "Testing"], education: "Stanford - CS", source: "LinkedIn", matchScore: 85, status: "Passive", lastActive: "1 week ago", starred: false },
  { id: "6", name: "David Kim", email: "david@email.com", title: "Full Stack Developer", location: "Chicago, IL", experience: 5, skills: ["React", "Python", "Django", "PostgreSQL", "Redis"], education: "Northwestern - CS", source: "GitHub", matchScore: 87, status: "Active", lastActive: "12 hours ago", starred: false },
  { id: "7", name: "Anna Thompson", email: "anna@email.com", title: "Engineering Manager", location: "Boston, MA", experience: 10, skills: ["Leadership", "System Design", "Agile", "Java", "Microservices"], education: "Harvard - MBA", source: "Executive Search", matchScore: 93, status: "Active", lastActive: "6 hours ago", starred: true },
  { id: "8", name: "Michael Brown", email: "michael@email.com", title: "Backend Engineer", location: "Denver, CO", experience: 4, skills: ["Go", "Rust", "PostgreSQL", "gRPC", "Docker"], education: "Colorado State - CS", source: "AngelList", matchScore: 84, status: "Passive", lastActive: "2 weeks ago", starred: false },
  { id: "9", name: "Sophia Martinez", email: "sophia@email.com", title: "QA Lead", location: "Portland, OR", experience: 6, skills: ["Selenium", "Cypress", "Jest", "CI/CD", "API Testing"], education: "Oregon State - SE", source: "Referral", matchScore: 79, status: "Active", lastActive: "4 hours ago", starred: false },
  { id: "10", name: "Ryan Lee", email: "ryan@email.com", title: "ML Engineer", location: "San Jose, CA", experience: 5, skills: ["PyTorch", "Python", "MLOps", "Kubernetes", "CV"], education: "CMU - ML (MS)", source: "LinkedIn", matchScore: 90, status: "Active", lastActive: "1 day ago", starred: false },
];

const SAVED_SEARCHES = [
  { id: "1", name: "Senior React Engineers - SF", query: "React AND TypeScript AND senior", filters: "Location: San Francisco, Experience: 5+" },
  { id: "2", name: "Data Scientists with NLP", query: "Python AND (NLP OR TensorFlow)", filters: "Experience: 3+" },
  { id: "3", name: "Remote Frontend Devs", query: "React OR Vue", filters: "Location: Remote" },
];

export default function AdvancedSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [candidates, setCandidates] = useState(CANDIDATES);
  const [showFilters, setShowFilters] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState("");

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    CANDIDATES.forEach(c => c.skills.forEach(s => skills.add(s)));
    return Array.from(skills).sort();
  }, []);

  // Boolean search parser (supports AND, OR, NOT)
  function matchesBooleanSearch(candidate: Candidate, query: string): boolean {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    const searchableText = `${candidate.name} ${candidate.title} ${candidate.skills.join(" ")} ${candidate.education} ${candidate.location}`.toLowerCase();

    // Simple boolean: split by AND/OR
    if (lower.includes(" and ")) {
      return lower.split(" and ").every(term => {
        const t = term.trim().replace(/^not\s+/, "");
        const negate = term.trim().startsWith("not ");
        const matches = searchableText.includes(t);
        return negate ? !matches : matches;
      });
    }
    if (lower.includes(" or ")) {
      return lower.split(" or ").some(term => searchableText.includes(term.trim()));
    }
    return searchableText.includes(lower);
  }

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (!matchesBooleanSearch(c, searchQuery)) return false;
      if (locationFilter !== "all" && !c.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (experienceFilter !== "all") {
        const min = parseInt(experienceFilter);
        if (c.experience < min) return false;
      }
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (skillFilter && !c.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
      return true;
    });
  }, [candidates, searchQuery, locationFilter, experienceFilter, statusFilter, sourceFilter, skillFilter]);

  const hasFilters = searchQuery || locationFilter !== "all" || experienceFilter !== "all" || statusFilter !== "all" || sourceFilter !== "all" || skillFilter;

  function resetFilters() {
    setSearchQuery("");
    setLocationFilter("all");
    setExperienceFilter("all");
    setStatusFilter("all");
    setSourceFilter("all");
    setSkillFilter("");
  }

  function toggleStar(id: string) {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Talent Search</h1>
          <p className="text-muted-foreground">
            Search across your entire talent database with boolean operators
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)} disabled={!searchQuery}>
            <Save className="mr-1.5 h-4 w-4" />
            Save Search
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10 h-12 text-base"
                placeholder='Boolean search: "React AND TypeScript" or "Python OR Java NOT junior"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12"
            >
              <Filter className="mr-1.5 h-4 w-4" />
              Filters
              {hasFilters && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]" variant="destructive">!</Badge>}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-5">
                  <div>
                    <Label className="text-xs">Location</Label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Location</SelectItem>
                        <SelectItem value="san francisco">San Francisco</SelectItem>
                        <SelectItem value="new york">New York</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="seattle">Seattle</SelectItem>
                        <SelectItem value="austin">Austin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Experience</Label>
                    <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Level</SelectItem>
                        <SelectItem value="1">1+ years</SelectItem>
                        <SelectItem value="3">3+ years</SelectItem>
                        <SelectItem value="5">5+ years</SelectItem>
                        <SelectItem value="8">8+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Passive">Passive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Source</Label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Source</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Career Page">Career Page</SelectItem>
                        <SelectItem value="Indeed">Indeed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Skill</Label>
                    <Input
                      className="mt-1"
                      placeholder="e.g., React"
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                    />
                  </div>
                </div>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-2">
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Clear all filters
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <strong>{filtered.length}</strong> candidates found
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Supports: AND, OR, NOT operators</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Results ({filtered.length})</TabsTrigger>
          <TabsTrigger value="saved">Saved Searches ({SAVED_SEARCHES.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-3">
          {filtered.map((candidate, idx) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                      {candidate.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{candidate.name}</h3>
                        <Badge variant={candidate.matchScore >= 90 ? "default" : "secondary"} className="text-xs">
                          <Sparkles className="mr-0.5 h-3 w-3" />
                          {candidate.matchScore}% match
                        </Badge>
                        <Badge variant="outline" className="text-xs">{candidate.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{candidate.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.location}</span>
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{candidate.experience} years</span>
                        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{candidate.education}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{candidate.lastActive}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {candidate.skills.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs font-normal">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleStar(candidate.id)}
                      >
                        {candidate.starred ? (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Badge variant="outline" className="text-xs">{candidate.source}</Badge>
                      <Button variant="outline" size="sm">
                        <Mail className="mr-1 h-3 w-3" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="saved" className="space-y-3">
          {SAVED_SEARCHES.map((search) => (
            <Card key={search.id}>
              <CardContent className="pt-5 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{search.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 font-mono">{search.query}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{search.filters}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery(search.query)}>
                    <Search className="mr-1 h-3 w-3" />
                    Run
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>Save this search to run it again later.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Search Name</Label>
            <Input
              className="mt-1"
              placeholder="e.g., Senior React Engineers - SF"
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
            />
            <p className="mt-2 text-xs text-muted-foreground font-mono">Query: {searchQuery}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { setSaveDialogOpen(false); toast.success("Search saved"); }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
