# MASTER PROMPT — THERMOWATCH

You are a senior product designer + frontend engineer. Build a polished, production-quality frontend for **ThermoWatch**, an AI-powered geospatial intelligence platform for detecting, classifying, and monitoring industrial fires and persistent thermal sources using satellite thermal data.

The project is being developed for **Smart India Hackathon (SIH) Problem Statement 26162**:

> **AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data**

The system should feel like a serious **geospatial intelligence / disaster-management platform**, not a generic SaaS dashboard.

---

# 1. CORE PRODUCT IDEA

Satellite systems such as NASA FIRMS can detect thermal anomalies, but a thermal anomaly alone does not explain what is happening.

ThermoWatch combines:

* NASA FIRMS thermal anomaly data
* Satellite imagery
* OpenStreetMap / industrial infrastructure data
* Land-cover/contextual information
* Historical thermal behavior / baseline
* AI-based classification

to identify and monitor different types of thermal activity.

The platform should help users distinguish between:

* Industrial Fire
* Gas Flare
* Persistent Thermal Source
* Agricultural Burning
* Natural / Forest Fire
* Unknown Anomaly

The goal is to turn raw satellite thermal detections into **actionable geospatial intelligence**.

---

# 2. TARGET USERS

Design the product for three major user groups:

### Government / Disaster Management

Need:

* situational awareness
* emergency detection
* incident history
* critical infrastructure monitoring

### Industrial Operators

Need:

* monitoring around facilities
* abnormal thermal activity
* historical thermal baseline
* incident investigation

### Researchers / Analysts

Need:

* historical detections
* classification information
* spatial context
* facility metadata
* thermal trends

The UI should communicate credibility and operational usefulness.

---

# 3. OVERALL VISUAL DIRECTION

Create a **dark, sophisticated geospatial command-center interface**.

Think:

**NASA Earth observation + Palantir-style intelligence interface + modern GIS dashboard**

Avoid:

* generic startup gradients
* excessive neon
* overly colorful dashboards
* excessive glassmorphism
* cartoon-like icons
* huge decorative illustrations
* excessive animations

The interface should feel:

* precise
* calm
* technical
* trustworthy
* data-driven
* operational
* modern

### Color direction

Use a dark navy / charcoal foundation.

Suggested visual hierarchy:

* Background: very dark navy / charcoal
* Primary surfaces: slightly lighter navy
* Borders: subtle blue-gray
* Text: off-white rather than pure white
* Secondary text: muted blue-gray
* Primary accent: restrained teal
* Thermal warning accent: muted amber/orange
* Critical alert: restrained red
* Positive/normal: muted green

IMPORTANT:

Do NOT make every component highly saturated.

Thermal colors should have meaning:

* Red = high-risk industrial fire
* Amber = gas flare / moderate anomaly
* Yellow = persistent thermal source
* Green = natural / lower-risk activity
* Gray = unknown

Keep these colors relatively muted and use them only where they communicate information.

---

# 4. APPLICATION STRUCTURE

There are exactly **4 major pages**:

```text
/
├── /dashboard
├── /site/:id
└── /alerts
```

Do NOT create a separate methodology page.

The application consists of:

1. Landing Page
2. Dashboard
3. Site Detail / Facility History
4. Alerts / Incident Log

---

# 5. GLOBAL NAVIGATION

The application should have a consistent navigation system.

## Landing page navigation

Top navbar:

* ThermoWatch logo
* Home
* Solution
* Impact
* About
* **Open Dashboard**

Primary CTA:

**Open Dashboard →**

Secondary CTA:

**Explore the Platform**

---

## Dashboard / application navigation

Once inside the application, use a persistent sidebar.

Sidebar:

```text
ThermoWatch

⌂ Dashboard
◉ Alerts
⌖ Sites
⌁ Analytics

────────────

⚙ Settings
```

The sidebar should clearly indicate the current page.

Top application bar:

* Search location / facility / coordinates
* Date range
* notification indicator
* user/avatar

The dashboard should feel like one coherent application rather than separate pages.

---

# 6. PAGE 1 — LANDING PAGE

