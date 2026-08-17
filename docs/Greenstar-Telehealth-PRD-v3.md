# Greenstar Telehealth — Product Requirements Document (v3, Unified & Superior)

**Document owner:** Product Team
**Status:** Draft for review
**Version:** 3.0
**Date:** 17 August 2026
**Supersedes:** v1 (competitor requirements) and v2 (internal requirements)

> **Purpose of this document.** This PRD unifies *every* capability from the two earlier requirement sets, closes the functional and workflow gaps found in both, tightens the system into one coherent product, and removes anything redundant or over-specified. It is written to be built — each feature is scoped with clear behaviour and acceptance criteria — and to be shown to donors and NGO leadership as evidence of a mature, field-ready digital-health platform.

---

## 1. Executive Summary

Greenstar Telehealth is a **field-first digital health platform** that connects community health workers (LHV / Nurse / CMW), remote doctors, program administrators, and the general public into a single real-time system. It lets a health worker in a remote village capture a patient's condition — vitals, history, voice, location — and instantly reach an available doctor for a video consultation, a clinical note, or an e-prescription, even over weak connectivity.

Beyond individual care, it is an **NGO program-management platform**: it tracks field coverage on a map, runs community health camps, measures emergency response times, and produces donor-ready reports automatically.

What makes v3 better than both prior documents:

1. **A real patient record, not just appointments.** A longitudinal Patient Registry ties every visit, vital, note, and prescription to one identity — the foundation both prior PRDs were missing.
2. **Closed-loop clinical workflow.** Consultation → **e-prescription** → **lab/diagnostic request** → follow-up → outcome. The earlier PRDs stopped at "notes."
3. **Reliable emergency routing.** A claim-and-lock assignment model plus a defined escalation chain (online doctors → SMS fallback → on-call supervisor), so an emergency is never dropped or double-handled.
4. **Bilingual, low-literacy-friendly UX** (English + Urdu, voice-first patterns) — essential for the real users and absent from both prior versions.
5. **Privacy & consent built in** (CNIC is sensitive PII), with audit, retention, and export controls.
6. **Interoperability path** (DHIS2 / FHIR-lite export) so program data can flow into national and donor health systems.
7. **A premium, consistent design system** across web and mobile, in both light and dark, tuned for low-end Android in the field.

---

## 2. Vision, Objectives & Success Metrics

### 2.1 Vision
Bring timely, high-quality medical decision-making to the last mile — where a trained doctor is hours away but a phone and a health worker are not.

### 2.2 Product objectives
- **O1 — Speed of care:** minimise time from "patient in distress" to "doctor on a call."
- **O2 — Continuity of care:** every patient interaction is captured and retrievable over time.
- **O3 — Reach & equity:** work on cheap Android phones, over 2G/3G, in Urdu and regional languages.
- **O4 — Program accountability:** give managers and donors trustworthy, automatic evidence of impact.

### 2.3 Success metrics (KPIs)
| KPI | Target |
|---|---|
| Median emergency response time (creation → doctor accepts) | ≤ 60 seconds |
| Median emergency time-to-call-start | ≤ 120 seconds |
| Notification delivery delay (push) | < 3 seconds |
| Emergency notifications successfully delivered (push or SMS) | ≥ 99% |
| Appointment completion rate | ≥ 90% |
| App usable on devices with ≤ 2 GB RAM | 100% of core flows |
| Offline-captured records that auto-sync without loss | 100% |

---

## 3. Users, Roles & Permissions

### 3.1 Personas
- **Provider (LHV / Nurse / CMW)** — a field health worker. Often on a low-end phone, intermittent data, may be low-literacy in English. Needs speed and simplicity.
- **Doctor** — a remote clinician, on web or mobile, handling many cases. Needs rich patient context fast and strong triage tools.
- **Admin (System Administrator)** — manages accounts, security, and system health.
- **Program Manager** *(new, see 3.3)* — owns camps, coverage, reports, and donor deliverables. Read-heavy, not a technical admin.
- **Public User** — a member of the public self-registering with CNIC to book their own consultations.

