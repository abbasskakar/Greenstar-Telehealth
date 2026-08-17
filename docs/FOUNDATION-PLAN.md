# Greenstar Telehealth — Foundation Plan

**Goal:** Build the shared foundation that every module sits on — done once, done right — so the app is production-grade and each later module drops in cleanly without rework.

**Approach:** Modular delivery on a solid shared base. This document covers only the **Foundation**. Modules (appointments, video, notes, prescriptions, camps, reports, etc.) follow, one at a time — build → test → deploy → next.

---

## 1. Final Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | One codebase for web + PWA, server actions, great DX, Vercel-native |
| Styling | **Tailwind CSS v4** + custom design tokens | Fast, consistent, our own premium system (not a template) |
| UI primitives | **Radix UI** (accessible headless) + our own components | Accessibility (WCAG AA) for free, full visual control |
| Animation | **Framer Motion** | Smooth springs, incoming-call pulse, page transitions; respects reduced-motion |
| Icons | **Lucide** + **Phosphor** (curated set) | Premium, consistent stroke; medical additions |
| Backend / DB | **Supabase** — PostgreSQL + Auth + Realtime + Storage + RLS | Realtime, row-level security, storage, auth in one place |
| Data fetching | **TanStack Query** + Supabase client | Caching, optimistic updates, offline-friendly |
| Forms | **React Hook Form + Zod** | Type-safe validation (CNIC, vitals ranges) |
| i18n | **next-intl** (English + Urdu, RTL-aware) | Bilingual from day one |
| PWA | **Serwist** (Workbox) service worker | Offline-first, installable, background sync |
| Push (later) | Firebase Cloud Messaging | App-closed notifications |
| Video (later) | Jitsi Meet (8x8 JaaS) | Browser-based HD calls |
| Maps (later) | Mapbox GL | Coverage map + heat map |
| Hosting / CI | **Vercel** + GitHub | Auto-deploy on push, preview URLs |

> These finalize the open choices from PRD v3. Nothing here needs to change per module.

---

## 2. Architecture Overview

```
  ┌────────────────────────────────────────────────────────┐
  │  Client — Next.js PWA (mobile-first)                    │
  │  · React UI + our design system + Framer Motion         │
  │  · TanStack Query cache  · Service Worker (offline)     │
  └───────────────┬───────────────────────┬────────────────┘
                  │ HTTPS / WSS            │ (later) FCM push
                  ▼                        ▼
  ┌────────────────────────────────────────────────────────┐
  │  Supabase                                               │
  │  · PostgreSQL (all data)   · Row-Level Security         │
  │  · Auth (JWT, roles)       · Realtime (WebSocket)       │
  │  · Storage (voice, photos, lab files)                   │
  └────────────────────────────────────────────────────────┘
                  │ (later, per module)
                  ▼
  External: FCM (push) · SMS gateway · Mapbox · Jitsi · Whisper
```

**Security principle:** every table has RLS ON. The frontend hides what a role can't do; **the database refuses what a role shouldn't do.** No trust in client-side checks alone.

---

## 3. Repository Structure

```
greenstar-telehealth/
├─ app/                      # Next.js App Router
│  ├─ (auth)/                # login, sign-up, forgot-password
│  ├─ (provider)/            # provider screens
│  ├─ (doctor)/              # doctor screens
│  ├─ (admin)/               # admin + program-manager
│  ├─ (public)/              # public user screens
│  └─ api/                   # route handlers / server actions
├─ components/
│  ├─ ui/                    # design-system primitives (Button, Card, Pill, VitalCard…)
│  ├─ layout/                # AppShell, BottomNav, Sidebar, TopBar
│  └─ patterns/              # composed blocks (AppointmentCard, EmptyState…)
├─ lib/
│  ├─ supabase/              # client + server + middleware
│  ├─ auth/                  # role helpers, CNIC login
│  ├─ validation/            # Zod schemas (cnic, vitals…)
│  └─ i18n/                  # next-intl config
├─ messages/                 # en.json, ur.json (translations)
├─ styles/                   # tokens.css (design system), globals
├─ supabase/                 # migrations (SQL), RLS policies, seed
├─ public/                   # icons, manifest, service worker
└─ types/                    # shared TypeScript types
```

---

## 4. Database Foundation (initial schema)

Only the tables the foundation needs. Modules add their own later (appointments, vitals, notes, prescriptions, camps…).

```sql
-- Roles
create type user_role as enum ('provider','doctor','admin','program_manager','public');
create type duty_status as enum ('on_duty','off_duty');

-- Profiles (extends Supabase auth.users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null,
  full_name   text not null,
  phone       text,
  specialty   text,                    -- doctors
  duty        duty_status default 'off_duty',
  is_active   boolean default true,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- Patients (longitudinal record — the core both prior PRDs missed)
create table patients (
  id          uuid primary key default gen_random_uuid(),
  mrn         text unique,             -- human-friendly medical record no.
  cnic_hash   text unique,             -- CNIC hashed for lookup
  cnic_enc    text,                    -- CNIC encrypted at rest (never returned raw)
  full_name   text not null,
  dob         date,
  gender      text,
  contact     text,
  language    text default 'en',
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- Audit log (first-class from day one)
create table audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles(id),
  action      text not null,           -- create | update | delete | login …
  entity      text not null,
  entity_id   text,
  meta        jsonb,
  created_at  timestamptz default now()
);
```

