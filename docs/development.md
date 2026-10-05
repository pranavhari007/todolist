# ToDoList Developer Guide

## Development Environment Setup

### Prerequisites

- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher

### Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/your-username/ToDoList.git
cd ToDoList
npm install
```

---

## Available NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Starts the Vite local development server (`http://localhost:5173`) |
| `npm run build` | Compiles TypeScript and builds production distribution artifacts in `dist/` |
| `npm run preview` | Serves the production build locally for verification |
| `npm run test` | Executes the Vitest unit & integration test suite once |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run typecheck` | Runs the TypeScript compiler check (`tsc --noEmit`) |

---

## Project Structure Conventions

- **React Components**: Located in `src/components/` (grouped into `common/`, `layout/`, `tasks/`, `calendar/`, `charts/`). Named in `PascalCase`.
- **Page Views**: Located in `src/pages/`. Named in `PascalCasePage.tsx`.
- **Services**: Located in `src/services/` (grouped into `storage/`, `notifications/`, `scheduler/`, `audio/`, `backup/`).
- **Tests**: Located in `src/test/`. Mirror service and utility module structures.

---

## Code Style & Guidelines

- **Strict TypeScript**: Avoid `any` types. Define explicit types/interfaces in `src/types/index.ts`.
- **Formatting**: Use clean indentation (2 spaces) and camelCase for variable/function names.
- **Tailwind CSS**: Utility classes only; custom CSS variables for theme switching located in `src/styles/index.css`.
