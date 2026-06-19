# Forge Version History

## v7.81 (2026-06-18)
- Fix: truncated .run() at L30801 (feature-adoption POST handler cut off — TS1005 parse crash)

## v7.80 (2026-06-18)
- Fix: truncated res.j at L32000 (localization-keys POST handler incomplete — crashed route registration)

## v7.79 (2026-06-18)
- Fix: authenticateToken + auth aliases undefined → ReferenceError crash (same root cause as authMiddleware)

## v7.78 (2026-06-17)
- B188: Image Generation, Notification Bell, Goal Streaks, AI Writing Coach, Work Sessions

## v7.77 (2026-06-17)
- Fix: authMiddleware alias undefined → ReferenceError crash on startup (was crashing all routes)

## v7.76 (2026-06-17)
- B187: Podcast Notes v2, API Versioning, Elevator Pitch AI, Fasting Tracker v2, Localization Keys

## v7.75 (2026-06-17)
- B186: Gratitude Challenges, Release Blockers, Brand Story AI, Recovery Log, Permission Matrix

## v7.74 (2026-06-17)
- Fix: Railway healthcheckTimeout 60→300s (was killing process before DB setup completed)

## v7.73 (2026-06-17)
- B185: Vision Mapping, API Analytics, Competitive Positioning AI, Meal Prep Log, Onboarding Flows

## v7.72 (2026-06-17)
- B184: Learning Resources, Campaign Tracker, Reframe Coach AI, Sauna Log, Data Pipelines

## v7.71 (2026-06-17)
- B183: Affirmation Sets, Vendor Contracts, Tone Analyzer AI, Cold Exposure Log, Feature Votes

## v7.70 (2026-06-17)
- B182: Networking Events, Cost Tracker, Email Subject AI, Body Scan Log, Tech Decisions

## v7.69 (2026-06-17)
- B181: Book Summaries, OKR Templates, Tagline Refiner AI, Fasting Windows, Incident Severity

## v7.68 (2026-06-17)
- B180: Reading Log, API Keys Vault, Headline Scorer AI, Habit Chains, Sprint Board
- Fix: B178/B179 db.exec wrapped in try/catch to prevent startup crash on Railway

## v7.67 (2026-06-17)
- B179: Gratitude Practice, Deployment Envs, Copywriting Angles AI, Cold Plunge Log, Feature Adoption

## v7.66 (2026-06-17)
- B178: Mood Check-ins, Integration Registry, Meeting Facilitator AI, FI Tracker, Knowledge Articles

## v7.65 (2026-06-17)
- B177: Learning Milestones, Compliance Policies, Content Summarizer AI, Running Log, Feature Toggles

## v7.64 (2026-06-17)
- B176: Bucket List v3, Vendor SLAs, Interview Questions AI, Hydration Log, Sprint Reviews

## v7.63 (2026-06-17)
- B175: Vision Statements, Changelog Entries, Sales Objection AI, Sleep Goals, Architecture Diagrams

## v7.62 (2026-06-17)
- B174: Conversation Scripts, Audit Trail, Rebrand Copy AI, Micro Habits, Team Goals

## v7.61 (2026-06-17)
- B173: Podcast Notes, API Versioning, Elevator Pitch AI, Fasting v2, Localization Keys

## v7.60 (2026-06-17)
- B172: Gratitude Challenges, Release Blockers, Brand Story AI, Recovery Log, Permission Matrix

## v7.59 (2026-06-17)
- B171: Affirmation Chains, Budget Forecast, Debate Coach AI, Stretch Log, Data Retention

## v7.58 (2026-06-17)
- B170: Energy Blocks, Incident Runbooks, Cold Email AI v2, Net Worth Tracker v2, SLA Tracker v2

## v7.57 (2026-06-17)
- B169: Focus Rituals, Changelog v2, Interview Coach AI, Meal Planning, Dependency Tracker

## v7.56 (2026-06-17)
- B168: Habit Score, API Usage, Tagline AI v3, Symptom Patterns, Team Norms

## v7.55 (2026-06-17)
- B167: Learning Notes, Feature Matrix, Press Release AI, Posture Log, Cost Allocation

## v7.54 (2026-06-17)
- B166: Challenge Tracker, Workspace Glossary, Cold DM AI, Financial Goals, Error Budget

## v7.53 (2026-06-17)
- B165: Journal Prompts, Content Pipeline, Pitch Deck AI, Mood+Weather, Access Log

## v7.52 (2026-06-17)
- B164: Gratitude Chain, Alert Rules, Naming AI, Macro Tracker, Hiring Scorecard

