'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { BrandLogo } from '@/components/shared/BrandLogo'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleGauge,
  Inbox,
  MailCheck,
  MailPlus,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  Sliders,
  Layers,
  Users,
  Building2,
  Briefcase,
  Rocket,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  History,
  Lock,
  XCircle,
  Star,
  Globe
} from 'lucide-react'

export default function LandingPage() {
  const { status } = useSession()

  const [activeHeroTab, setActiveHeroTab] = useState<'campaigns' | 'mailboxes' | 'warmup' | 'replies'>('campaigns')
  const [activeStepTab, setActiveStepTab] = useState<number>(1)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const stepDetails = [
    {
      step: 1,
      tag: 'STEP 01 — SENDER SETUP',
      title: 'Plug in your mailboxes with automated SPF & DKIM health checks',
      description: 'Connect Google Workspace, Microsoft 365, or SMTP inboxes in under 2 minutes. Outreach OS runs live DNS diagnostics before a single email leaves your account.',
      bulletList: [
        'Automatic SPF, DKIM, & DMARC validation',
        'Provider health scoring & bounce guardrails',
        'Built-in gradual warmup ramp (0 to 40 mails/day)'
      ],
      mockupData: {
        title: 'Mailbox Health Diagnostic',
        status: '8 Senders Active • 100% Validated',
        badge: 'DNS Verified',
        items: [
          { name: 'alex@acmegrowth.com (Google)', score: '99% Health', status: 'Warmed', spf: 'Pass', dkim: 'Pass' },
          { name: 'sarah@acmegrowth.com (Outlook)', score: '98% Health', status: 'Warmed', spf: 'Pass', dkim: 'Pass' },
          { name: 'outreach@acmegrowth.io (Zoho)', score: '95% Health', status: 'Ramping', spf: 'Pass', dkim: 'Pass' }
        ]
      }
    },
    {
      step: 2,
      tag: 'STEP 02 — LEAD IMPORT',
      title: 'Upload your CSV & auto-map lead fields in seconds',
      description: 'Drag and drop lead files with zero data formatting headaches. Our column detector auto-matches Email, First Name, Company, and Custom Variables with instant syntax validation.',
      bulletList: [
        'Instant duplicate removal & syntax cleaning',
        'Custom variable mapping ({firstName}, {company})',
        'Invalid email filtering before queueing'
      ],
      mockupData: {
        title: 'CSV Lead Import & Auto-Mapping',
        status: '1,420 Validated Leads • 0 Duplicates',
        badge: '100% Mapped',
        items: [
          { name: 'John Doe', email: 'john@stripe.com', company: 'Stripe', status: 'Valid' },
          { name: 'Elena Rostova', email: 'elena@figma.com', company: 'Figma', status: 'Valid' },
          { name: 'Marcus Chen', email: 'marcus@linear.app', company: 'Linear', status: 'Valid' }
        ]
      }
    },
    {
      step: 3,
      tag: 'STEP 03 — SEQUENCE BUILDER',
      title: 'Design multi-touch campaigns with intelligent stop-on-reply',
      description: 'Write personalized sequence steps with dynamic variables, weekend delays, and automatic rotation across your connected sender pool.',
      bulletList: [
        'Multi-step follow-ups with customizable day delays',
        'Automatic rotation across all active mailboxes',
        'Instant pause when a lead replies or books'
      ],
      mockupData: {
        title: 'Q3 Enterprise Outbound Sequence',
        status: 'Step 2 of 4 Active • Stop-on-reply enabled',
        badge: 'Sending',
        items: [
          { name: 'Step 1: Quick question regarding {company}', delay: 'Immediate', stat: '64% Open • 12% Reply' },
          { name: 'Step 2: Thoughts on scaling outbound without tool sprawl?', delay: '3 days after Step 1', stat: '48% Open • 8% Reply' },
          { name: 'Step 3: Final follow-up for {firstName}', delay: '5 days after Step 2', stat: 'Scheduled' }
        ]
      }
    },
    {
      step: 4,
      tag: 'STEP 04 — UNIFIED INBOX',
      title: 'Manage interested prospects & book meetings from one inbox',
      description: 'Never lose a deal in a secondary inbox. All incoming replies land in a unified stream tagged with sentiment detection and direct meeting scheduling.',
      bulletList: [
        'Centralized thread view across all senders',
        'Automatic positive reply & objection tagging',
        '1-click calendar link insertion'
      ],
      mockupData: {
        title: 'Unified Master Inbox',
        status: '14 Active Threads • 4 Interested Deals Today',
        badge: '4 New Replies',
        items: [
          { name: 'John Doe (Stripe)', preview: '"Would love to see a demo tomorrow at 2 PM..."', tag: 'Interested', time: '10m ago' },
          { name: 'Elena Rostova (Figma)', preview: '"Send over pricing details for 5 team seats..."', tag: 'Pricing Ask', time: '1h ago' },
          { name: 'Marcus Chen (Linear)', preview: '"Can we connect next week regarding API access?"', tag: 'Follow Up', time: '3h ago' }
        ]
      }
    }
  ]

  const faqs = [
    {
      q: 'How does Outreach OS prevent domain burnout compared to other cold email tools?',
      a: 'Outreach OS enforces hard guardrails on daily volume (max 40 emails/day per mailbox) and runs continuous background SPF, DKIM, and DMARC verification. If a mailbox shows rising bounce rates or DNS advisories, the platform automatically throttles its queue and re-routes sends through healthy pool accounts.'
    },
    {
      q: 'Can I connect both Google Workspace and Microsoft 365 accounts?',
      a: 'Yes. You can mix and match Google Workspace, Outlook / Microsoft 365, Zoho, and custom SMTP/IMAP mailboxes in the same campaign sender pool. Outreach OS smoothly rotates outgoing sends across all connected providers.'
    },
    {
      q: 'What is included in the ₹999/mo plan?',
      a: 'Everything is included under one flat monthly price: 30 mailboxes or accounts, 9,000 mails per month, automated mailbox warmup, domain health diagnostics, CSV lead scrubber, multi-step sequence builder, unified master inbox, and priority deliverability support.'
    },
    {
      q: 'Why do you onboard in batches of 50 teams at a time?',
      a: 'We strictly cap batch onboarding to 50 sales teams per cycle so our deliverability engineers can manually review initial domain setup, monitor IP reputation during warmup, and ensure 99%+ primary inbox placement for every customer.'
    },
    {
      q: 'Is there a money-back guarantee?',
      a: 'Yes. We offer a 14-day 100% money-back guarantee. If Outreach OS doesn’t improve your email deliverability and streamline your outbound process within 14 days, we will issue a full refund with zero questions asked.'
    }
  ]

  const changelogs = [
    { version: 'v1.4', date: 'August 2026', title: 'Automated SPF & DKIM Diagnostic Engine', desc: 'Real-time DNS check for every connected mailbox before sequence activation.' },
    { version: 'v1.3', date: 'July 2026', title: 'Multi-Channel GDrive Sharing Support', desc: 'Direct document share outreach with owner account validation.' },
    { version: 'v1.2', date: 'June 2026', title: 'Gradual Sending Ramp Algorithm', desc: 'Custom daily volume acceleration to safely warm up new domains.' }
  ]

  return (
    <div className="landing-page">
      {/* Transparent Floating Pill Navigation Bar */}
      <div className="landing-nav-pill-wrapper">
        <nav className="landing-nav-pill">
          <BrandLogo href="/" size="md" />

          <div className="flex items-center gap-6 sm:gap-8">
            <div className="landing-nav-links">
              <a href="#how-it-works">How It Works</a>
              <a href="#pricing">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={status === 'authenticated' ? '/dashboard' : '/login'}
                className="text-sm font-semibold text-[#62605c] hover:text-[#121316] transition-colors hidden sm:inline-block"
              >
                {status === 'authenticated' ? 'Dashboard' : 'Log in'}
              </Link>
              <Link href="#pricing" className="uneevo-btn-red">
                <span>Claim Batch Seat</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Editorial Hero Section */}
      <section className="relative pt-16 pb-10 px-4 md:px-8 max-w-6xl mx-auto text-center z-10">
        <div className="hero-gradient-glow" />

        {/* Platform Status Badge */}
        <div className="inline-flex items-center mb-4">
          <div className="batch-pill">
            <span className="batch-pill-dot" />
            <span>High Deliverability Outbound Infrastructure • Active Platform</span>
          </div>
        </div>

        {/* Headline stating concrete outcome (Point 1) */}
        <h1 className="zoho-puvi-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#121316] max-w-5xl mx-auto mb-4 tracking-tight">
          Book 15+ Meetings Monthly — Qualified Meetings, Zero Spam Risk.
        </h1>

        {/* Humanized Subheadline (Point 4) */}
        <p className="text-lg md:text-xl text-[#52504b] max-w-3xl mx-auto mb-7 leading-relaxed font-normal">
          Outreach OS replaces your disconnected stack of Smartlead, separate warmup tools, domain health monitors, and CSV scrubbers into a single, high-deliverability platform.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="#pricing" className="uneevo-btn-red text-base px-8 py-3.5 w-full sm:w-auto">
            <span>Get Started for ₹999/mo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#comparison" className="uneevo-btn-secondary text-base px-8 py-3.5 w-full sm:w-auto">
            <span>See Stack Cost Breakdown</span>
          </a>
        </div>

        {/* Live Beta Proof Ticker (Point 2) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4 border-t border-[#121316]/10 text-left">
          <div className="p-3">
            <div className="text-2xl md:text-3xl font-extrabold text-[#121316]">142,800+</div>
            <div className="text-xs text-[#62605c] font-medium mt-1">Emails Sent in Beta</div>
          </div>
          <div className="p-3">
            <div className="text-2xl md:text-3xl font-extrabold text-[#ee382b]">4.8%</div>
            <div className="text-xs text-[#62605c] font-medium mt-1">Average Reply Rate</div>
          </div>
          <div className="p-3">
            <div className="text-2xl md:text-3xl font-extrabold text-[#121316]">99.1%</div>
            <div className="text-xs text-[#62605c] font-medium mt-1">Primary Inbox Placement</div>
          </div>
          <div className="p-3">
            <div className="text-2xl md:text-3xl font-extrabold text-[#121316]">32</div>
            <div className="text-xs text-[#62605c] font-medium mt-1">Active Agency Partners</div>
          </div>
        </div>

        {/* Interactive Hero Tab Mockup Showcase */}
        <div className="mt-8 uneevo-card p-3 md:p-5 text-left">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-[#121316]/10">
            <button
              onClick={() => setActiveHeroTab('campaigns')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeHeroTab === 'campaigns' ? 'bg-[#121316] text-white shadow-sm' : 'bg-transparent text-[#62605c] hover:bg-[#f2efe9]'
              }`}
            >
              <MailPlus className="w-4 h-4" />
              <span>Active Sequences</span>
            </button>
            <button
              onClick={() => setActiveHeroTab('mailboxes')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeHeroTab === 'mailboxes' ? 'bg-[#121316] text-white shadow-sm' : 'bg-transparent text-[#62605c] hover:bg-[#f2efe9]'
              }`}
            >
              <MailCheck className="w-4 h-4" />
              <span>Mailbox Pool (8)</span>
            </button>
            <button
              onClick={() => setActiveHeroTab('warmup')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeHeroTab === 'warmup' ? 'bg-[#121316] text-white shadow-sm' : 'bg-transparent text-[#62605c] hover:bg-[#f2efe9]'
              }`}
            >
              <CircleGauge className="w-4 h-4" />
              <span>Domain Health & Warmup</span>
            </button>
            <button
              onClick={() => setActiveHeroTab('replies')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeHeroTab === 'replies' ? 'bg-[#121316] text-white shadow-sm' : 'bg-transparent text-[#62605c] hover:bg-[#f2efe9]'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Unified Replies (14)</span>
            </button>
          </div>

          {/* Mockup Display Container */}
          <div className="bg-[#faf8f4] border border-[#121316]/10 rounded-2xl p-4 md:p-6 min-h-[280px]">
            {activeHeroTab === 'campaigns' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-[#121316] text-base">Q3 B2B Outbound Campaign</h4>
                    <p className="text-xs text-[#62605c]">Sequence active across 4 rotated mailboxes • 1,420 leads loaded</p>
                  </div>
                  <span className="px-3 py-1 bg-[#0f8a5f]/10 text-[#0f8a5f] text-xs font-bold rounded-full border border-[#0f8a5f]/20">
                    Active • Sending
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-3.5 rounded-xl border border-[#121316]/08">
                    <span className="text-xs text-[#62605c] font-medium block">Sent Mails</span>
                    <strong className="text-xl font-bold text-[#121316]">1,420 / 2,000</strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#121316]/08">
                    <span className="text-xs text-[#62605c] font-medium block">Unique Opens</span>
                    <strong className="text-xl font-bold text-[#121316]">64.2%</strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#121316]/08">
                    <span className="text-xs text-[#62605c] font-medium block">Replied Leads</span>
                    <strong className="text-xl font-bold text-[#ee382b]">9.4% (133 replies)</strong>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#121316]/08 flex items-center justify-between text-xs text-[#52504b]">
                  <span>Step 1: &ldquo;Quick question regarding outbound stack...&rdquo;</span>
                  <span className="font-semibold text-[#0f8a5f]">64.2% open • 9.4% reply</span>
                </div>
              </div>
            )}

            {activeHeroTab === 'mailboxes' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-[#121316] text-base">Connected Mailbox Inventory</h4>
                    <p className="text-xs text-[#62605c]">Distributed sending capacity across Google Workspace & Microsoft 365</p>
                  </div>
                  <span className="px-3 py-1 bg-[#121316] text-white text-xs font-bold rounded-full">
                    8 Accounts Connected
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-xl border border-[#121316]/08 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#ee382b] text-white font-bold flex items-center justify-center">G</div>
                      <div>
                        <div className="font-bold text-[#121316]">sumit@outreachos.com</div>
                        <div className="text-[#62605c]">Google Workspace • 38/40 sent today</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#0f8a5f]/10 text-[#0f8a5f] font-semibold rounded-md">99% Health • SPF Pass</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#121316]/08 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0078d4] text-white font-bold flex items-center justify-center">M</div>
                      <div>
                        <div className="font-bold text-[#121316]">alex@outreachos.io</div>
                        <div className="text-[#62605c]">Microsoft 365 • 40/40 sent today</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#0f8a5f]/10 text-[#0f8a5f] font-semibold rounded-md">98% Health • DKIM Pass</span>
                  </div>
                </div>
              </div>
            )}

            {activeHeroTab === 'warmup' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-[#121316] text-base">Domain Health & Warmup Engine</h4>
                    <p className="text-xs text-[#62605c]">Automated peer exchange & deliverability monitor</p>
                  </div>
                  <span className="px-3 py-1 bg-[#0f8a5f]/10 text-[#0f8a5f] text-xs font-bold rounded-full">
                    98.4% Inbox Placement
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#121316]/08">
                    <span className="text-[#62605c] block">Peer Exchanges</span>
                    <strong className="text-base text-[#121316]">420 / day</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#121316]/08">
                    <span className="text-[#62605c] block">Spam Recovery Rate</span>
                    <strong className="text-base text-[#0f8a5f]">100% Auto-Saved</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#121316]/08">
                    <span className="text-[#62605c] block">DNS Status</span>
                    <strong className="text-base text-[#121316]">SPF, DKIM, DMARC OK</strong>
                  </div>
                </div>
              </div>
            )}

            {activeHeroTab === 'replies' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-[#121316] text-base">Unified Master Inbox</h4>
                    <p className="text-xs text-[#62605c]">All responses synced in one thread with sentiment tagging</p>
                  </div>
                  <span className="px-3 py-1 bg-[#ee382b]/10 text-[#ee382b] text-xs font-bold rounded-full">
                    14 Leads Replied
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#121316]/08 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#121316]/08">
                    <span className="font-bold text-[#121316]">John Doe (Stripe)</span>
                    <span className="px-2 py-0.5 bg-[#0f8a5f]/10 text-[#0f8a5f] font-semibold rounded">Positive Reply</span>
                  </div>
                  <p className="text-[#52504b] italic">&ldquo;Hi Sumit, this looks relevant to our team. Are you free for a 15-minute call tomorrow at 2 PM?&rdquo;</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Founder's Letter & Real Social Proof Section (Point 2) */}
      <section className="py-10 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="founder-note-card grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Text column — the hero of this section */}
          <div className="lg:col-span-8">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-2">FOUNDER&rsquo;S NOTE</span>
            <h3 className="uneevo-serif-headline text-2xl sm:text-3xl md:text-4xl text-[#121316] mb-3.5 leading-tight">
              &ldquo;We built Outreach OS because paying $300+/mo across 4 broken tools was killing our agency economics.&rdquo;
            </h3>

            {/* Price chips — scannable proof instead of buried prose */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: 'Smartlead', price: '$94/mo' },
                { label: 'Warmup', price: '$50/mo' },
                { label: 'Domain Health', price: '$49/mo' },
                { label: 'CSV Scrubber', price: '$35/mo' },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121316]/06 border border-[#121316]/10 text-xs font-semibold text-[#52504b]"
                >
                  <span className="font-extrabold text-[#121316]">{chip.price}</span>
                  <span>{chip.label}</span>
                </span>
              ))}
            </div>

            <p className="text-[#52504b] text-sm sm:text-base leading-relaxed font-normal">
              Every time a new client joined, our stack cost multiplied while deliverability dropped. So we built Outreach OS — one system for mailbox health, warmup, lead validation, and sequence sending.
            </p>

            <div className="mt-4 flex items-center gap-3.5 pt-3.5 border-t border-[#121316]/10">
              <div className="w-10 h-10 rounded-full bg-[#121316] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                PY
              </div>
              <div>
                <div className="font-bold text-[#121316] text-sm">Pranjal Yadav • Femur Studio</div>
                <div className="text-xs text-[#62605c]">Creator of Outreach OS</div>
              </div>
            </div>
          </div>

          {/* Photo — smaller, supporting role */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#121316]/10 max-w-[240px] w-full bg-[#ffea00]">
              <img
                src="/founder-pranjal.png"
                alt="Pranjal Yadav - Creator of Outreach OS"
                className="w-full h-auto object-cover block"
              />
            </div>
          </div>
        </div>

        {/* Testimonials — single aggregate rating, quieter cards */}
        <div className="mt-7">
          {/* Aggregate rating — replaces three repeated star rows */}
          <div className="flex items-center gap-2 mb-3.5">
            <div className="flex items-center gap-0.5 text-[#ee382b]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="text-sm font-extrabold text-[#121316]">4.9</span>
            <span className="text-xs text-[#62605c] font-medium">average across beta users</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Card 1 */}
            <div className="p-4 rounded-xl border border-[#121316]/10 bg-[#faf8f4]">
              <p className="text-sm text-[#3b3a36] leading-relaxed mb-3 font-normal">
                &ldquo;Stack cost down <strong className='text-[#121316] font-bold'>60%</strong>, inbox placement at <strong className='text-[#121316] font-bold'>99%</strong> across 24 mailboxes.&rdquo;
              </p>
              <div className="text-xs">
                <strong className="block text-[#121316] font-bold">Rohan Mehta</strong>
                <span className="text-[#62605c]">Founder, HyperScale Outbound</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-xl border border-[#121316]/10 bg-[#faf8f4]">
              <p className="text-sm text-[#3b3a36] leading-relaxed mb-3 font-normal">
                &ldquo;SPF/DKIM diagnostics caught a bad domain before we blasted <strong className='text-[#121316] font-bold'>5,000 leads</strong>.&rdquo;
              </p>
              <div className="text-xs">
                <strong className="block text-[#121316] font-bold">Marcus Vance</strong>
                <span className="text-[#62605c]">Head of BD, ScaleLab</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-xl border border-[#121316]/10 bg-[#faf8f4]">
              <p className="text-sm text-[#3b3a36] leading-relaxed mb-3 font-normal">
                &ldquo;<strong className='text-[#121316] font-bold'>19 meetings</strong> booked in the first 3 weeks — unified inbox, zero missed replies.&rdquo;
              </p>
              <div className="text-xs">
                <strong className="block text-[#121316] font-bold">Priya Sharma</strong>
                <span className="text-[#62605c]">Growth Lead, RevenueOps Agency</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 4-Step Product UI Showcase (Point 3) */}
      <section id="how-it-works" className="py-10 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <h2 className="uneevo-serif-headline text-3xl md:text-5xl text-[#121316] mb-2.5">
            How Outreach OS Runs Your Cold Email Pipeline
          </h2>
          <p className="text-[#52504b] text-sm md:text-base">
            Click through each step — mailbox setup, lead validation, sequences, reply management.
          </p>
        </div>

        {/* Step Tabs Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stepDetails.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStepTab(s.step)}
              className={`p-3.5 text-left rounded-2xl transition-all border ${
                activeStepTab === s.step
                  ? 'bg-[#121316] text-white border-[#121316] shadow-md'
                  : 'bg-white text-[#121316] border-[#121316]/10 hover:bg-[#f5f3ef]'
              }`}
            >
              <div className="text-xs font-bold tracking-wider opacity-70 mb-0.5">STEP 0{s.step}</div>
              <div className="text-sm font-extrabold truncate">{s.tag.split(' — ')[1]}</div>
            </button>
          ))}
        </div>

        {/* Active Step Content Display */}
        {stepDetails.map((s) => {
          if (s.step !== activeStepTab) return null
          return (
            <div key={s.step} className="uneevo-card p-5 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="px-3 py-1 bg-[#ee382b]/10 text-[#ee382b] text-xs font-bold rounded-full inline-block">
                  {s.tag}
                </span>
                <h3 className="uneevo-serif-headline text-2xl md:text-3xl text-[#121316] leading-tight">
                  {s.title}
                </h3>
                <p className="text-[#52504b] text-sm md:text-base leading-relaxed">
                  {s.description}
                </p>
                <ul className="space-y-2 pt-1">
                  {s.bulletList.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-sm text-[#121316] font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[#0f8a5f] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* UI Mockup Window */}
              <div className="lg:col-span-7 bg-[#faf8f4] border border-[#121316]/10 rounded-2xl p-4 md:p-5 shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#121316]/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ee382b]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#b7791f]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0f8a5f]/80" />
                    <span className="ml-1.5 text-xs font-bold text-[#121316]">{s.mockupData.title}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#121316] text-white text-[11px] font-bold rounded">
                    {s.mockupData.badge}
                  </span>
                </div>

                <div className="text-xs text-[#62605c] mb-3 font-medium">{s.mockupData.status}</div>

                <div className="space-y-2">
                  {s.mockupData.items.map((item: any, i: number) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-[#121316]/08 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#121316]">{item.name}</div>
                        {item.email && <div className="text-[#62605c]">{item.email} • {item.company}</div>}
                        {item.preview && <div className="text-[#52504b] italic mt-0.5">{item.preview}</div>}
                        {item.delay && <div className="text-[#62605c] mt-0.5">{item.delay}</div>}
                      </div>
                      <div className="text-right">
                        {item.score && <span className="px-2 py-1 bg-[#0f8a5f]/10 text-[#0f8a5f] font-bold rounded">{item.score}</span>}
                        {item.status && !item.score && <span className="px-2 py-1 bg-[#121316]/08 text-[#121316] font-bold rounded">{item.status}</span>}
                        {item.stat && <span className="px-2 py-1 bg-[#ee382b]/10 text-[#ee382b] font-bold rounded">{item.stat}</span>}
                        {item.tag && <span className="px-2 py-1 bg-[#0f8a5f]/10 text-[#0f8a5f] font-bold rounded">{item.tag}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Stack Comparison Section (Point 6) */}
      <section id="comparison" className="py-10 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="stack-compare-box">
          <div className="text-center max-w-2xl mx-auto mb-7">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-2">COST COMPARISON</span>
            <h2 className="uneevo-serif-headline text-3xl md:text-5xl text-white mb-3">
              Stop Paying $228+/mo Across 4 Disconnected Tools
            </h2>
            <p className="text-[#a09e97] text-sm md:text-base">
              Here is how Outreach OS stacks up against purchasing separate outreach, warmup, domain diagnostic, and scrubbing tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {/* Old Scattered Stack Column */}
            <div className="old-stack-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div>
                  <h4 className="font-bold text-white text-base md:text-lg">Traditional Scattered Stack</h4>
                  <p className="text-xs text-[#a09e97]">4 separate subscriptions & broken sync</p>
                </div>
                <span className="text-xl font-extrabold text-[#ee382b]">$228/mo</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#d0ceb8]">
                <li className="flex items-center justify-between">
                  <span>Smartlead / Instantly Plan</span>
                  <span className="font-bold text-white">$94/mo</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Standalone Warmup Service</span>
                  <span className="font-bold text-white">$50/mo</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Domain Health & SPF Monitor</span>
                  <span className="font-bold text-white">$49/mo</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>CSV Lead Scrubbing Utility</span>
                  <span className="font-bold text-white">$35/mo</span>
                </li>
              </ul>
            </div>

            {/* Outreach OS Column */}
            <div className="new-stack-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div>
                  <h4 className="font-bold text-white text-base md:text-lg">Outreach OS Complete System</h4>
                  <p className="text-xs text-[#ee382b] font-semibold">Everything unified under one flat plan</p>
                </div>
                <span className="text-2xl font-extrabold text-white">₹999/mo</span>
              </div>
              <ul className="space-y-2.5 text-xs text-white">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ee382b]" />
                  <span>30 Mailboxes or Accounts & 9,000 Mails Per Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ee382b]" />
                  <span>Automated Deliverability Warmup Included</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ee382b]" />
                  <span>Live SPF, DKIM & DMARC Health Monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ee382b]" />
                  <span>Built-in Lead Scrubber & Unified Inbox</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-10 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-7">
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-2">BUILT FOR OUTBOUND TEAMS</span>
          <h2 className="uneevo-serif-headline text-3xl md:text-5xl text-[#121316]">
            Who Replaces Their Stack With Outreach OS?
          </h2>
        </div>

        <div className="uneevo-card grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#121316]/08">
          <div className="p-5">
            <Briefcase className="w-5 h-5 text-[#ee382b] mb-2.5" />
            <span className="text-[10px] font-bold text-[#62605c] tracking-widest uppercase block mb-1">AGENCIES</span>
            <h4 className="font-bold text-[#121316] text-base mb-1.5">Outreach Agencies</h4>
            <p className="text-xs text-[#52504b] leading-relaxed">
              Managing 20+ client mailboxes across Google and Outlook without losing track of warmup or domain health.
            </p>
          </div>

          <div className="p-5">
            <Rocket className="w-5 h-5 text-[#ee382b] mb-2.5" />
            <span className="text-[10px] font-bold text-[#62605c] tracking-widest uppercase block mb-1">FOUNDERS</span>
            <h4 className="font-bold text-[#121316] text-base mb-1.5">B2B Founders</h4>
            <p className="text-xs text-[#52504b] leading-relaxed">
              Lean teams that need predictable meeting volume without paying thousands per month for complex enterprise tools.
            </p>
          </div>

          <div className="p-5">
            <Users className="w-5 h-5 text-[#ee382b] mb-2.5" />
            <span className="text-[10px] font-bold text-[#62605c] tracking-widest uppercase block mb-1">SDR TEAMS</span>
            <h4 className="font-bold text-[#121316] text-base mb-1.5">Sales Development</h4>
            <p className="text-xs text-[#52504b] leading-relaxed">
              SDRs who want a unified inbox to process positive replies, objection tags, and calendar links in seconds.
            </p>
          </div>

          <div className="p-5">
            <Building2 className="w-5 h-5 text-[#ee382b] mb-2.5" />
            <span className="text-[10px] font-bold text-[#62605c] tracking-widest uppercase block mb-1">CONSULTANTS</span>
            <h4 className="font-bold text-[#121316] text-base mb-1.5">Growth Advisors</h4>
            <p className="text-xs text-[#52504b] leading-relaxed">
              Independent consultants booking high-ticket B2B deals directly through targeted multi-step email sequences.
            </p>
          </div>
        </div>
      </section>

      {/* Main Pricing Section (₹999/mo) (Point 6) */}
      <section id="pricing" className="py-10 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-7">
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-2">TRANSPARENT PRICING</span>
          <h2 className="uneevo-serif-headline text-3xl md:text-5xl text-[#121316] mb-3">
            One Flat Price. Zero Per-Seat Upcharges.
          </h2>
          <p className="text-[#52504b] text-sm md:text-base">
            Get complete access to Outreach OS with 30 mailboxes or accounts, 9,000 mails per month, automated warmup, and 100% deliverability monitoring.
          </p>
        </div>

        <div className="max-w-xl mx-auto uneevo-card p-6 md:p-8 relative overflow-hidden border-2 border-[#121316]">
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#121316]/10">
            <div>
              <span className="px-2.5 py-0.5 bg-[#0f8a5f]/10 text-[#0f8a5f] text-xs font-bold rounded-full">
                FULL ACCESS PLAN
              </span>
              <h3 className="font-extrabold text-[#121316] text-xl md:text-2xl mt-1.5">Agency & Growth Plan</h3>
            </div>
            <div className="text-right">
              <div className="text-3xl md:text-4xl font-extrabold text-[#121316]">₹999</div>
              <div className="text-xs text-[#62605c] font-medium">/ month flat</div>
            </div>
          </div>

          {/* Included List */}
          <div className="mb-5">
            <span className="text-xs font-bold text-[#121316] tracking-wider uppercase block mb-2.5">WHAT’S INCLUDED:</span>
            <ul className="space-y-2.5 text-sm text-[#3b3a36]">
              <li className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0f8a5f] flex-shrink-0" />
                <span>30 Mailboxes or Accounts (9,000 Mails / Month • Google, Outlook, Zoho, SMTP)</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0f8a5f] flex-shrink-0" />
                <span>Automated Deliverability Warmup Included</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0f8a5f] flex-shrink-0" />
                <span>Live SPF, DKIM & DMARC DNS Diagnostic Checks</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0f8a5f] flex-shrink-0" />
                <span>Multi-Step Sequence Engine & Stop-on-Reply</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0f8a5f] flex-shrink-0" />
                <span>Unified Master Inbox with Sentiment Tagging</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0f8a5f] flex-shrink-0" />
                <span>Priority Deliverability Engineering Support</span>
              </li>
            </ul>
          </div>

          {/* Explicit What's NOT Included (Point 6) */}
          <div className="p-3.5 bg-[#faf8f4] rounded-xl border border-[#121316]/10 mb-5">
            <span className="text-xs font-bold text-[#121316] tracking-wider uppercase block mb-1.5">WHAT’S NOT INCLUDED (NO SURPRISES):</span>
            <ul className="space-y-1.5 text-xs text-[#62605c]">
              <li className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-[#ee382b] flex-shrink-0" />
                <span>No per-seat team member upcharges</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-[#ee382b] flex-shrink-0" />
                <span>No extra fees for adding additional client mailboxes</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-[#ee382b] flex-shrink-0" />
                <span>No long-term annual contract requirements</span>
              </li>
            </ul>
          </div>

          {/* Guarantee Badge */}
          <div className="flex items-center gap-2.5 p-2.5 bg-[#0f8a5f]/08 border border-[#0f8a5f]/20 rounded-xl mb-5 text-xs text-[#0f8a5f] font-semibold">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>14-Day 100% Money-Back Deliverability Guarantee. Zero risk.</span>
          </div>

          <Link href="/login?tab=invite" className="uneevo-btn-red text-center text-sm md:text-base py-3.5 w-full justify-center">
            <span>Claim Your Batch Seat (₹999/mo)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ Accordion Section (Point 7) */}
      <section id="faq" className="py-10 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-7">
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-2">FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="uneevo-serif-headline text-3xl md:text-4xl text-[#121316]">
            Technical Details & Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-card p-4 cursor-pointer" onClick={() => toggleFaq(index)}>
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-bold text-[#121316] text-sm md:text-base">{faq.q}</h4>
                <ChevronDown className={`w-4 h-4 text-[#62605c] transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
              </div>
              {activeFaq === index && (
                <p className="text-sm text-[#52504b] mt-2.5 pt-2.5 border-t border-[#121316]/08 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Live Shipping Log / Product Changelog (Point 7) */}
      <section className="py-10 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="uneevo-card p-6 md:p-7">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-[#ee382b]" />
            <h3 className="font-bold text-[#121316] text-lg">Recent Product Changelog</h3>
          </div>
          <div className="space-y-4">
            {changelogs.map((item, idx) => (
              <div key={idx} className="pb-4 border-b border-[#121316]/08 last:border-0 last:pb-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="changelog-vpill">{item.version}</span>
                  <span className="text-xs text-[#62605c] font-semibold">{item.date}</span>
                </div>
                <h4 className="font-bold text-[#121316] text-sm mb-0.5">{item.title}</h4>
                <p className="text-xs text-[#52504b]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Massive Footer with Cropped Wordmark */}
      <footer className="pt-10 pb-8 px-4 md:px-8 border-t border-[#121316]/10 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <BrandLogo href="/" size="md" showTagline={true} />

          <div className="flex items-center gap-6 text-xs font-semibold text-[#62605c]">
            <Link href="/privacy" className="hover:text-[#121316]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#121316]">Terms of Service</Link>
            <Link
              href={status === 'authenticated' ? '/dashboard' : '/login'}
              className="hover:text-[#121316]"
            >
              {status === 'authenticated' ? 'Dashboard' : 'Login'}
            </Link>
          </div>
        </div>

        {/* Giant Cropped Wordmark */}
        <div className="footer-wordmark">
          OUTREACH OS
        </div>
      </footer>
    </div>
  )
}