Route:

```text
/
```

Purpose:

Explain what ThermoWatch does and provide the entry point into the actual monitoring system.

---

## HERO

Use a large satellite/map visual focused on India.

The map should contain subtle thermal anomaly points.

Hero copy:

### Small label

`SIH PS 26162`

### Main headline

**Detect. Classify. Prevent.**

Alternative supporting line:

**See the Heat. Understand the Threat.**

### Description

AI-powered detection and classification of industrial fires and persistent thermal sources using NASA FIRMS, OpenStreetMap and satellite data.

### CTAs

Primary:

**Open Live Dashboard →**

Secondary:

**Learn More**

Add subtle floating map intelligence:

```text
THERMAL ANOMALY

Lat: 22.57° N
Long: 88.36° E

Confidence: 92%
Likely: Industrial Fire
```

This establishes immediately that the product is actually analyzing satellite detections.

---

# 7. LANDING PAGE — VALUE PROPOSITION

Create a section explaining the fundamental problem.

Headline:

**Satellite sensors can see the heat.
But heat alone doesn't tell you what's happening.**

Explain that thermal anomaly systems can detect heat but distinguishing industrial fires, gas flaring, agricultural burning, natural fires and persistent industrial sources requires contextual intelligence.

Then introduce:

**AI + Geospatial Intelligence**

Show a visual pipeline:

```text
NASA FIRMS
     ↓
Thermal Detection
     ↓
Context Fusion
     ↓
AI Classification
     ↓
GIS Intelligence
```

---

# 8. LANDING PAGE — CLASSIFICATION TYPES

Create six compact cards:

### Industrial Fire

Accidental or uncontrolled thermal event in industrial facilities.

### Gas Flare

Routine or abnormal flaring activity.

### Persistent Thermal Source

Repeated / continuous thermal emissions.

### Agricultural Burning

Thermal activity associated with field burning.

### Natural / Forest Fire

Wildfire or natural fire activity.

### Unknown Anomaly

Thermal activity that cannot yet be confidently classified.

Cards should be informative but visually restrained.

---

# 9. LANDING PAGE — WHO IT'S FOR

Three cards:

### Government Agencies

Disaster management, environmental monitoring and policy support.

### Industrial Operators

Refineries, power plants, steel facilities, LNG terminals and other critical infrastructure.

### Researchers & Analysts

Data-driven analysis of thermal activity and spatial patterns.

---

# 10. LANDING PAGE — LIVE MAP PREVIEW

Show a large preview of the actual dashboard.

Headline:

**Real-time insights. Real-world impact.**

Include:

* India map
* thermal anomaly markers
* industrial facility markers
* map legend
* small filters
* detection popup

CTA:

**Open Live Map →**

Clicking this MUST route to:

```text
/dashboard
```

---

# 11. LANDING PAGE — FINAL CTA

End with:

**From thermal anomaly to actionable intelligence.**

Supporting text:

Turning satellite data into intelligence for safer industries, faster response and better environmental monitoring.

CTA:

**Launch the Intelligence Map →**

Route:

```text
/dashboard
```

---

# 12. PAGE 2 — DASHBOARD

Route:

```text
/dashboard
```

This is the primary application.

The dashboard should be the most functional-looking page.

---

## TOP KPI ROW

Display:

```text
128
Thermal Anomalies

27
Industrial Fires

41
Persistent Sources

18
Gas Flares
```

Each card can show a small trend indicator.

Example:

`+12%`

Keep the KPI cards compact.

---

# 13. DASHBOARD — MAIN MAP

The map should dominate the screen.

Show India with satellite imagery.

Markers should represent different classifications.

Example:

* red → Industrial Fire
* amber → Gas Flare
* yellow → Persistent Source
* green → Agricultural / Natural
* gray → Unknown

When a user clicks a detection marker, show a popup:

```text
Thermal Anomaly

Lat: 22.57° N
Long: 88.36° E

Detected:
Oct 7, 2024 · 14:32

Confidence:
92%

Classification:
Industrial Fire

View Details →
```

Clicking:

**View Details →**