## v7.51 (2026-06-17)
- B163: Reading Goals, Sprint Velocity, Bio Writer v2, Energy Map, Tech Stack

## v7.50 (2026-06-17)
- B162: Prompt Library, Data Catalog, Story Hook AI, Sleep Debt Tracker, Vendor Scorecard

## v7.49 (2026-06-17)
- B161: Digital Detox Planner, Experiment Log, Objection Handler AI, Language Goals, Product Metrics

## v7.48 (2026-06-17)
- B160: Habit Stacking, Localization Strings, Value Prop AI, Breathwork Log, Onboarding Checklist

## v7.47 (2026-06-17)
- B159: Coffee Journal, Decision Matrix, Pitch Analyzer AI, FI Tracker, Feedback Collector

## v7.46 (2026-06-17)
- B158: Book Wishlist, Integration Health, Cover Letter AI v2, Moon Phase Log, Capacity Forecast

## v7.45 (2026-06-17)
- B157: Focus Sprints, Asset Library, Slogan Generator AI, Vision Statement, Meeting Cost Calculator

## v7.44 (2026-06-17)
- B156: Conversation Starters, Dependency Map, FAQ Generator AI, Expense Split, Change Log

## v7.43 (2026-06-17)
- B155: Life Areas, Announcements, Meeting Agenda AI, Detox Log, KPI Alerts

## v7.42 (2026-06-17)
- B154: Habit Challenges, Meeting Rooms, Recipe AI, Mood Playlist, Idea Pipeline

## v7.41 (2026-06-17)
- B153: Career Journal, Feedback Wall, Poem Generator, Plant Tracker, Data Requests

## v7.40 (2026-06-17)
- B152: Fitness Goals, Event Planner, Story Generator, Mindfulness Reminders, API Rate Limits

## v7.39 (2026-06-17)
- B151: Gratitude Jar, Content Briefs, Tagline AI v2, Symptom Log, Sprint Goals

## v7.38 (2026-06-17)
- B150: Bucket List v2, OKR Heatmap, Email Reply AI, Dream Journal, Tech Radar

## v7.37 (2026-06-17)
- B149: Creative Projects, Hiring Pipeline, SWOT Generator, Skincare Log, Budget Tracker v2

## v7.36 (2026-06-17)
- B148: Travel Wishlist, SOP Library, LinkedIn Posts, Pomodoro Sessions, Compliance Register

## v7.35 (2026-06-17)
- B147: Networking CRM, Localization, Cover Letters, Allergy Log, Release Calendar

## v7.34 (2026-06-17)
- B146: Book Club, Partner Tracker, Debate Prep, Caffeine Tracker, Growth Experiments

## v7.33 (2026-06-17)
- B145: Stress Log, Product Feedback, Icebreaker Generator, Journal v2, Innovation Log

## v7.32 (2026-06-17)
- B144: Brain Dump, Sprint Backlog, Social Captions, Fasting Tracker, Product Glossary

## v7.31 (2026-06-17)
- B143: Language Flashcards, KPI Dashboard, Meeting Minutes, Emotional Journal, Support Tickets v2

## v7.30 (2026-06-17)
- B142: Workout Programs, Comm Log, Blog Outlines, Mood Boards, Project Phases

## v7.29 (2026-06-17)
- B141: Bucket List, Vendor Contacts, Product Name Generator, Water Intake v2, Cost Centers

## v7.28 (2026-06-17)
- B140: Body Metrics, Stakeholder Map, Headline Optimizer, Gratitude v2, Security Log

## v7.27 (2026-06-17)
- B139: Learning Sprints, Feature Requests, Tagline Generator, Expense Categories, Architecture Docs

## v7.26 (2026-06-17)
- B138: Focus Blocks, Incident Tracker, Content Repurposer, Sleep Tracker v2, API Changelog

## v7.25 (2026-06-17)
- B137: Vision Board, Process Flows, Cold Email Generator, Habit Streaks v4, Meeting Templates

## v7.24 (2026-06-17)
- B136: Affirmations Board, Data Dictionary, Resume Builder, Project Portfolio, Team Directory

## v7.23 (2026-06-17)
- B135: Interview Prep, OKR Tracker, Pitch Deck Builder, Recipe Box, Risk Register

## v7.22 (2026-06-17)
- B134: Daily Intentions, Retrospectives, SWOT Analysis, Savings Goals, Competitive Analysis

## v7.21 (2026-06-17)
- B133: Meditation Log, API Documentation, PRD Builder, Goal Milestones, Tech Debt Tracker

