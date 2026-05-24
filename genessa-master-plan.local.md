GENESSA — AI Visibility Operating System
Product Architecture & Roadmap
Genessa is NOT a simple AI SEO tool.
It is an AI-native consulting operations platform designed to manage AI Visibility audits, strategic planning, multi-agent workflows, sprint execution, approvals, and long-term optimization processes for different sectors.
The system combines:
AI Visibility analysis
Consulting workflows
Task orchestration
AI workforce management
Sector-specific intelligence packs
The platform must support:
internal admin operations
AI agents
client lifecycle management
sprint systems
reports and proposals
human approval workflows
This document explains the full architecture and intended behavior of the platform.

OVERALL PRODUCT STRUCTURE
The system has 4 major layers:
1. Marketing Website
Public website.
Purpose:
AI Visibility score check
lead generation
pricing
onboarding
report requests
This already exists.

2. Internal Admin OS (MOST IMPORTANT)
This is the operational brain of the company.
Used internally by the Genessa team.
Purpose:
manage clients
manage AI agents
manage audits
manage sprints
review outputs
approve/reject tasks
monitor progress
generate reports
This must be built FIRST.

3. Client Portal
Simplified dashboard for clients.
Clients can:
see reports
see scores
track progress
view completed tasks
view roadmap
see sprint progress
Clients should NOT see:
internal logs
agent chains
internal prompts
task orchestration

4. AI Agent Engine
Backend AI workforce system.
Purpose:
execute tasks
analyze websites
generate outputs
create recommendations
support consulting workflows
Agents do NOT run continuously. Agents are task-based workers.
Flow: Task → Agent Executes → Output Saved → Human Review

CLIENT LIFECYCLE
STEP 1 — Free AI Visibility Score
User enters domain.
System generates:
basic AI visibility score
simple findings
quick recommendations
This is lead generation only.

STEP 2 — Detailed Audit Request
Client requests detailed audit.
This creates:
lead record
audit workflow
proposal preparation process

STEP 3 — AI Visibility Audit
AI agents execute:
technical analysis
schema analysis
entity analysis
content analysis
AI citation analysis
competitor benchmarking
Results are collected internally.

STEP 4 — Strategy Proposal
System generates:
3-month roadmap
6-month roadmap
12-month roadmap
target score progression
sprint structure
pricing proposal
Human reviews proposal before sending.

STEP 5 — Client Payment & Activation
Once client approves:
client becomes ACTIVE
sprint system begins
recurring optimization workflow starts

STAGE 1 — CORE DASHBOARD / INTERNAL ADMIN OS
This stage contains NO advanced AI orchestration yet.
Purpose: Build the operational foundation.
The system must function even without AI agents.

OBJECTIVES
Build:
internal dashboard
task system
client lifecycle system
sprint management
approvals
reporting infrastructure
scalable architecture

REQUIRED PAGES
Dashboard
Overview page.
Must show:
active clients
pending approvals
active audits
running tasks
sprint progress
AI visibility averages
recent activity

Leads
Stores free-score users and audit requests.
Fields:
domain
sector
email
score
created_at
audit_requested

Audits
Tracks detailed audit processes.
Status examples:
Pending
In Progress
Waiting Review
Completed

Proposals
Stores strategic plans and pricing proposals.
Includes:
roadmap
pricing
target scores
duration
proposal status

Active Clients
Operational client management area.
Includes:
current score
current sprint
roadmap progress
assigned sector pack

Sprints
Weekly operational system.
Each sprint includes:
goals
assigned tasks
assigned agents
progress tracking
approvals

Tasks
Core operational task system.
Fields:
task title
task type
sector
priority
status
assigned agent
output
approval state

Reports
Stores:
audit reports
weekly reports
executive summaries
client deliverables

Agents
Internal AI workforce monitoring.
Shows:
available agents
current tasks
status
performance
last outputs

Approvals
Human review queue.
All AI outputs requiring approval appear here.
Buttons:
approve
reject
rerun