### 3.2 Role capability matrix
| Capability | Provider | Doctor | Admin | Program Mgr | Public |
|---|:--:|:--:|:--:|:--:|:--:|
| Register patients & record vitals/history | ✅ | — | — | — | own self |
| Create appointment (emergency/regular) | ✅ | — | — | — | own self |
| Receive & accept emergency calls | ✅ (receive) | ✅ (initiate) | — | — | — |
| Conduct video consultation | facilitate | ✅ | — | — | join |
| Write clinical note / voice note | ✅ | ✅ | — | — | ✅ |
| Write e-prescription | — | ✅ | — | — | — |
| Request lab/diagnostic; upload results | request via note | ✅ | — | — | upload own |
| Online/Offline duty toggle | ✅ | ✅ | — | — | — |
| Manage camps & log camp activity | log | — | oversee | ✅ | — |
| View coverage map & field analytics | own visits | — | ✅ | ✅ | — |
| Reports & donor exports | — | — | ✅ | ✅ | — |
| Manage users, roles, passwords | — | — | ✅ | — | — |
| View audit logs | — | — | ✅ | view | — |
| System/security settings | — | — | ✅ | — | — |

> **Enforcement:** All permissions are enforced at the **database level via Row-Level Security (RLS)**, not only in the UI. The frontend hides what a role can't do; the database refuses what a role shouldn't do.