## v7.20 (2026-06-17)
- B131: Networking Log, Decision Log, Bio Writer, Subscriptions, Customer Personas
- B132: Habits Tracker v3, Onboarding Docs, Email Sequences, Expenses, Product Roadmap

## v7.19 (2026-06-17)
- B126: Focus Sessions, Architecture Diagrams, Value Propositions, Reading Notes, Feature Flags
- B127: Debt Tracker, Postmortems, Job Descriptions, Investment Watchlist, SLA Tracker
- B128: Mood Journal, Vendor Contracts, Press Releases, Workout Log, Interview Questions
- B129: Book Tracker, Team Budget, Content Repurposer, Water Intake, Eng Metrics
- B130: Language Learning, Changelog, Meeting Agendas, Journal Prompts, Capacity Planner

## v7.18 (2026-06-17)
- B121: Affirmations, Data Dictionary, Tagline Generator, Project Log, Access Requests
- B122: Meal Planner, Brand Assets, A/B Test Ideas, Energy Log, Service Catalog
- B123: Quotes Collection, Dependency Tracker, Persona Builder, Screen Time, Knowledge Base
- B124: Pain Points Journal, Compliance Docs, Headline Optimizer, Gratitude Journal, Meeting Templates
- B125: Vision Journal, Deployment Runbook, Blog Outline Generator, Symptoms Log, Escalation Matrix

## v7.17 (2026-06-16)
- B118: Life Goals, Meeting Action Items, Cold Outreach Builder, Daily Checklist, Product Feedback
- B119: Learning Paths, Sprint Retrospectives, Product Name Generator, Body Measurements, Stakeholder Map
- B120: Travel Plans, Release Notes, FAQ Builder, Sleep Quality, Client Portal

## v7.16 (2026-06-16)
- B116: Pomodoro Log, Design Tokens, SWOT Builder, Net Worth Tracker, Test Plans
- B117: Time Blocks, API Keys Registry, Email Subject Tester, Savings Goals, Onboarding Checklist

## v7.15 (2026-06-16)
- B115: Reading Challenge, Architecture Decisions (ADRs), Pitch Deck Builder, Habit Streaks v2, Security Checklist

## v7.14 (2026-06-16)
- B115: Reading Challenge, Architecture Decisions (ADRs), Pitch Deck Builder, Habit Streaks v2, Security Checklist

## v7.13 (2026-06-16)
- B112: Vision Board, Incident Log, Code Optimizer, Water Tracker, Tech Radar
- B113: Focus Sessions, Capacity Planning, Interview Prep, Meditation Log, Competitive Intel
- B114: Skill Matrix, Budget Tracker, Content Calendar, Personal Goals, Access Log

## v7.12 (2026-06-16)
- B107: Sleep Log, API Catalog, Diagram Builder, Expense Tracker, Retro Boards
- B108: Journal Entries, Vendor List, Email Drafter, Mood Board, Changelog
- B109: Workout Plans, Meeting Notes, Resume Builder, Bucket List, Dependency Map
- B110: Reading Notes, Feature Flags, Story Generator, Gratitude Log, SLA Tracker
- B111: Contact Book, Release Calendar, Debate Topics, Language Vocab, Cost Center

## v7.11 (2026-06-16)
- B106: Portfolio, Runbooks, Code Review Queue, Nutrition Log, PR Reviews
- Fix: duplicate `import cron` crash — restores login (LOGINFAILED resolved)

## v7.10 (2026-06-15)
- B105: Reading Queue, Sprint Capacity, Tone Rewriter, Achievement Badges, Data Glossary
- B104: Decision Journal, Knowledge Wiki, Concept Explainer, Reflection Log, Team Kudos
- B103: Flashcard Decks, OKR Check-ins, Debate Coach, Habit Chains, Event Calendar
- B102: Book Tracker, Project Risks, Writing Coach, Mind Map, Survey Responses
- Fix: polls-v2 syntax crash (extra quote) — restored login/502

## v7.00 (2026-06-14)
- B76–B101: +125 features across personal productivity, workspace collab, AI tools
- Billing infrastructure: Stripe subscriptions + overage charging
- Admin revenue dashboard
- Autonomy OS: nightly cron, trust ladder, outcome ledger

## v6.99 (2026-05-30)
- Smoke test audit; archived 105 throwaway files
- Fixed setupAutonomy never-called bug

## v6.98 (2026-05-20)
- All 10 FABLE autonomy features wired
- Nightly cron, URL fixes

## v6.64 (2026-05-16)
- Desktop app, Marketplace, Analytics, Orgs, Mobile, Rate limiting
- Webhooks, Chrome extension, Metrics, RBAC
