# ToDoList Architecture Documentation

## Overview

ToDoList is designed as a **server-free, offline-first Progressive Web Application (PWA)**. All user data resides strictly within the user's browser via the native `LocalStorage` API. There are no remote backend servers, external databases, cloud synchronization services, or authentication endpoints.

---

## Technical Stack

- **Framework**: React 18 with TypeScript (Strict mode)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom CSS Theme Variables
- **Icons**: Lucide React (`lucide-react`)
- **Charts**: Recharts (`recharts`)
- **Date Utilities**: `date-fns`
- **Audio**: Web Audio API (`AudioContext`)
- **Test Framework**: Vitest + React Testing Library + JSDOM
- **PWA**: Web App Manifest + Custom Service Worker (`sw.js`)

---

## State & Data Flow Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                     React UI Layer                      │
│ (Pages: Dashboard, Tasks, Calendar, Reminders, etc.)    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    AppContext Provider                  │
│       - React State management                          │
│       - Operations (add, edit, complete, delete, etc.)  │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  localStorageService Layer   │ │   reminderScheduler Layer    │
│  - Storage key:              │ │   - Active interval timers   │
│    `todolist_app_data_v1`    │ │   - Web Audio API synthesizer│
│  - Atomic saving & schema    │ │   - Browser Notifications API│
│    validation / migration    │ │   - In-app alert modal       │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## Storage Schema & Persistence

All application data is encapsulated in a single JSON structure persisted under the LocalStorage key `todolist_app_data_v1`:

```typescript
interface AppData {
  version: number;
  tasks: Task[];
  categories: Category[];
  settings: AppSettings[];
}
```

### Key Rules:
1. **Atomic Writes**: Any state modification in `AppContext` immediately triggers a serialized write to LocalStorage.
2. **Schema Validation**: On initial application load, `localStorageService` validates incoming JSON against the expected schema structure. If malformed, default fallback initial state is hydrated safely without crashing.
3. **ID Generation**: Identifiers use timestamp + random string hashes (`task_${Date.now()}_${rand}`) guaranteeing uniqueness during imports and merges.