must navigate to:

```text
/site/:id
```

---

# 14. DASHBOARD — FILTER PANEL

Include:

### Anomaly Type

* All
* Industrial Fire
* Gas Flare
* Persistent Source
* Agricultural Burning
* Natural / Forest Fire
* Unknown

### Confidence

Slider:

`0% — 100%`

### Date Range

Date picker.

### Region

Dropdown:

`All India`

Include:

**Reset Filters**

The filters should visually affect the displayed mock data.

Even if there is no real backend yet, the frontend should behave as though the filtering system is functional.

---

# 15. DASHBOARD — RECENT DETECTIONS

Below the map, add a compact table:

| Time | Location | Type | Confidence | Action |
| ---- | -------- | ---- | ---------- | ------ |

Example records:

```text
Oct 7, 14:32 | Jamnagar, Gujarat | Industrial Fire | 92% | View
Oct 7, 11:08 | Korba, Chhattisgarh | Persistent Source | 87% | View
Oct 7, 09:21 | Paradip, Odisha | Gas Flare | 83% | View
Oct 6, 22:17 | Singrauli, MP | Industrial Fire | 78% | View
```

Every `View` action should route to the relevant site detail page.

Add:

**View All →**

which routes to:

```text
/alerts
```

---

# 16. PAGE 3 — SITE DETAIL

Route:

```text
/site/:id
```

This is the investigation page for one facility.

Example facility:

**Reliance Industries — Jamnagar Refinery**

Header:

```text
Reliance Industries — Jamnagar Refinery

Jamnagar, Gujarat
22.44° N · 70.07° E

● Operational
```

Navigation:

```text
Overview
Thermal Activity
Satellite Imagery
OSM Data
History
```

These can be tabs within the same page.

---

# 17. SITE DETAIL — FACILITY INFORMATION

Show a facility information card:

```text
Facility Information

Name
Reliance Industries Ltd.

Type
Petroleum Refinery

OSM ID
123456789

Address
Jamnagar, Gujarat, India

Operator
Reliance Industries

Status
Operational

Land Use
Industrial
```

Add:

**View on OpenStreetMap →**

This should be presented as external-source context, not a fake internal feature.

---

# 18. SITE DETAIL — LATEST DETECTION

Prominent card:

```text
Latest Detection

Oct 7, 2024 · 14:32

Confidence
92%

Classification
Industrial Fire
```

Use a subtle warning state.

---

# 19. SITE DETAIL — THERMAL BASELINE

This is one of the most important pages for demonstrating technical depth.

Create a large chart:

**Thermal Activity — Last 30 Days**

Plot:

* Thermal radiance
* Historical baseline

The chart should visually demonstrate normal behavior with occasional spikes.

Example:

```text
Thermal Radiance
──────────────╮
              │      ╭╮
──────────────┴──────╯╰──────
             Baseline
```

Show a callout:

```text
Peak: 156 MW
+271% above baseline
```

This communicates why the system can identify abnormal behavior rather than simply displaying raw FIRMS points.

---

# 20. SITE DETAIL — RECENT CLASSIFICATIONS

Table:

| Date | Type | Confidence | Radiance | Notes |
| ---- | ---- | ---------- | -------- | ----- |

Example:

```text
Oct 7 | Industrial Fire | 92% | 156 MW | High thermal activity
Oct 3 | Persistent Source | 78% | 64 MW | Above baseline
Sep 28 | Gas Flare | 81% | 98 MW | Regular flaring pattern
Sep 21 | Persistent Source | 76% | 61 MW | Continuous activity
Sep 14 | Normal | 68% | 40 MW | Within baseline
```

---

# 21. PAGE 4 — ALERTS / INCIDENT LOG

Route:

```text
/alerts
```

This page should communicate:

**This system is operationally usable.**

Headline:

**Alerts & Incident Log**

Subtitle:

A chronological record of flagged thermal anomalies and potential incidents.

---

# 22. ALERT SUMMARY

Top filter cards:

```text
All
128

Industrial
27

Gas Flare
18

Persistent
41

Others
42
```

---