**RLS example (role helper + a policy):**
```sql
-- Reusable helper: current user's role from their profile
create or replace function auth_role() returns user_role
language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

alter table patients enable row level security;

-- Admins/PMs see all; providers see patients they created; public sees only self
create policy patients_read on patients for select using (
  auth_role() in ('admin','program_manager')
  or created_by = auth.uid()
);
```

---

## 5. Authentication Strategy (5 roles)

- **Supabase Auth** issues JWTs; the user's `role` lives in their `profiles` row and is stamped into the JWT via a custom claim for fast checks.
- **Staff (Provider / Doctor / Admin / Program Manager):** created by an Admin — no open self-signup. Admin sets email + temp password; user changes it on first login.
- **Public users:** self-register with **13-digit CNIC** + flexible username + password. Internally the CNIC maps to a Supabase auth identity (a deterministic synthetic email keyed to the CNIC), so "Continue with CNIC" resolves the CNIC → identity → sign-in behind the scenes. CNIC is validated (exactly 13 digits) and unique.
- **Sessions:** JWT with 8-hour expiry (per PRD), secure refresh, forgot-password flow. Optional 2FA (OTP) for Admin/Doctor added later.
- CNIC is **never stored or transmitted in plain text** — hashed for lookup, encrypted at rest, masked in UI.

---

## 6. Design System Foundation ("Green-forward, refined")

Built once as `styles/tokens.css` + `components/ui/*`, used everywhere. Full **light + dark** via CSS variables.

- **Palette (starting point — will be tuned):** deep evergreen primary, a warm supporting neutral, green-biased greys, and clear semantic status colours (emergency red, accepted blue, pending amber, success green) plus a signature "live/pulse" accent.
- **Typography:** a characterful-but-legible display face for headings + a clean body face + **tabular mono for vitals/numbers**.
- **Core components (v1 set):** Button, Input, Select, Card, StatusPill, VitalCard, Avatar, Badge, BottomNav (with raised primary action), TopBar, Sidebar (admin), Modal/Sheet, Toast, Skeleton, EmptyState, Tabs.
- **Motion language:** spring page/sheet transitions, incoming-call pulse rings, subtle live-vitals animation, skeleton loaders — all gated by `prefers-reduced-motion`.
- **Signature moments:** "vitals pulse ring," an **Emergency Mode** that visibly transforms the UI, and offline/sync indicators.
- **Mobile-first:** large touch targets, one-handed reach, high contrast for sunlight, RTL for Urdu.

---

## 7. App Shell, i18n & PWA

- **App shell:** role-aware layout — bottom nav for Provider/Doctor/Patient (mobile), sidebar for Admin/PM (desktop).
- **i18n:** next-intl with `en` + `ur`, RTL flipping, language switch in settings + onboarding.
- **PWA:** installable manifest, offline shell, background sync queue (foundation for offline-first vitals/voice later), theme-color for light/dark.

---

## 8. Environment & Deployment

- **Env vars** (in `.env.local`, never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only, secret), plus a `CNIC_ENCRYPTION_KEY`.
- **CI/CD:** push to GitHub → Vercel auto-builds → preview URL per branch, production on `main`.
- **Migrations:** SQL versioned in `supabase/migrations/` so the database is reproducible.

---

## 9. Foundation Build Checklist (ordered)

1. Scaffold Next.js + TypeScript + Tailwind, repo structure, push to GitHub.
2. Connect Supabase; run foundation migrations (profiles, patients, audit_log) + RLS.
3. Implement Auth: staff login, CNIC public login, sign-up, forgot-password, role routing.
4. Build the design system: tokens (light+dark) + core `ui` components + motion.
5. Build the app shell: role-aware nav, i18n (en/ur + RTL), PWA base.
6. Wire Vercel deploy; verify a live URL with working login for each role.
7. **Foundation done** → begin Module 1 (Patient Registry + Admin/User management).

---

## 10. Accounts & Keys You Need to Provide

I cannot create accounts or enter payment details myself — please set these up and share the (non-secret) values; secrets go into env vars locally.

### Needed NOW (all free, no card required)
| Account | Purpose | What to share with me |
|---|---|---|
| **GitHub** | Code repository | Repo access (or I scaffold, you create the repo) |
| **Supabase** | Database, auth, storage, realtime | Project URL + `anon` key (public). Service-role key stays secret in env. |
| **Vercel** | Hosting + auto-deploy | Connect it to the GitHub repo (a few clicks) |

### Needed LATER (per module — I'll remind you before each)
| Account | For module | Notes |
|---|---|---|
| Firebase (FCM) | Notifications | Free |
| SMS gateway (Twilio or a Pakistani aggregator) | Emergency SMS fallback | Paid; needs a card. Procure early — has lead time. |
| Mapbox | Coverage map | Free tier is generous |
| Jitsi / 8x8 JaaS | Video calls | Free tier available |
| Domain name | Production launch | ~$10–15/year |
| OpenAI/Whisper (optional) | Voice-note transcription | Paid; optional |

---

*Foundation first. Everything else clicks into it.*
