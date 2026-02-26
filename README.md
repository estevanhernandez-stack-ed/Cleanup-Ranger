# 🌳 Cleanup Ranger

Welcome to **Cleanup Ranger**, a community-driven, gamified environmental tracking application focused on civic engagement and community features. This platform empowers citizens to report park hazards, coordinate community cleanups, and organize rallies—all enhanced by Google's powerful **Gemini AI** models for image analysis, hazard verification, and automated testing (which comes with a fun "Parks & Rec" tester persona!).

## 🌟 Key Features

- **Territory Radar (Google Maps Integration)**: View your local area, check park integrity, and register undocumented territories.
- **AI-Powered Hazard Scanning**: Utilize your device camera to snap photos of litter or damage. Gemini AI analyzes the photo to determine severity and extract context.
- **Cleanup Verification**: After cleaning a site, take an "after" photo. Gemini AI verifies the cleanup and awards community points!
- **Squadding & Gamification**: Foursquare-style check-ins, leaderboards, "Green Guardian" squads, and merit badges.
- **Autonomous Playwright AI Agents**: We have built autonomous "tester" and "data generator" agents that navigate the app and pre-fill demo data using `gemini-3.1-pro-preview`.

---

## 🚩 Feature Flags (`src/lib/featureFlags.ts`)

Cleanup Ranger utilizes a robust feature flag system to toggle experimental or incomplete features on and off safely. You can modify these flags in `src/lib/featureFlags.ts`.

| Flag Name                  | Default State | Description                                                                                                       |
| -------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ENABLE_SQUADS`            | `true`        | Toggles the visibility of the "Manage Squad" and gamified squad components on the map sidebar.                    |
| `ENABLE_ACTIVITY_FEED`     | `true`        | Enables the historical timeline of Check-ins, Hazards, and Rallies on individual Park Pages.                      |
| `ENABLE_HEATMAP`           | `true`        | Toggles a Google Maps Visualization Heatmap layer indicating areas with high concentrations of uncleared hazards. |
| `ENABLE_LEADERBOARD`       | `false`       | _WIP_: Global territory leaderboards comparing different user stats.                                              |
| `ENABLE_BUSINESS_BOUNTIES` | `false`       | _WIP_: Sponsored cleanups where local businesses offer rewards for verified cleanups.                             |

---

## 🤖 AI Testing Agents

We utilize Playwright combined with Gemini to create "Agents" that navigate the site autonomously.

1. **The "Leslie" Explorer Agent** (`npm run test:explorer`)
   - Located at `e2e/ai-explorer.spec.ts`.
   - Driven by `gemini-3.1-pro-preview`.
   - Injected with a "Parks & Rec" tester persona. It takes screenshots, decides what to click/type, and evaluates the UX.

2. **The Data Generator Agent** (`npm run test:datagen`)
   - Located at `e2e/ai-data-generator.spec.ts`.
   - Automatically navigates the map, targets a park, and uploads realistic fixture photos (located in `e2e/fixtures`) to simulate hazard and cleanup reports for demo purposes.

---

## 🚀 Technology Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Vanilla CSS with modern glassmorphism UI, Lucide React (Icons)
- **Map engine**: `@react-google-maps/api`
- **AI Integration**: `@google/generative-ai` (Gemini 3 Flash & 3.1 Pro previews)
- **Database Backend**: Firebase Firestore (`lib/db.ts`)
- **E2E Testing / Agents**: Playwright

## 🛠️ Getting Started

### 1. Prerequisites

Ensure you have Node.js installed, as well as a valid `.env` file containing your Google Maps, Firebase, and Gemini AI credentials:

```env
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key
# ... Firebase config
```

### 2. Installation

```bash
npm install
```

### 3. Running Locally

```bash
npm run dev
```

### 4. Running the App Build

```bash
npm run build
npm run preview
```