# 23. ALERT FILTERS

Include:

* Search
* Date range
* Severity
* Status
* Classification

Example statuses:

* Open
* Monitoring
* Investigating
* Closed

Severity:

* High
* Medium
* Low

---

# 24. ALERT TABLE

Create a dense but readable operational table:

| Date & Time | Location | Type | Severity | Status | Action |
| ----------- | -------- | ---- | -------- | ------ | ------ |

Example:

```text
Oct 7, 14:32
Jamnagar, Gujarat
Industrial Fire
High
Open
View

Oct 7, 11:08
Korba, Chhattisgarh
Persistent Source
Medium
Monitoring
View

Oct 7, 09:21
Paradip, Odisha
Gas Flare
Medium
Open
View

Oct 6, 22:17
Singrauli, MP
Industrial Fire
High
Open
View

Oct 6, 16:04
Visakhapatnam, AP
Unknown
Low
Investigating
View
```

Clicking `View` should navigate to:

```text
/site/:id
```

---

# 25. USER FLOW

The complete user journey must be obvious.

```text
                     LANDING PAGE
                          │
                          │ Open Dashboard
                          ▼
                     DASHBOARD
                    /dashboard
                     │       │
          click site │       │ View All
                     ▼       ▼
                SITE DETAIL  ALERTS
                 /site/:id   /alerts
                     ▲          │
                     │          │ View
                     └──────────┘
```

More explicitly:

### Flow 1

```text
/
↓
Open Dashboard
↓
/dashboard
```

### Flow 2

```text
/dashboard
↓
Click thermal anomaly
↓
/site/:id
```

### Flow 3

```text
/dashboard
↓
View All
↓
/alerts
```

### Flow 4

```text
/alerts
↓
View incident
↓
/site/:id
```

### Flow 5

```text
/site/:id
↓
Back to Dashboard
↓
/dashboard
```

---

# 26. ROUTING REQUIREMENTS

Implement actual frontend routing.

Routes:

```text
/
 /dashboard
 /site/:id
 /alerts
```

Navigation must work everywhere.

Do NOT make buttons that visually look clickable but do nothing.

Every major CTA should have a destination.

---

# 27. DATA MODEL

Create realistic mock data so the interface feels alive.

Example:

```js
thermalDetection = {
  id,
  latitude,
  longitude,
  timestamp,
  classification,
  confidence,
  radiance,
  severity,
  status,
  facilityId
}
```

Facility:

```js
facility = {
  id,
  name,
  type,
  operator,
  location,
  coordinates,
  osmId,
  landUse,
  status,
  baseline,
  detections
}
```

Incident:

```js
incident = {
  id,
  detectionId,
  timestamp,
  location,
  classification,
  confidence,
  severity,
  status
}
```

Keep the mock data centralized so the same detection can appear consistently across Dashboard, Site Detail and Alerts.

---

# 28. IMPORTANT UX PRINCIPLE

The four pages must feel like **one product**.

Do not design them as four independent landing-page concepts.

Use:

* same sidebar
* same typography
* same map language
* same cards
* same spacing
* same buttons
* same data colors
* same interaction patterns

The Landing Page can be more visual and marketing-oriented.

The other three pages should feel like a professional operational application.

---

# 29. RESPONSIVENESS

Desktop is the primary target because this is a geospatial monitoring platform.

Optimize for:

```text
1440 × 900
1920 × 1080
```

But make the UI responsive.

On smaller screens:

* sidebar collapses
* map remains usable
* tables become horizontally scrollable
* cards stack
* filters become a drawer

---

# 30. MICRO-INTERACTIONS

Use subtle animations only.

Examples:

* thermal markers gently pulse
* hover state on map detections
* cards slightly elevate on hover
* page transitions are subtle
* sidebar active state transitions smoothly
* charts animate when loaded
* filters update results smoothly

Avoid excessive animation.

This is an intelligence platform, not a marketing animation website.

---

# 31. MAP EXPERIENCE

Maps are one of the core selling points.

Use realistic satellite/map imagery where possible.

The UI should visually communicate:

