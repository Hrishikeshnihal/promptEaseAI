# ⚡ PromptEase AI

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini 2.5](https://img.shields.io/badge/AI_Planner-Gemini%202.5%20Flash-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Groq LLaMA](https://img.shields.io/badge/AI_Generator-Groq%20LLaMA%203.3%2070B-F55036?style=for-the-badge)](https://groq.com/)
[![Firebase](https://img.shields.io/badge/Auth%20%26%20Database-Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

> **PromptEase AI** is an intelligent full-stack web application that translates natural-language UI concepts into clean, interactive React components styled with Tailwind CSS in seconds.

---

## 🏗️ Multi-Model AI Generation Pipeline

PromptEase utilizes a distributed, multi-provider AI pipeline combining best-in-class reasoning, ultra-fast generation, and syntax formatting:

```
                  ┌─────────────────────────────────────┐
                  │          User Prompt & Input        │
                  │ ("Build a Crypto Portfolio Tracker")│
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Stage 1: Structured Architecture Planner (Google Gemini 2.5 Flash)    │
│ • Deconstructs requirements into a typed `UiPlan` JSON                 │
│ • Defines component hierarchy, mock state, dummy data & styling tokens│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Stage 2: High-Speed Component Synthesis (Groq LLaMA 3.3 70B Versatile) │
│ • Converts `UiPlan` specifications into complete React component code │
│ • Inlines full Tailwind CSS utility classes and interactive hooks     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Stage 3: Code Formatting & Fallback Engine (Ollama Qwen 2.5 Coder)    │
│ • Performs AST cleaning, syntax error elimination & edge-case linting │
│ • Acts as automated offline fallback if remote generation is limited  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Stage 4: Sandboxed Interactive Live Preview (Browser Iframe)          │
│ • Renders generated code inside a secure `srcDoc` iframe sandbox      │
│ • Client-side Firebase Firestore persistence for saved projects       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- 💬 **Natural Language to UI:** Express app ideas casually; receive production-ready React component code.
- ⚡ **Sub-Second Streaming & Generation:** Powered by Groq's high-throughput LPU inference engines.
- 🔄 **Conversational Iterative Refinement:** Ask for modifications (`"make it dark mode"`, `"add search bar"`) using the `POST /api/ai/edit` endpoint.
- 🖥️ **Zero-Reload Iframe Sandbox:** Instant client-side runtime preview rendering JSX, Tailwind CSS, and Lucide icons without server-side bundle steps.
- 🔐 **Client-Side Auth & Cloud Storage:** Authenticate via Email/Password or Google Sign-In; store and reload projects seamlessly in Cloud Firestore.
- 📐 **End-to-End Type Safety:** OpenAPI 3.0 specification (`lib/api-spec/openapi.yaml`) generates Orval typed React Query hooks and runtime Zod schemas.

---

## 📁 Monorepo Workspace Structure

Managed via `pnpm` workspaces:

```text
promptEaseAI/
├── artifacts/
│   ├── promptease/           # React 18 + Vite frontend application (served on /)
│   ├── api-server/           # Express REST API orchestrating LLM calls (served on /api)
│   └── mockup-sandbox/       # Internal rapid UI prototyping sandbox
├── lib/
│   ├── api-spec/             # OpenAPI 3.0 specification and Orval codegen configs
│   ├── api-client-react/     # Auto-generated React Query hooks (useBuildUi, useEditUi)
│   ├── api-zod/              # Auto-generated runtime Zod schemas for request validation
│   └── integrations-gemini/  # Gemini AI client wrapper
├── pnpm-workspace.yaml       # Workspace package linking
└── package.json              # Root workspace build and dev scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- (Optional) [Ollama](https://ollama.com/) with `qwen2.5-coder` model installed for local cleaning/fallback.

### 1. Clone & Install
```bash
git clone https://github.com/Hrishikeshnihal/promptEaseAI.git
cd promptEaseAI
pnpm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or in `artifacts/api-server/` and `artifacts/promptease/`):

```env
# AI Model API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Local Cleaner / Fallback (Optional)
OLLAMA_BASE_URL=http://localhost:11434

# Firebase Client Configuration (Frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Launch the Application
```bash
# Start both frontend and backend concurrently
pnpm run dev

# Or start individually:
pnpm run dev:backend    # Starts Express API at http://localhost:8080
pnpm run dev:frontend   # Starts Vite Dev Server at http://localhost:5173
```

---

## 🛠️ Common Development Commands

```bash
# Regenerate typed React Query hooks and Zod schemas from openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Run TypeScript checks across all workspace artifacts
pnpm run typecheck

# Build all production bundles
pnpm run build
```

---

## 👤 Author

**Hrishikesh Nihal**
- GitHub: [@Hrishikeshnihal](https://github.com/Hrishikeshnihal)
- Email: nihalhrishikesh@gmail.com