STAGE 1 ARCHITECTURE
Frontend:
Next.js
Tailwind CSS
Backend:
Python FastAPI
Database:
PostgreSQL or Supabase
Requirements:
modular architecture
reusable components
scalable database design
clean SaaS UI
responsive design
IMPORTANT: Do NOT build complex AI orchestration yet.

STAGE 2 — EDU SECTOR PACK
This is the FIRST sector intelligence pack.
Purpose: Create a professional AI Visibility framework specialized for universities and educational institutions.
This pack contains:
EDU logic
EDU scoring
EDU task generation
EDU schema intelligence
EDU entity intelligence
EDU sprint logic

EDU PACK OBJECTIVES
The system must understand:
academic websites
educational authority
research entities
academic citation systems
university content structures
educational schema requirements
This is NOT generic SEO.
It is educational-sector AI Visibility consulting intelligence.

EDU FRAMEWORK
The EDU framework is based on:
PHASE 1 — Technical Foundation
schema
llms.txt
robots.txt
OG tags
indexing
canonical
CWV

PHASE 2 — Entity Authority
Wikidata
Wikipedia
ROR
Google Scholar
ResearchGate
rankings

PHASE 3 — Content Authority
answer-first structure
faculty pages
glossary
FAQ
research pages
EEAT

PHASE 4 — AI Citation Optimization
AI mentions
Reddit
Quora
AI Overviews
Perplexity visibility

EDU SCORING SYSTEM
The scoring system must evaluate:
Technical Score
schema coverage
llms.txt
indexing
OG tags
technical SEO

Entity Score
Wikidata
Wikipedia
ROR
authority consistency

Content Authority Score
faculty pages
FAQ
glossary
answer-first structure
research coverage

AI Citation Score
AI mentions
AI visibility
AI overview presence

EDU AGENTS
EDU Schema Agent
Responsibilities:
analyze educational schemas
detect missing schema
generate JSON-LD
validate structured data
Must know:
CollegeOrUniversity
Course
EducationalOccupationalProgram
Person
Event
FAQ
Breadcrumb
Output:
findings
severity
implementation recommendations
JSON-LD examples

EDU Entity Agent
Responsibilities:
analyze academic entities
validate sameAs structure
check Wikidata/Wikipedia consistency
monitor authority signals
Must know:
Wikidata
Wikipedia
ROR
QS/THE
Google Scholar
ResearchGate

EDU Content Authority Agent
Responsibilities:
analyze content structure
analyze EEAT
analyze faculty structures
detect topical gaps
recommend authority content

EDU Sprint Manager
Responsibilities:
generate weekly sprint plans
prioritize tasks
follow EDU framework sequencing
Example: Weeks 1-2: technical foundation
Weeks 3-4: entity authority
Months 2-3: content authority
Months 4+: AI citation optimization

HOW THE SYSTEM WORKS
Client Added
Sector selected: EDU
↓
System Loads EDU Pack
↓
EDU Agents Become Available
↓
Audit Tasks Generated
↓
Agents Execute Tasks
↓
Outputs Saved
↓
Human Review
↓
Proposal Generated
↓
Client Activation
↓
Weekly Sprint System Starts

IMPORTANT PRODUCT PRINCIPLES
1. Human-in-the-loop
AI never auto-deploys changes without review.

2. Modular Architecture
Each sector pack must be isolated and expandable.

3. Scalable Workforce Design
Agents are specialized workers, not one giant AI.

4. Workflow-first
The system is primarily an operational consulting platform.
AI is a layer on top of the workflow.

FUTURE SECTOR PACKS
Future packs:
Restaurant
SaaS
Hotel
E-Commerce
B2B
Local Business
Each sector pack contains:
sector framework
scoring logic
specialized agents
sprint logic
authority sources
schema logic
citation systems

LONG TERM VISION
Genessa should evolve into: an AI-native consulting operating system that manages:
audits
AI workforce
sector intelligence
sprint execution
reporting
AI visibility optimization
long-term authority growth