```text
Satellite imagery
        +
Thermal detections
        +
Industrial facilities
        +
Classification
        =
Geospatial intelligence
```

The map should never feel like a decorative background.

It is the central product surface.

---

# 32. ICONOGRAPHY

Use a consistent professional icon library such as Lucide.

Do not use random emojis as interface icons.

Icons should be:

* simple
* thin/medium weight
* consistent
* functional

---

# 33. TYPOGRAPHY

Use a modern technical sans-serif.

Suggested:

* Inter
* Geist
* Manrope

Use strong hierarchy:

```text
Page title
Section title
Card title
Body
Metadata
```

Avoid oversized typography inside the application.

---

# 34. COMPONENT ARCHITECTURE

Create reusable components.

Suggested:

```text
components/
├── Navbar
├── Sidebar
├── Map
├── ThermalMarker
├── DetectionPopup
├── KPI Card
├── FilterPanel
├── DetectionTable
├── FacilityCard
├── ThermalChart
├── ClassificationBadge
├── SeverityBadge
├── StatusBadge
└── PageHeader
```

Do not duplicate UI code across pages.

---

# 35. LANDING PAGE VS APPLICATION

IMPORTANT distinction:

### Landing page

Purpose:

**Explain → Build trust → Enter platform**

### Dashboard

Purpose:

**Monitor → Filter → Detect → Investigate**

### Site Detail

Purpose:

**Investigate → Understand baseline → Review history**

### Alerts

Purpose:

**Review → Prioritize → Track incidents**

Each page must have a distinct job.

---

# 36. SIH DEMO STORY

The frontend should support this demo narrative:

```text
1. Start at Landing Page
        ↓
2. Explain that satellite systems detect heat
        ↓
3. Show that ThermoWatch adds contextual AI classification
        ↓
4. Open Dashboard
        ↓
5. Show live thermal detections across India
        ↓
6. Click an industrial-fire detection
        ↓
7. Open Site Detail
        ↓
8. Show facility information + OSM context
        ↓
9. Show thermal baseline and abnormal spike
        ↓
10. Open Alerts
        ↓
11. Show chronological incident history
        ↓
12. Demonstrate that this can support operational monitoring
```

The UI should make this story extremely easy to demonstrate to SIH judges.

---

# 37. WHAT NOT TO DO

Do NOT:

* create a methodology page
* create unnecessary pages
* use excessive neon colors
* use giant gradients
* use generic AI brain graphics
* use random stock illustrations
* make every card colorful
* overload the dashboard
* make the map secondary
* create fake functionality that cannot be interacted with
* use lorem ipsum
* make the UI look like a generic admin panel
* create disconnected page designs

---

# 38. FINAL QUALITY BAR

The finished frontend should look like a real product that could be shown to:

* NTRO
* government agencies
* industrial operators
* disaster-management teams
* technical judges

A judge should immediately understand:

**What is this?**

→ A satellite-powered thermal intelligence platform.

**What problem does it solve?**

→ It distinguishes industrial thermal events from other thermal anomalies.

**How do I use it?**

→ Open the dashboard → inspect detections → investigate facilities → review incidents.

**Why is it technically meaningful?**

→ It combines satellite thermal data with geospatial context, industrial infrastructure and historical behavior.

---

# 39. BUILD PRIORITY

Prioritize in this order:

### P0 — Core

* routing
* landing page
* dashboard
* site detail
* alerts
* consistent navigation

### P1 — Product realism

* interactive map
* filters
* detection popups
* realistic mock data
* thermal charts
* tables

### P2 — Polish

* transitions
* hover states
* responsive behavior
* loading states
* empty states
* subtle animations

Do not sacrifice functionality for visual effects.

---

# FINAL INSTRUCTION

Build the complete frontend as **one cohesive ThermoWatch product**.

Start with the Landing Page, then connect it to the Dashboard, then connect detections to Site Detail and Alerts.

The final experience should feel like:

**Satellite Data → AI Classification → Geospatial Intelligence → Operational Decision**

Do not ask for unnecessary clarification. Make sensible product/design decisions and implement the complete experience.
