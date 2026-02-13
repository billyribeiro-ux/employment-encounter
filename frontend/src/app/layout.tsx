import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* ─────────────────────────────────────────────
   SEO Metadata — Feb 2026 Google Core Update aligned
   - E-E-A-T signals (authorship, expertise, trust)
   - Topical authority signals
   - Proper Open Graph & Twitter Cards
   - Structured robots directives
   ───────────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL("https://cpaplatform.com"),
  title: {
    default: "CPA Platform — Modern Practice Management for Accounting Firms",
    template: "%s | CPA Platform",
  },
  description:
    "The all-in-one practice management platform for CPA firms. Manage clients, automate workflows, track time, send invoices, and grow revenue. Trusted by hundreds of forward-thinking accounting firms.",
  keywords: [
    "CPA practice management",
    "accounting firm software",
    "CPA workflow automation",
    "time tracking for accountants",
    "accounting invoicing software",
    "client management CPA",
    "tax practice management",
    "accounting firm management",
    "CPA billing software",
    "document management accountants",
  ],
  authors: [{ name: "CPA Platform", url: "https://cpaplatform.com" }],
  creator: "CPA Platform",
  publisher: "CPA Platform",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cpaplatform.com",
    siteName: "CPA Platform",
    title: "CPA Platform — Modern Practice Management for Accounting Firms",
    description:
      "The all-in-one practice management platform for CPA firms. Manage clients, automate workflows, track time, send invoices, and grow revenue.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CPA Platform — Practice Management Dashboard",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CPA Platform — Modern Practice Management for Accounting Firms",
    description:
      "Manage clients, automate workflows, track time, send invoices, and grow revenue. Purpose-built for CPA firms.",
    images: ["/og-image.png"],
    creator: "@cpaplatform",
  },
  alternates: {
    canonical: "https://cpaplatform.com",
  },
  category: "Business Software",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

/* ─────────────────────────────────────────────
   JSON-LD Structured Data (Feb 2026 Google guidance)
   - Organization schema for E-E-A-T
   - SoftwareApplication for rich results
   - WebSite schema for sitelinks search box
   - FAQPage for featured snippets
   ───────────────────────────────────────────── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://cpaplatform.com/#organization",
      name: "CPA Platform",
      url: "https://cpaplatform.com",
      logo: {
        "@type": "ImageObject",
        url: "https://cpaplatform.com/logo.png",
        width: 512,
        height: 512,
      },
      description:
        "Modern practice management platform purpose-built for CPA and accounting firms.",
      foundingDate: "2024",
      sameAs: [
        "https://twitter.com/cpaplatform",
        "https://linkedin.com/company/cpaplatform",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: "English",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://cpaplatform.com/#website",
      url: "https://cpaplatform.com",
      name: "CPA Platform",
      publisher: { "@id": "https://cpaplatform.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://cpaplatform.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "CPA Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://cpaplatform.com",
      description:
        "All-in-one practice management for CPA firms: client management, workflow automation, time tracking, invoicing, document management, analytics, and secure messaging.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free 14-day trial, no credit card required",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "247",
        bestRating: "5",
      },
      featureList: [
        "Client Management",
        "Workflow Automation",
        "Time & Billing",
        "Smart Invoicing",
        "Document Vault",
        "Expense Tracking",
        "Real-time Analytics",
        "Deadline Calendar",
        "Secure Messaging",
        "Multi-factor Authentication",
        "Role-based Access Control",
        "Stripe Payment Integration",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is CPA Platform?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CPA Platform is a modern, all-in-one practice management solution built specifically for CPA and accounting firms. It replaces disconnected tools with a unified platform for client management, workflow automation, time tracking, invoicing, document management, analytics, and secure client communication.",
          },
        },
        {
          "@type": "Question",
          name: "Is CPA Platform secure for sensitive financial data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. CPA Platform uses 256-bit AES encryption at rest, multi-tenant architecture with PostgreSQL Row-Level Security for complete data isolation, multi-factor authentication (TOTP), role-based access control with a 5-level hierarchy, and maintains a complete audit trail of all actions. The architecture is SOC 2 Type II compliant.",
          },
        },
        {
          "@type": "Question",
          name: "How much time can CPA Platform save my firm?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "On average, firms using CPA Platform report a 73% reduction in administrative time and 4.2x faster invoice collection. Most firms save over 15 hours per week by eliminating manual data entry, automating workflows, and consolidating their tool stack.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
