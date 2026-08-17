# Greenstar Telehealth

A field-first telehealth platform connecting community health workers (LHV / Nurse / CMW), remote doctors, administrators, program managers, and the public — for real-time consultations, vitals capture, emergency response, and NGO program reporting.

Built as a **mobile-first PWA**. Premium, accessible, bilingual (English + Urdu), with full light/dark themes.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — custom design system ("Green-forward, refined")
- **Supabase** — PostgreSQL + Auth + Realtime + Storage + Row-Level Security
- **Framer Motion** (animation), **Lucide** (icons), **TanStack Query** (data)
- **React Hook Form + Zod** (forms/validation), **next-intl** (i18n)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

### Database

Run `supabase/migrations/0001_foundation.sql` in your Supabase project's **SQL Editor**
(roles, profiles, patient registry, audit log, and RLS policies).

## Project structure

```
app/            App Router routes ((auth), role areas), layout, providers
components/ui/  Design-system primitives (Button, Input, Card, StatusPill…)
components/     Theme provider, patterns
lib/            Supabase clients, validation, utils
supabase/       SQL migrations
docs/           PRD (v3) and foundation plan
```

## Roadmap

Delivered module by module: **Foundation → Patient Registry → Appointments & Vitals →
Notifications → Video & Emergency → Notes → Prescriptions & Labs → Maps → Camps →
Reporting → Public & polish.** See `docs/Greenstar-Telehealth-PRD-v3.md`.
