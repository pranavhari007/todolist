# ToDoList Reminders & Alarm Architecture

## Overview

The reminder system in ToDoList provides real-time alerts for scheduled tasks without requiring any server-side infrastructure, remote push services, or paid third-party notification providers.

---

## Technical Components

### 1. In-App Scheduler (`src/services/scheduler/reminderScheduler.ts`)
- Runs a background JavaScript timer loop while the application tab is active.
- Checks pending tasks against their calculated reminder ISO timestamps.
- When a reminder matches current local time, triggers:
  1. In-app Alert Modal (`ReminderAlertModal`)
  2. Procedural Web Audio API sound alert
  3. System Notification (if browser permission granted)

### 2. Synthesized Audio (`src/services/audio/soundService.ts`)
- Uses the browser's native **Web Audio API** (`AudioContext`).
- Generates procedural audio tones directly in code:
  - `Chime`: Dual sine wave harmony
  - `Digital`: Crisp square wave beep sequence
  - `Soft Bell`: Frequency-modulated warm tone
  - `Marimba`: Wooden percussion resonance
- No external `.mp3` or `.wav` file assets needed.

### 3. Browser Notifications (`src/services/notifications/notificationService.ts`)
- Wraps the HTML5 Notification API.
- Requests notification permission independently from PWA installation.
- Clicking a system notification focuses the active ToDoList tab.

---

## Technical Limitations & Platform Differences

| Platform | Background Behavior | Sound Behavior |
|----------|---------------------|----------------|
| **Active Browser Tab** | Full real-time reminder triggers | Full Web Audio synthesis |
| **Minimized / Inactive Tab** | Timer accuracy subject to OS/browser tab throttling | Audio playback requires prior user interaction |
| **Closed Browser Window** | Reminders do not trigger (no remote push server) | No audio |
| **iOS Safari** | Requires explicit user interaction to initiate Web Audio | Notifications require PWA installation on iOS 16.4+ |
| **Do Not Disturb Mode** | System suppresses visual banners | Audio may play depending on OS settings |
