import { useState, useCallback } from "react";

export interface ParsedWorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ParsedEducation {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface ParsedSkill {
  id: string;
  name: string;
  confidence: number; // 0-100
  category: string;
}

export interface ParsedCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ParsedLanguage {
  id: string;
  name: string;
  proficiency: string;
}

export interface ParsedResume {
  id: string;
  fileName: string;
  parsedAt: string;
  status: "parsing" | "completed" | "error";
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  workExperience: ParsedWorkExperience[];
  education: ParsedEducation[];
  skills: ParsedSkill[];
  certifications: ParsedCertification[];
  languages: ParsedLanguage[];
}

const SIMULATED_RESUMES: Omit<ParsedResume, "id" | "fileName" | "parsedAt" | "status">[] = [
  {
    contact: {
      name: "Sarah Chen",
      email: "sarah.chen@email.com",
      phone: "(415) 555-0123",
      location: "San Francisco, CA",
    },
    summary:
      "Full-stack engineer with 6+ years of experience building scalable web applications. Passionate about clean code, performance optimization, and mentoring junior developers.",
    workExperience: [
      {
        id: "w1",
        company: "TechCorp Inc.",
        title: "Senior Software Engineer",
        startDate: "2021-03",
        endDate: "Present",
        description:
          "Led a team of 5 engineers building a microservices architecture. Reduced API latency by 40% through caching strategies. Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes.",
      },
      {
        id: "w2",
        company: "StartupXYZ",
        title: "Software Engineer",
        startDate: "2018-06",
        endDate: "2021-02",
        description:
          "Built and maintained React-based dashboards serving 50K daily active users. Designed RESTful APIs using Node.js and PostgreSQL. Introduced automated testing increasing code coverage from 30% to 85%.",
      },
      {
        id: "w3",
        company: "WebAgency Co.",
        title: "Junior Developer",
        startDate: "2017-01",
        endDate: "2018-05",
        description:
          "Developed responsive websites and web applications for clients across various industries. Worked with HTML, CSS, JavaScript, and WordPress.",
      },
    ],
    education: [
      {
        id: "e1",
        school: "University of California, Berkeley",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2013-08",
        endDate: "2017-05",
      },
    ],
    skills: [
      { id: "s1", name: "React", confidence: 95, category: "Frontend" },
      { id: "s2", name: "TypeScript", confidence: 92, category: "Languages" },
      { id: "s3", name: "Node.js", confidence: 90, category: "Backend" },
      { id: "s4", name: "PostgreSQL", confidence: 85, category: "Database" },
      { id: "s5", name: "AWS", confidence: 82, category: "Cloud" },
      { id: "s6", name: "Docker", confidence: 80, category: "DevOps" },
      { id: "s7", name: "GraphQL", confidence: 78, category: "API" },
      { id: "s8", name: "Python", confidence: 75, category: "Languages" },
      { id: "s9", name: "CI/CD", confidence: 72, category: "DevOps" },
      { id: "s10", name: "Agile/Scrum", confidence: 88, category: "Methodology" },
    ],
    certifications: [
      { id: "c1", name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", date: "2022-06" },
      { id: "c2", name: "Professional Scrum Master I", issuer: "Scrum.org", date: "2021-03" },
    ],
    languages: [
      { id: "l1", name: "English", proficiency: "Native" },
      { id: "l2", name: "Mandarin", proficiency: "Fluent" },
    ],
  },
  {
    contact: {
      name: "Marcus Johnson",
      email: "marcus.j@email.com",
      phone: "(212) 555-0456",
      location: "New York, NY",
    },
    summary:
      "Data scientist and machine learning engineer with expertise in NLP and computer vision. Published researcher with a track record of deploying ML models at scale.",
    workExperience: [
      {
        id: "w1",
        company: "DataInsight Corp",
        title: "Senior Data Scientist",
        startDate: "2020-09",
        endDate: "Present",
        description:
          "Developed recommendation engine serving 10M+ users, increasing engagement by 25%. Built NLP pipelines for automated document classification with 94% accuracy.",
      },
      {
        id: "w2",
        company: "AI Solutions Ltd",
        title: "Machine Learning Engineer",
        startDate: "2018-01",
        endDate: "2020-08",
        description:
          "Designed and deployed computer vision models for quality inspection. Optimized model inference time by 60% using TensorRT. Managed data pipelines processing 500GB daily.",
      },
    ],
    education: [
      {
        id: "e1",
        school: "Massachusetts Institute of Technology",
        degree: "Master of Science",
        field: "Computer Science (AI Specialization)",
        startDate: "2016-09",
        endDate: "2018-06",
      },
      {
        id: "e2",
        school: "Columbia University",
        degree: "Bachelor of Science",
        field: "Applied Mathematics",
        startDate: "2012-09",
        endDate: "2016-05",
      },
    ],
    skills: [
      { id: "s1", name: "Python", confidence: 97, category: "Languages" },
      { id: "s2", name: "TensorFlow", confidence: 93, category: "ML" },
      { id: "s3", name: "PyTorch", confidence: 91, category: "ML" },
      { id: "s4", name: "SQL", confidence: 88, category: "Database" },
      { id: "s5", name: "NLP", confidence: 90, category: "ML" },
      { id: "s6", name: "Computer Vision", confidence: 85, category: "ML" },
      { id: "s7", name: "Spark", confidence: 80, category: "Data" },
      { id: "s8", name: "Docker", confidence: 76, category: "DevOps" },
      { id: "s9", name: "Kubernetes", confidence: 70, category: "DevOps" },
    ],
    certifications: [
      { id: "c1", name: "Google Professional Machine Learning Engineer", issuer: "Google Cloud", date: "2023-01" },
    ],
    languages: [
      { id: "l1", name: "English", proficiency: "Native" },
      { id: "l2", name: "Spanish", proficiency: "Intermediate" },
    ],
  },
  {
    contact: {
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "(512) 555-0789",
      location: "Austin, TX",
    },
    summary:
      "Product designer with 5 years of experience creating user-centered digital experiences. Strong background in design systems, accessibility, and cross-functional collaboration.",
    workExperience: [
      {
        id: "w1",
        company: "DesignHub",
        title: "Senior Product Designer",
        startDate: "2022-01",
        endDate: "Present",
        description:
          "Led redesign of core product, increasing user satisfaction scores by 35%. Established design system used across 3 product teams. Conducted user research studies with 200+ participants.",
      },
      {
        id: "w2",
        company: "CreativeApps",
        title: "UX Designer",
        startDate: "2019-06",
        endDate: "2021-12",
        description:
          "Designed mobile and web interfaces for B2B SaaS products. Created interactive prototypes and conducted usability testing. Collaborated with engineering teams on implementation.",
      },
    ],
    education: [
      {
        id: "e1",
        school: "Rhode Island School of Design",
        degree: "Bachelor of Fine Arts",
        field: "Graphic Design",
        startDate: "2015-09",
        endDate: "2019-05",
      },
    ],
    skills: [
      { id: "s1", name: "Figma", confidence: 96, category: "Design" },
      { id: "s2", name: "UI/UX Design", confidence: 94, category: "Design" },
      { id: "s3", name: "Design Systems", confidence: 90, category: "Design" },
      { id: "s4", name: "User Research", confidence: 88, category: "Research" },
      { id: "s5", name: "Prototyping", confidence: 92, category: "Design" },
      { id: "s6", name: "Accessibility", confidence: 85, category: "Design" },
      { id: "s7", name: "HTML/CSS", confidence: 78, category: "Frontend" },
      { id: "s8", name: "Sketch", confidence: 82, category: "Design" },
    ],
    certifications: [
      { id: "c1", name: "Google UX Design Certificate", issuer: "Google", date: "2021-09" },
    ],
    languages: [
      { id: "l1", name: "English", proficiency: "Native" },
      { id: "l2", name: "Portuguese", proficiency: "Conversational" },
    ],
  },
];

let resumeCounter = 0;

function generateId(): string {
  return `resume_${Date.now()}_${++resumeCounter}`;
}

function getRandomTemplate(): Omit<ParsedResume, "id" | "fileName" | "parsedAt" | "status"> {
  return SIMULATED_RESUMES[Math.floor(Math.random() * SIMULATED_RESUMES.length)];
}

export function useResumeParser() {
  const [parsedResumes, setParsedResumes] = useState<ParsedResume[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const parseResume = useCallback(
    (fileName: string): Promise<ParsedResume> => {
      return new Promise((resolve) => {
        const id = generateId();
        const template = getRandomTemplate();

        // Add placeholder in "parsing" state
        const placeholder: ParsedResume = {
          id,
          fileName,
          parsedAt: new Date().toISOString(),
          status: "parsing",
          contact: { name: "", email: "", phone: "", location: "" },
          summary: "",
          workExperience: [],
          education: [],
          skills: [],
          certifications: [],
          languages: [],
        };

        setParsedResumes((prev) => [placeholder, ...prev]);

        // Simulate parsing delay
        setTimeout(() => {
          const completed: ParsedResume = {
            ...template,
            id,
            fileName,
            parsedAt: new Date().toISOString(),
            status: "completed",
          };
          setParsedResumes((prev) =>
            prev.map((r) => (r.id === id ? completed : r))
          );
          resolve(completed);
        }, 2000 + Math.random() * 2000);
      });
    },
    []
  );

  const parseMultipleResumes = useCallback(
    async (fileNames: string[]): Promise<ParsedResume[]> => {
      setIsUploading(true);
      const results: ParsedResume[] = [];
      for (const fileName of fileNames) {
        const result = await parseResume(fileName);
        results.push(result);
      }
      setIsUploading(false);
      return results;
    },
    [parseResume]
  );

  const updateField = useCallback(
    (resumeId: string, path: string, value: string) => {
      setParsedResumes((prev) =>
        prev.map((resume) => {
          if (resume.id !== resumeId) return resume;
          const updated = { ...resume };
          const keys = path.split(".");
          let obj: Record<string, unknown> = updated as unknown as Record<string, unknown>;
          for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const idx = parseInt(key, 10);
            if (!isNaN(idx) && Array.isArray(obj)) {
              obj = { ...(obj[idx] as Record<string, unknown>) };
            } else {
              obj = { ...(obj[key] as Record<string, unknown>) };
            }
          }
          obj[keys[keys.length - 1]] = value;
          return updated;
        })
      );
    },
    []
  );

  const updateContactField = useCallback(
    (resumeId: string, field: keyof ParsedResume["contact"], value: string) => {
      setParsedResumes((prev) =>
        prev.map((resume) => {
          if (resume.id !== resumeId) return resume;
          return {
            ...resume,
            contact: { ...resume.contact, [field]: value },
          };
        })
      );
    },
    []
  );

  const updateSummary = useCallback(
    (resumeId: string, value: string) => {
      setParsedResumes((prev) =>
        prev.map((resume) => {
          if (resume.id !== resumeId) return resume;
          return { ...resume, summary: value };
        })
      );
    },
    []
  );

  const updateWorkExperience = useCallback(
    (resumeId: string, expId: string, field: keyof ParsedWorkExperience, value: string) => {
      setParsedResumes((prev) =>
        prev.map((resume) => {
          if (resume.id !== resumeId) return resume;
          return {
            ...resume,
            workExperience: resume.workExperience.map((exp) =>
              exp.id === expId ? { ...exp, [field]: value } : exp
            ),
          };
        })
      );
    },
    []
  );

  const updateEducation = useCallback(
    (resumeId: string, eduId: string, field: keyof ParsedEducation, value: string) => {
      setParsedResumes((prev) =>
        prev.map((resume) => {
          if (resume.id !== resumeId) return resume;
          return {
            ...resume,
            education: resume.education.map((edu) =>
              edu.id === eduId ? { ...edu, [field]: value } : edu
            ),
          };
        })
      );
    },
    []
  );

  const removeResume = useCallback((resumeId: string) => {
    setParsedResumes((prev) => prev.filter((r) => r.id !== resumeId));
  }, []);

  return {
    parsedResumes,
    isUploading,
    parseResume,
    parseMultipleResumes,
    updateContactField,
    updateSummary,
    updateWorkExperience,
    updateEducation,
    updateField,
    removeResume,
  };
}
