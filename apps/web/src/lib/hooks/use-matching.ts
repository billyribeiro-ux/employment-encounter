import { useMemo } from "react";
import { useCandidates, type CandidateProfile, type CandidateSkill } from "./use-candidates";
import { useJobs, useJob, type JobPost } from "./use-jobs";

export interface MatchResult {
  candidateId: string;
  candidate: CandidateProfile;
  skills: CandidateSkill[];
  overall: number;
  skillsScore: number;
  experienceScore: number;
  locationScore: number;
  salaryScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}

const EXPERIENCE_LEVELS = ["internship", "entry", "junior", "mid", "senior", "lead", "principal", "executive"];

function getExperienceIndex(level: string | null): number {
  if (!level) return -1;
  return EXPERIENCE_LEVELS.indexOf(level.toLowerCase());
}

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/[.\-_]/g, "").replace(/\s+/g, " ");
}

function skillsMatch(candidateSkill: string, jobSkill: string): boolean {
  const a = normalizeSkill(candidateSkill);
  const b = normalizeSkill(jobSkill);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

export function calculateMatchScore(
  candidate: CandidateProfile,
  candidateSkills: string[],
  job: JobPost
): MatchResult {
  let skillScore = 0;
  let locationScore = 0;
  let salaryScore = 0;
  let experienceScore = 0;
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  // Skills match: compare candidate skills vs job required + preferred skills
  const allJobSkills = [...(job.skills_required || []), ...(job.skills_preferred || [])];
  const requiredSkills = job.skills_required || [];

  if (allJobSkills.length > 0) {
    let matchedCount = 0;
    for (const jobSkill of allJobSkills) {
      const found = candidateSkills.some((cs) => skillsMatch(cs, jobSkill));
      if (found) {
        matchedCount++;
        matchingSkills.push(jobSkill);
      } else {
        missingSkills.push(jobSkill);
      }
    }
    skillScore = Math.round((matchedCount / allJobSkills.length) * 100);
  } else {
    skillScore = candidateSkills.length > 0 ? 70 : 50;
  }

  // Location match
  if (job.remote_policy === "remote" || candidate.remote_preference === "remote") {
    locationScore = 80;
  }
  if (
    candidate.location_city &&
    job.location_city &&
    candidate.location_city.toLowerCase() === job.location_city.toLowerCase() &&
    candidate.location_state &&
    job.location_state &&
    candidate.location_state.toLowerCase() === job.location_state.toLowerCase()
  ) {
    locationScore = 100;
  } else if (
    candidate.location_state &&
    job.location_state &&
    candidate.location_state.toLowerCase() === job.location_state.toLowerCase()
  ) {
    locationScore = Math.max(locationScore, 70);
  } else if (
    candidate.location_country &&
    job.location_country &&
    candidate.location_country.toLowerCase() === job.location_country.toLowerCase()
  ) {
    locationScore = Math.max(locationScore, 40);
  }
  if (job.remote_policy === "remote" && candidate.remote_preference === "remote") {
    locationScore = 100;
  }
  if (!candidate.location_city && !candidate.location_state) {
    locationScore = Math.max(locationScore, 50);
  }

  // Salary match
  const candMin = candidate.desired_salary_min_cents;
  const candMax = candidate.desired_salary_max_cents;
  const jobMin = job.salary_min_cents;
  const jobMax = job.salary_max_cents;

  if (candMin && candMax && jobMin && jobMax) {
    const overlapStart = Math.max(candMin, jobMin);
    const overlapEnd = Math.min(candMax, jobMax);
    if (overlapStart <= overlapEnd) {
      const overlapRange = overlapEnd - overlapStart;
      const candidateRange = candMax - candMin || 1;
      salaryScore = Math.min(Math.round((overlapRange / candidateRange) * 100), 100);
    } else {
      const gap = overlapStart - overlapEnd;
      const avgRange = ((candMax - candMin) + (jobMax - jobMin)) / 2 || 1;
      salaryScore = Math.max(0, Math.round((1 - gap / avgRange) * 50));
    }
  } else if (candMin && jobMax) {
    salaryScore = candMin <= jobMax ? 80 : 20;
  } else if (candMax && jobMin) {
    salaryScore = candMax >= jobMin ? 80 : 20;
  } else {
    salaryScore = 50;
  }

  // Experience match
  const candLevel = getExperienceIndex(candidate.availability_status === "available" ? "mid" : "mid");
  const jobLevel = getExperienceIndex(job.experience_level);

  if (jobLevel >= 0) {
    // Try to infer candidate level from skills count and reputation
    let inferredLevel = 3; // default mid
    if (candidate.reputation_score >= 80) inferredLevel = 5;
    else if (candidate.reputation_score >= 60) inferredLevel = 4;
    else if (candidate.reputation_score >= 40) inferredLevel = 3;
    else if (candidate.reputation_score >= 20) inferredLevel = 2;
    else inferredLevel = 1;

    if (candidateSkills.length >= 10) inferredLevel = Math.min(inferredLevel + 1, 7);

    const diff = Math.abs(inferredLevel - jobLevel);
    if (diff === 0) experienceScore = 100;
    else if (diff === 1) experienceScore = 70;
    else if (diff === 2) experienceScore = 40;
    else experienceScore = 20;
  } else {
    experienceScore = 60;
  }

  const overall = Math.round(
    skillScore * 0.4 +
    experienceScore * 0.25 +
    locationScore * 0.2 +
    salaryScore * 0.15
  );

  return {
    candidateId: candidate.id,
    candidate,
    skills: [],
    overall,
    skillsScore: skillScore,
    experienceScore: experienceScore,
    locationScore: locationScore,
    salaryScore: salaryScore,
    matchingSkills,
    missingSkills,
  };
}

export interface UseMatchingOptions {
  jobId: string;
  minScore?: number;
  skillsRequired?: string[];
  location?: string;
  availability?: string;
  sortBy?: "match" | "experience" | "recency";
}

export function useMatching(options: UseMatchingOptions) {
  const { jobId, minScore = 0, skillsRequired, location, availability, sortBy = "match" } = options;

  const { data: jobData, isLoading: jobLoading } = useJob(jobId);
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ per_page: 100, status: "published" });
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({
    per_page: 200,
    availability_status: availability && availability !== "all" ? availability : undefined,
  });

  const isLoading = jobLoading || candidatesLoading || jobsLoading;

  const jobs = jobsData?.data ?? [];
  const candidates = candidatesData?.data ?? [];
  const job = jobData;

  const results = useMemo(() => {
    if (!job || candidates.length === 0) return [];

    let matches: MatchResult[] = candidates.map((candidate) => {
      // Derive skill names from headline and summary keywords as fallback
      const candidateSkillNames = extractSkillKeywords(candidate);
      return calculateMatchScore(candidate, candidateSkillNames, job);
    });

    // Apply minimum score filter
    if (minScore > 0) {
      matches = matches.filter((m) => m.overall >= minScore);
    }

    // Apply skills filter
    if (skillsRequired && skillsRequired.length > 0) {
      matches = matches.filter((m) =>
        skillsRequired.every((req) =>
          m.matchingSkills.some((ms) => skillsMatch(ms, req))
        )
      );
    }

    // Apply location filter
    if (location && location !== "all") {
      matches = matches.filter((m) => {
        const candLoc = [m.candidate.location_city, m.candidate.location_state]
          .filter(Boolean)
          .join(", ")
          .toLowerCase();
        return candLoc.includes(location.toLowerCase());
      });
    }

    // Sort
    switch (sortBy) {
      case "match":
        matches.sort((a, b) => b.overall - a.overall);
        break;
      case "experience":
        matches.sort((a, b) => b.experienceScore - a.experienceScore);
        break;
      case "recency":
        matches.sort(
          (a, b) =>
            new Date(b.candidate.created_at).getTime() -
            new Date(a.candidate.created_at).getTime()
        );
        break;
    }

    return matches;
  }, [job, candidates, minScore, skillsRequired, location, sortBy]);

  return {
    results,
    job,
    jobs,
    isLoading,
  };
}

function extractSkillKeywords(candidate: CandidateProfile): string[] {
  const text = [candidate.headline, candidate.summary].filter(Boolean).join(" ");
  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Python",
    "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "GraphQL",
    "REST", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
    "Git", "Linux", "Agile", "Scrum", "Machine Learning", "AI",
    "Data Science", "DevOps", "CSS", "HTML", "Sass", "Tailwind",
    "Next.js", "Express", "Django", "Flask", "Spring", "Rails",
    "TensorFlow", "PyTorch", "Figma", "Sketch", "UI/UX", "Product Management",
    "Project Management", "Leadership", "Communication", "Teamwork",
    "Problem Solving", "Critical Thinking", "Analytical", "Marketing",
    "Sales", "Finance", "Accounting", "HR", "Recruiting",
  ];

  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const skill of commonSkills) {
    if (lower.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }
  return found;
}