### 3.3 Why a separate "Program Manager" role
Both prior PRDs folded program/donor functions into "Admin." In NGOs these are different people: Admin is IT/security; the Program Manager owns impact reporting and camps. Splitting them keeps least-privilege (a reporting user shouldn't be able to reset passwords) and matches how the organisation actually works. Admin retains a superset and can act as Program Manager if needed.

---

## 4. Product Scope

### 4.1 In scope (v3)
Authentication & onboarding · Patient Registry · Appointments & triage · Real-time notifications · Video consultation · Clinical notes (text + voice) · **E-prescriptions** · **Lab/diagnostic requests** · Vitals monitoring & trends · Online/Offline duty · Geo-tagging & coverage maps · Camps & events · Reporting & donor analytics · Admin & user management · CNIC public registration · Consent & privacy · Offline-first sync · Bilingual UX · PWA (web) + React Native (mobile).

### 4.2 Out of scope (v3) — explicitly deferred
- Payments / billing / insurance claims.
- Pharmacy inventory & dispensing logistics (only prescription *authoring* is in scope).
- Full EHR/HL7 integration with hospitals (we ship an **export path**, not live bidirectional integration).
- AI diagnosis. (Transcription and summarisation assistance are optional aids, never diagnostic.)

### 4.3 Removed / simplified from prior PRDs
- **Hard "auto-refresh every 5 seconds"** as a design requirement → replaced by **realtime subscriptions**, with 5-second polling kept only as a *fallback* on degraded connections. (Constant polling drains battery and data on field phones.)
- **Fixed UI counts** ("23+ appointments visible", "27+ specialties") treated as guidance, not requirements — lists are paginated/virtualised.
- **Separate one-off patient data on every appointment** → replaced by a **reusable patient record** to avoid re-typing and to enable history/trends.

---

## 5. Information Architecture & Data Model

Core entities (conceptual; implemented in PostgreSQL/Supabase with RLS):

- **User** — id, role, name, phone, specialty (doctors), duty_status, created_by, is_active.
- **Patient** — id, MRN, CNIC (encrypted, optional for minors), name, age/DOB, gender, contact, language, created_by. *One patient, many appointments.*
- **Appointment / Case** — id, patient_id, created_by (provider/public), type (emergency|regular), specialty, status (pending|claimed|in_consult|completed|cancelled), assigned_doctor_id, geo (lat/lng), camp_id (nullable), consent_id, timestamps.
- **VitalSet** — id, patient_id, appointment_id, BP sys/dia, HR, temp(°F/°C), SpO2, hemoglobin, blood sugar, captured_at, captured_by. *Time-series → enables trends.*
- **Note** — id, appointment_id, author_id, kind (text|voice), body/audio_ref, transcript (nullable), created_at. *Thread per appointment.*
- **Prescription** — id, appointment_id, doctor_id, items[] (drug, dose, frequency, duration, instructions), advice, follow_up_date, created_at, signed.
- **LabRequest** — id, appointment_id, doctor_id, tests[], status (requested|resulted), result_files[], result_note.
- **Consent** — id, patient_id, appointment_id, type, granted_by, method, timestamp.
- **Camp / Event** — id, type, title, date_range, location(geo), team[], expected_turnout, actual_turnout, counters{}, photos[], notes, status.
- **Notification** — id, user_id, type, payload, channel (push|sms|in-app), delivered_at, ack_at, read_at.
- **AuditLog** — id, actor_id, action, entity, before/after, timestamp, ip/device.

**Key relationships:** Patient 1—* Appointment 1—* {VitalSet, Note, Prescription, LabRequest}; Appointment *—1 Camp (optional); Appointment 1—1 Consent.

---

## 6. Feature Requirements

Each module lists behaviour and **acceptance criteria (AC)**.

### 6.1 Authentication & Onboarding
- Role-based login: Provider / Doctor / Admin / Program Manager / Public.
- Staff (Provider/Doctor/Admin/PM) accounts are **admin-created** (no open staff self-signup).
- Public self-registration via **13-digit CNIC** (format-validated, unique) + flexible username + password.
- JWT sessions, 8-hour expiry; Bcrypt password hashing.
- Forgot-password flow (secure reset link/OTP to registered phone).
- **Optional 2FA (OTP)** for Admin and Doctor roles (recommended, configurable).
- First-run **guided onboarding** for field workers: language pick, permission grants (mic, location, notifications), a 60-second interactive tour.

**AC:** Invalid CNIC (≠13 digits or duplicate) is rejected with a clear message · A logged-out user cannot reach any authenticated screen · Sessions expire and refresh cleanly without data loss on a submitted-but-unsynced form.

### 6.2 Patient Registry *(gap closed)*
- Providers register a patient once; subsequent visits reuse the record.
- Search/lookup by CNIC, MRN, name, or phone before creating a new record (prevents duplicates).
- Patient profile shows: demographics, **vitals trend charts**, appointment history, prescriptions, lab results, notes timeline.
- Public users implicitly have a patient record tied to their CNIC.

**AC:** Creating an appointment offers "find existing patient" first · Duplicate CNIC is caught · A doctor opening a case sees the patient's prior visits and vital trends.

### 6.3 Appointment & Case Management
**Provider / Public can:** create an appointment for a patient, mark **Emergency** or **Regular**, attach history (text and/or **voice note**), record **6 vitals**, select from **27+ specialties**, auto geo-tag location, and track status.

**Doctor can:** view a **prioritised queue** (emergencies first, then by wait time), filter by status/specialty/urgency, open full patient context, **claim** a case, and move it through its lifecycle.

**Admin/PM can:** monitor all cases, delete completed/cancelled, view stats.

**Triage & queue (improved):** cases are ordered by (1) emergency flag, (2) time waiting, (3) specialty match to online doctors. Each case shows a live "waiting for X:XX" timer.

**Assignment & locking (gap closed):** the first doctor to **Accept/Claim** an emergency locks it; others see "Being handled by Dr. ___." If the claiming doctor doesn't start the call within a timeout, the case returns to the pool and re-broadcasts.

**AC:** Two doctors cannot both claim the same emergency · An unclaimed emergency re-enters the queue after timeout · Status transitions follow pending → claimed → in_consult → completed (or cancelled) and are audit-logged.

### 6.4 Real-Time Notification System
- Instant push (Facebook/Instagram-style), delivered even when app is **closed** (FCM mobile / Service Worker web).
- Click-to-open the exact case from the notification.
- Rich content: patient summary, vitals, urgency.
- **Colour-coded types:** 🔴 Emergency (persistent) · 🔵 Regular · 🟢 Incoming video call (Accept/Decline) · ⚪ New note · 🟡 Status update · 🟣 Prescription/lab result ready.
- Multi-device (unlimited devices/user).
- **SMS fallback** for emergencies unacknowledged within a configurable window (e.g., 30–60s) — critical for weak-data areas.
- **Escalation chain (improved):** online doctors → SMS to on-roster doctors → alert on-call supervisor/Program Manager, so an emergency is never silently dropped.
- Notification panel: filter tabs **All / Calls / Appointments / Unread**, "Mark all as read."
- Honest platform note: web push on iOS Safari has OS limits; **SMS fallback is the guaranteed channel** for emergencies.

**AC:** An emergency with no ack in the window triggers SMS · Delivery + ack + read are all timestamped in the notification record · Tapping a call notification opens the ringing screen directly.

### 6.5 Video Consultation
- One-tap call initiation for emergencies; Jitsi Meet (browser-based, no download).
- Doctor auto-assigned as moderator.
- Full-screen **WhatsApp-style incoming call** UI with ringtone, Accept/Decline.
- HD video + screen share; mobile & desktop; all modern browsers.
- Call history + re-dial.
- **Low-bandwidth auto-fallback:** detects weak links and drops to audio-only / reduced resolution rather than dropping the call.
- **Optional consultation recording** (only with captured consent) for medico-legal record; stored securely, access-controlled.
- **In-call context panel:** doctor sees vitals/history beside the video without leaving the call.

**AC:** Consent state is checked before any recording · On a throttled connection the call degrades instead of ending · Call start/end and participants are logged for response-time metrics.

### 6.6 Clinical Documentation — Notes (text + voice)
- Bidirectional, appointment-specific, **chat-style thread**.
- Text notes (1000-char limit) and/or **voice notes**.
- **Voice notes:** record via mic, offline-first (record offline → auto-upload on reconnect), in-app player (play/pause + waveform/duration), max ~2 min, optional **auto-transcription** (Whisper-class) so doctors can read alongside audio.
- Real-time delivery with notification; full per-appointment history retained.

**AC:** A voice note recorded offline uploads automatically on reconnect with no user action · Transcription, when enabled, appears under the audio and is clearly marked "auto-generated."

### 6.7 E-Prescription *(gap closed — new module)*
- Doctors write **structured prescriptions**: medicine, dose, frequency, duration, instructions, plus general advice and an optional follow-up date.
- Common-drug quick-pick + free text; basic duplicate/allergy flag (advisory only).
- Prescription is attached to the appointment, visible to provider/public user, and **exportable/printable as a clean PDF** (bilingual).
- Delivered with a notification; stored in patient history.

**AC:** A prescription renders as a shareable PDF with patient, doctor, date, and items · It appears in the patient's longitudinal record · Only Doctors can author prescriptions.

### 6.8 Lab / Diagnostic Requests *(gap closed — new module)*
- Doctor requests tests (checklist + free text). Provider or public user **uploads results/photos**; doctor is notified when resulted.
- Results attach to the appointment and patient record.

**AC:** A lab request has states requested → resulted · Uploaded result files are viewable in-context · Doctor is notified on result upload.

### 6.9 Vital Signs Monitoring & Trends
- Six parameters: BP, HR, Temperature, SpO2, Hemoglobin, Blood Sugar.
- **Colour-coded** against normal ranges (green normal / orange borderline / red abnormal) with icons.
- **Trend charts across visits** (enabled by the patient registry) — e.g., BP over the last 6 visits.

**AC:** Out-of-range values are visually flagged automatically · Trends render when ≥2 vital sets exist for a patient.

### 6.10 Online / Offline Duty Status
- Doctors & Providers have a visible **On Duty / Off Duty** toggle.
- Only "On Duty" doctors receive emergency routing and appear in the active roster.
- Auto-set to Off Duty after configurable inactivity (prevents stale "online").
- Admin/PM see a **live roster** of who's on duty per role.
- Future: scheduled shift hours with auto-toggle.

**AC:** An emergency routes only to On-Duty doctors · Inactivity flips status to Off Duty · Roster updates in real time.

### 6.11 Geo-Tagging & Coverage Mapping
- Every provider-created appointment auto-captures GPS at creation (accuracy ~20–50 m — sufficient for area/village-level reporting, not pinpoint).
- Admin/PM **live map** (Mapbox/Google Maps): colour-coded pins (red emergency / blue regular), clickable summaries, filters by date/provider/region/specialty.
- **Coverage heat map:** reached vs. underserved areas — for planning and donor reporting.
- Feeds directly into automated reports (6.14).

**AC:** New provider appointments appear as map pins · Heat map reflects density by area · Filters recompute the map.

### 6.12 Camps & Community Events
- Dedicated module for organised outreach (Health Camp, Blood Donation, Vaccination Drive, Awareness Session, other).
- Camp record: type, date/range, location (map picker + geo-tag), team, expected vs. actual turnout, description/partner, status.
- Field staff log: **type-specific counters** (patients seen, blood units, vaccines administered), **photos**, and **linked appointments** created during the camp.
- Admin/PM: camps **calendar** + **map** views; summary stats (camps this quarter, people reached, units/doses); **exportable donor reports**.
- **Light stock tracking** for camp consumables (e.g., vaccine doses available vs. used) — optional per camp.

**AC:** Appointments created during a camp link back to it · Camp counters roll up into quarterly stats · A camp report exports to PDF/Excel.

### 6.13 Admin & User Management
- Create/manage Doctor, Provider, Program Manager accounts; assign roles/specialties.
- Generate/reset passwords; enable/disable/delete accounts.
- Monitor public registrations.
- **Full audit logs** of all create/update/delete actions (actor, entity, before/after, time, device).
- **Device/session management** (view active sessions, force-logout a lost device).
- System/security settings (timeouts, escalation windows, SMS gateway config).

**AC:** Every destructive action is audit-logged · A disabled user cannot authenticate · Admin can force-logout a session.

### 6.14 Reporting & Donor Analytics
- Automated monthly/quarterly reports, exportable **PDF/Excel**:
  - Patients served (region, gender, specialty).
  - **Emergency response metrics** (creation → accept → call start) — logged as first-class from day one.
  - Doctor/provider utilisation & online-time.
  - Geographic coverage + heat map.
  - Camps/events summary (turnout, units).
- **KPI dashboard** for program managers: avg emergency response time, completion rate, active field staff.
- **Interoperability export (new):** structured export aligned to **DHIS2 / FHIR-lite** so program indicators can flow into national/donor systems without manual re-entry.
- Designed to remove manual donor-report compilation.

**AC:** A quarterly report generates without manual data entry · Response-time metric matches audit timestamps · Export produces a valid DHIS2/FHIR-lite payload.

### 6.15 Consent & Privacy
- **Digital consent capture** before consultations (timestamped, tied to the patient/appointment).
- CNIC and health data treated as sensitive PII: **encrypted at rest**, masked in UI (show last 4), access limited by RLS.
- Data **retention policy** and **right-to-erasure** workflow (admin-controlled, audit-logged).
- Consent required before any call recording.

**AC:** No consultation proceeds without a consent record · CNIC is never shown in full to unauthorised roles · Erasure requests are logged and honoured.

### 6.16 CNIC-Based Public Registration
- 13-digit CNIC validation + uniqueness; flexible username; secure encrypted storage; CNIC as public login identifier.

**AC:** Non-13-digit or duplicate CNIC is rejected · CNIC stored encrypted.

---

## 7. End-to-End Workflows

### 7.1 Emergency (improved with routing & escalation)
1. Provider visits patient, records vitals + optional voice note; consent captured.
2. Provider creates **EMERGENCY** appointment (location auto geo-tagged).
3. System broadcasts to **all On-Duty doctors** within 3 s.
4. **First doctor to Accept locks the case**; others see "handled by Dr. ___."
5. If no ack within the window → **SMS fallback** to roster → then **supervisor escalation**.
6. Doctor reviews context and starts the **video call**; provider answers full-screen.
7. Doctor examines, diagnoses, writes **note + e-prescription** (and lab request if needed).
8. Provider carries out instructions; updates status to **Completed**.
9. Response-time metrics logged automatically.

### 7.2 Regular
Provider (or public user) creates a regular case → doctor reviews at convenience → note/prescription → provider communicates to patient → follow-up scheduled if needed.

### 7.3 Public User
Self-register via CNIC → create own appointment → doctor reviews, sends note/prescription → user reads results, asks follow-up questions.

### 7.4 Health Camp
Admin/PM schedules camp → field team runs it, logging counters + photos → appointments during the camp auto-link → camp marked complete → data flows into donor reports.

### 7.5 Offline field capture (new, explicit)
Provider records vitals/history/voice **offline** → data queued locally → on reconnect, **auto-sync** with conflict-safe merge → doctor sees it as normal.

---

## 8. UX / UI & Design System

### 8.1 Principles
- **Premium & consistent:** one design system (tokens for colour, type, spacing) across web + mobile, **light and dark**.
- **Clarity under pressure:** emergencies unmistakable (red, persistent, top of list); primary action always obvious.
- **Low-literacy & bilingual (new):** full **English + Urdu** (RTL-aware), icon-led navigation, voice-first inputs where typing is a barrier.
- **Field-ready:** large touch targets, works one-handed, tolerant of gloves/sunlight (high contrast), data-light mode.
- **Accessible:** WCAG AA contrast, scalable text, screen-reader labels.

### 8.2 Screen inventory
Login · Public Sign-Up · **Patient Registry / Patient Profile** *(new)* · Provider Dashboard · Create Appointment (Provider) · Doctor Dashboard (prioritised queue) · Incoming Video Call · Active Video Call (with context panel) · Notification Panel · **E-Prescription editor & PDF** *(new)* · **Lab Request / Results** *(new)* · Notes/Chat Thread (voice-enabled) · Appointment Details · Online/Offline toggle (component) · Admin Dashboard · Admin – Add/Manage User · **Program Manager Dashboard** *(new)* · Field/Coverage Map (Admin/PM) · Camps List + Calendar · Create/Edit Camp · Camp Details (photos, counters, linked appts) · Reports/Analytics Dashboard · Consent capture (component) · Settings (language, notifications, security).

### 8.3 Design reference
Take visual cues from the referenced medconnect layout, but elevate to a distinct, premium Greenstar identity — calm clinical palette, strong status colours, generous spacing, and a component library reused everywhere.

---

## 9. Technical Architecture

### 9.1 Recommended stack (carried from v2, confirmed)
- **Backend / DB / Auth / Realtime:** Supabase (PostgreSQL + **Row-Level Security** + Realtime).
- **Web app:** Next.js (PWA), hosted on Vercel.
- **Mobile app:** React Native (Expo) — Android priority, then iOS.
- **Push:** Firebase Cloud Messaging (FCM); Service Worker for web.
- **Video:** Jitsi Meet (8x8-hosted initially; self-host option later for data control).
- **Maps:** Mapbox or Google Maps.
- **Voice/audio:** expo-av (record); optional Whisper-class API (transcription).
- **Storage:** Supabase Storage (voice notes, photos, lab files).
- **SMS:** Twilio or a Pakistani SMS aggregator (flag account/budget early).
- **Source control / CI:** GitHub.

### 9.2 Realtime & sync
- Supabase Realtime (WebSocket) for cases/notes/status/roster.
- **5-second polling only as fallback** on degraded links.
- Target push delivery < 3 s.
- **Offline-first**: local queue + background sync (Service Worker / mobile), conflict-safe merge.

### 9.3 Reusability note (from developer guidance)
The **map component** and **file-upload** infrastructure are built once (for geo-tagging) and reused by Camps and lab-result uploads. Build them generic from the start.

---

## 10. Non-Functional Requirements

- **Performance:** core screens interactive < 2.5 s on a low-end Android over 3G; lists virtualised.
- **Availability:** target 99.5%+; graceful degradation offline.
- **Scalability:** unlimited concurrent users; realtime fan-out sized for peak emergency broadcast.
- **Security:** JWT (8 h), Bcrypt, RLS, TLS in transit, encryption at rest for PII/CNIC, full audit logs, optional 2FA for Admin/Doctor, session/device management.
- **Privacy/compliance:** consent-first, data retention + erasure, least-privilege roles, PII masking. (HIPAA-*inspired* practices; align to applicable Pakistani data norms.)
- **Reliability of emergencies:** guaranteed delivery via push→SMS→supervisor escalation.
- **Device support:** Android (low-end priority), iOS, modern desktop browsers.
- **Localisation:** English + Urdu at launch; architecture ready for more regional languages.

---

## 11. Roadmap (revised phases)

| Phase | Scope |
|---|---|
| **P1 — Foundation** | Supabase schema, auth, **RLS for all roles**, Patient Registry, audit logging |
| **P2 — Core clinical (web)** | Provider + Doctor flows: appointments, vitals, notes, **claim/assignment**, patient history/trends |
| **P3 — Realtime + video** | Supabase Realtime + FCM notifications, notification panel, Jitsi video, incoming-call UX |
| **P4 — Emergency reliability** | Online/Offline duty, SMS fallback, escalation chain, response-time metrics |
| **P5 — Rich documentation** | **E-prescriptions**, **lab requests/results**, voice notes (record/store/transcribe), consent capture |
| **P6 — Field intelligence** | Geo-tagging + Admin/PM coverage map + heat map |
| **P7 — Camps & events** | Camps module (counters, photos, linked appts, calendar, light stock) |
| **P8 — Mobile app** | React Native (Provider + Doctor priority), offline-first hardening |
| **P9 — Reporting** | Donor/KPI dashboards, PDF/Excel exports, **DHIS2/FHIR-lite** export |
| **P10 — Public & polish** | Public PWA self-service, bilingual/low-literacy polish, accessibility, performance hardening |

MVP = P1–P4 (a working emergency telehealth loop); P5–P7 = the NGO differentiators; P8–P10 = scale, reporting, reach.

---

## 12. Risks, Assumptions & Dependencies

| Risk / Assumption | Mitigation |
|---|---|
| Weak/unreliable field connectivity | Offline-first capture, SMS fallback, low-bandwidth video |
| iOS web-push limitations | SMS is the guaranteed emergency channel; native app for iOS later |
| SMS gateway cost/setup lead time | Flag and procure account early (P4 dependency) |
| CNIC/health data sensitivity | Encryption at rest, RLS, masking, consent, retention/erasure |
| Low-literacy users struggle with text | Voice-first inputs, icon UI, Urdu localisation |
| Emergency dropped/double-handled | Claim-lock + escalation chain + timeouts |
| Donor reporting overhead | Automated reports + DHIS2/FHIR-lite export |

---

## 13. What v3 Adds Over v1 and v2 (summary)

**Kept everything** from both, and added: Patient Registry & longitudinal history · vitals **trends** · **e-prescriptions** · **lab/diagnostic requests** · **triage queue + claim/lock assignment** · **escalation chain** beyond SMS · **Program Manager** role · **consent/privacy/retention/erasure** hardening · **bilingual + low-literacy** UX · **accessibility** · **DHIS2/FHIR-lite interoperability** · in-call context panel · optional consultation recording · light camp stock tracking · session/device management + optional 2FA. **Simplified/removed:** rigid 5-second polling (→ realtime + fallback), fixed UI counts, and per-appointment re-entry of patient data (→ reusable patient record).

---

## 14. Glossary
**CMW** Community Midwife · **LHV** Lady Health Visitor · **CNIC** Computerised National Identity Card (13-digit) · **RLS** Row-Level Security · **FCM** Firebase Cloud Messaging · **PWA** Progressive Web App · **DHIS2** District Health Information System 2 · **FHIR** Fast Healthcare Interoperability Resources · **MRN** Medical Record Number · **KPI** Key Performance Indicator.

---

*End of PRD v3.*
