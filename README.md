# Housework Master

Web app to help users stay on top of household chores with recurring-task management and AI-powered motivational messages.

## Table of Contents

1. [Project Description](#project-description)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started Locally](#getting-started-locally)  
   - [Prerequisites](#prerequisites)  
   - [Installation & Setup](#installation--setup)  
4. [Available Scripts](#available-scripts)  
5. [Running Tests](#running-tests)
6. [Project Scope](#project-scope)  
7. [Project Status](#project-status)  
8. [License](#license)  

---

## Project Description

Housework Master is a modern web application designed to help individuals maintain consistent household routines. It offers:

- Definition and grouping of recurring tasks into “spaces” (rooms)  
- An aggregated dashboard highlighting overdue and upcoming tasks  
- A simple “I’ll do it tomorrow” postponement feature  
- AI-generated motivational messages contextualized to each task name  

By combining straightforward task management with contextual encouragement, Housework Master tackles both forgetting and procrastination.

## Tech Stack

- **Frontend**  
  - Astro 5 
  - React 19  
  - TypeScript 5
  - Tailwind 4
  - Shadcn/ui 

- **Backend**  
  - Supabase (PostgreSQL database, authentication)  

- **AI & Motivation System**  
  - Openrouter.ai (access to OpenAI/Anthropic/Google models, budget controls)  

- **Testing**
  - Vitest (Unit & Integration testing)
  - React Testing Library (Component testing)
  - Playwright (E2E testing)
  - Supabase CLI (Local database environment for testing)

- **CI/CD & Hosting**  
  - GitHub Actions (pipelines)  
  - Cloudflare Pages (Edge Hosting)  

## Getting Started Locally

### Prerequisites

- [Node.js 22.14.0](https://nodejs.org/) (via nvm recommended)  
- A Supabase project with `SUPABASE_URL` & `SUPABASE_KEY`  
- An Openrouter.ai API key (`OPENROUTER_API_KEY`)

### Installation & Setup

```bash
# Clone the repo
git clone https://github.com/OlaStawarz/housework-master.git
cd housework-master

# Use the specified Node version
nvm install
nvm use

# Install dependencies
npm install

# Create a .env file
cat <<EOF > .env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENROUTER_API_KEY=your_openrouter_api_key
EOF
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev`  
  Start the Astro development server.

- `npm run build`  
  Build the production site.

- `npm run preview`  
  Preview the production build locally.

- `npm run astro`  
  Run the Astro CLI.

- `npm run lint`  
  Run ESLint across the codebase.

- `npm run lint:fix`  
  Auto-fix lint errors.

- `npm run format`  
  Format code with Prettier.

## Running Tests

### Unit & Component Tests (Vitest)

Unit tests verify individual functions and React components.

- `npm run test` (or `npm test`)  
  Run all unit tests in headless mode.

- `npm run test:ui`  
  Open the interactive Vitest UI to debug tests.

### End-to-End Tests (Playwright)

E2E tests verify the full application flow in a real browser environment.

- `npm run test:e2e`  
  Run all E2E tests in headless mode.

- `npm run test:e2e:ui`  
  Open the interactive Playwright UI.

> **Note:** E2E tests run against the production build. The test command automatically builds the app and starts the preview server.

## Project Scope

- **User Account Management**  
  - Email/password registration, login, logout, account deletion

- **Space Management**  
  - Create, view, and delete “spaces” (rooms)

- **Task Management**  
  - Add tasks via predefined templates or manually  
  - Edit task frequency (days/months)  
  - Mark tasks as completed and delete them

- **Dashboard & Navigation**  
  - Aggregated “Overdue” and “Upcoming” sections  
  - Chronologically sorted lists  
  - Per-space task view

- **Task Postponement**  
  - “I’ll do it tomorrow” with a maximum of 3 postponements per cycle

- **AI Motivation**  
  - Contextual, AI-generated motivational messages based on task names

## Project Status

🚧 **MVP & Active Development**

This project is currently in its MVP phase.

## License

This project is licensed under the [MIT License](LICENSE).  
