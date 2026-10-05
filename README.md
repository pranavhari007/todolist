# ToDoList — Offline-First Personal Productivity PWA

> **ToDoList** is a personal, offline-first productivity Progressive Web App for managing tasks, reminders, calendars, categories, analytics, and productivity workflows.

[![CI](https://github.com/your-username/ToDoList/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/ToDoList/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646cff.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple.svg)](https://web.dev/progressive-web-apps/)

---

## 🌟 Key Features

- 📊 **Productivity Dashboard**: Empirical metrics calculated directly from task data — completion percentage, velocity trends, active streak counters, and weekly summary charts.
- 📝 **Full Task Management**: Title, description, notes, due date, 12-hour AM/PM time picker, priority levels (Low, Medium, High, Urgent), and customizable categories.
- 🔁 **Recurrence Engine**: Supports Daily, Weekly (with weekday selection), Monthly (with month-end edge case protection), and Custom intervals.
- ☑️ **Subtasks & Progress Tracking**: Subtask checklists with parent progress bars. Completing a parent task completes subtasks without destroying structure.
- 📅 **Interactive Calendar**: Month, Week, and Day calendar views with direct date-click task creation and configurable week-start day (Sunday or Monday).
- 🔔 **In-App Reminders & Snooze**: Real-time timer scheduler with Snooze options (5, 10, 15 minutes), Dismiss, or instant completion.
- 🔊 **Web Audio Synthesizer**: Procedural alarm sounds (`Chime`, `Digital`, `Soft Bell`, `Marimba`) synthesized via the browser's Web Audio API — zero external sound files required.
- 📈 **Analytics & Visualizations**: Category breakdown donut chart, completion trend line chart, priority bar chart, and weekly activity metrics via Recharts.
- 🎨 **Personalization & Themes**: Seamless Light, Dark, and System theme modes with customizable widget layouts.
- 💾 **JSON Backup Export & Import**: Complete state serialization with import preview and duplicate ID conflict merging.
- 📲 **Installable PWA & Offline Support**: Web App Manifest and Service Worker caching for seamless offline usage on desktop and mobile.

---

## 🗺️ Navigation & Routes

The application features 8 dedicated routes managed via client-side routing:

| Route | View | Description |
|-------|------|-------------|
| `/` | **Dashboard** | Metrics overview, velocity stats, priority charts, and today's schedule |
| `/tasks` | **Tasks** | Complete task list with multi-column filtering, search, sorting, and bulk actions |
| `/calendar` | **Calendar** | Visual calendar with Month, Week, and Day views |
| `/reminders` | **Reminders** | Centralized view of all active, upcoming, and triggered reminder alerts |
| `/analytics` | **Analytics** | Graphical productivity trends, category distribution, and completion velocity |
| `/completed` | **Completed** | Archive of completed tasks with completion timestamps and restoration options |
| `/categories` | **Categories** | Category manager to add, edit, recolor, or remove task tags |
| `/settings` | **Settings** | Preferences for theme, week start, default views, sound selection, and JSON backups |

---

## 🏗️ Tech Stack

- **UI Library**: React 18
- **Language**: TypeScript 5 (Strict type checking)
- **Bundler & Dev Server**: Vite 5
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React (`lucide-react`)
- **Charts**: Recharts (`recharts`)
- **Date Calculation**: `date-fns`
- **Testing**: Vitest + React Testing Library + JSDOM
- **Audio Synthesis**: Native Web Audio API (`AudioContext`)
- **Storage**: Native Browser `LocalStorage` API

---

## 🔒 Privacy & Server-Free Architecture

ToDoList is strictly **server-free and client-side only**:

```text
User Browser
   ↓
Local Storage (`todolist_app_data_v1`)
   ↓
ToDoList Application Engine
```

- ❌ **No Login or Registration** required.
- ❌ **No Cloud Database** or remote backend server.
- ❌ **No Analytics or Telemetry** trackers.
- 🔒 **100% Data Ownership**: Your tasks remain inside your browser's local storage.

---

## ⚠️ Reminder Limitations & Browser Constraints

Because ToDoList operates without a remote push notification server:
1. **Active Browser Session**: Reminders trigger reliably while the web application tab is active in your browser.
2. **Background Execution**: Browser power management policies may throttle JavaScript timers when tabs are minimized or inactive.
3. **Browser Permission**: System notifications require user approval via the browser's native notification prompt.
4. **Device Sleep / Closed Browser**: Reminders will not sound if your device is asleep or the browser is completely closed.

See [`docs/reminders.md`](docs/reminders.md) for full technical documentation.

---

## 📱 PWA Installation Guide

### Android (Chrome / Edge)
1. Open ToDoList in Chrome or Edge.
2. Tap the **Install App** prompt banner at the bottom of the screen, or select **Add to Home screen** from the browser menu.

### iPhone / iPad (Safari)
1. Open ToDoList in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Scroll down and select **Add to Home Screen**.

### Desktop (Windows / macOS / Linux)
1. Open ToDoList in Chrome, Edge, or Brave.
2. Click the **Install** icon in the browser address bar, or click **Install App** in the navigation bar.

---

## 🚀 Quick Start & Development Commands

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Typecheck & Tests
```bash
# Run TypeScript type check
npm run typecheck

# Run test suite via Vitest
npm run test
```

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

---

## 📂 Project Structure

```text
ToDoList/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── pull_request_template.md
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── architecture.md
│   ├── development.md
│   └── reminders.md
├── public/
│   ├── icons/
│   │   └── icon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── calendar/
│   │   ├── charts/
│   │   ├── common/
│   │   ├── layout/
│   │   └── tasks/
│   ├── context/
│   │   └── AppContext.tsx
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   │   ├── audio/
│   │   ├── backup/
│   │   ├── notifications/
│   │   ├── scheduler/
│   │   └── storage/
│   ├── styles/
│   ├── test/
│   ├── types/
│   └── utils/
├── .env.example
├── .gitignore
├── index.html
├── LICENSE
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Ensure tests and typechecks pass (`npm run typecheck && npm run test`).
5. Push to the branch (`git push origin feature/AmazingFeature`).
6. Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
