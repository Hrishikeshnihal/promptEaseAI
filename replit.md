# PromptEase AI

A beginner-friendly tool that turns plain-language app ideas into polished React + Tailwind UIs in seconds. The user types a prompt, picks a few guided options, and watches the AI plan, generate, and clean a complete component — previewed live in a sandboxed iframe.

## Architecture

This is a `pnpm` monorepo with two main artifacts plus a mockup sandbox:

- `artifacts/promptease` — React + Vite frontend (web app on path `/`).
- `artifacts/api-server` — Express API server (path `/api`).
- `artifacts/mockup-sandbox` — Internal design-tool sandbox.

Shared workspace libraries:

- `lib/api-spec` — Single source of truth: `openapi.yaml` is hand-written; Orval generates the React Query client and Zod schemas.
- `lib/api-client-react` — Generated typed client + React Query hooks (`useBuildUi`, `useEditUi`).
- `lib/api-zod` — Generated runtime Zod schemas used by the server for request validation.
- `lib/integrations-gemini-ai` — Replit-managed Gemini AI client (used as the planner).

## AI pipeline (multi-provider)

1. **Gemini 2.5-flash → planner.** Reads the user's idea + options, returns a structured `UiPlan` JSON (sections, components, dummy data, visual style). Code: `artifacts/api-server/src/lib/gemini.ts`.
2. **Groq (`llama-3.3-70b-versatile`) → generator.** Turns the plan into a full React + Tailwind component. Called via raw fetch to `https://api.groq.com/openai/v1/chat/completions`. Code: `artifacts/api-server/src/lib/groq.ts`.
3. **Ollama (`qwen2.5-coder`) → cleaner + last-resort fallback.** Best-effort pass that fixes syntax/formatting; if Ollama is unreachable the cleaner is a silent no-op. If Groq fails entirely, Ollama is also tried as a fallback generator. Code: `artifacts/api-server/src/lib/ollama.ts`.

The orchestration lives in `artifacts/api-server/src/routes/ai.ts`. AI endpoints are unauthenticated.

> Note: `OLLAMA_BASE_URL` is currently `http://localhost:11434`, which is not reachable from the Replit container. The cleaner step quietly skips, and the fallback path returns a 502 with a clear error message. Update this URL (e.g. an ngrok tunnel of your local Ollama) to enable the cleaner + fallback.

## Auth + storage (Firebase, client-side)

Authentication and project storage are handled entirely from the browser via the Firebase Web SDK — no backend session, no Postgres.

- `artifacts/promptease/src/lib/firebase.ts` — initializes the Firebase app, exports `auth` and `db` (Firestore).
- `artifacts/promptease/src/hooks/useAuth.ts` — `useAuth()` hook with `loginWithEmail`, `signupWithEmail` (sends verification email), `loginWithGoogle`, `logout`.
- `artifacts/promptease/src/lib/firestore-projects.ts` — Firestore CRUD over the `projects` collection (`listProjects`, `getProject`, `createProject`, `deleteProject`). Each doc is keyed by `userId`.
- `artifacts/promptease/src/pages/login.tsx` — combined sign-in / sign-up page with Google sign-in.

**Required Firebase console setup:** in the Firebase project, go to **Authentication → Settings → Authorized domains** and add the Replit dev domain (and the production domain after deployment) so popup login works. Also enable the Email/Password and Google providers under **Authentication → Sign-in method**.

You should also publish Firestore security rules that restrict `projects` to the owning `userId`, e.g.:
```
match /projects/{id} {
  allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}
```

## Data flow

1. User submits prompt + options → `POST /api/ai/build`.
2. Server runs **Gemini plan → Groq generate → Ollama clean** and returns `{ plan, code }`.
3. Frontend renders `code` inside a sandboxed iframe via `srcDoc` (React + Tailwind + Babel via CDN).
4. Optional: user types an edit instruction → `POST /api/ai/edit` returns updated code.
5. Authenticated users can save runs to Firestore (`projects` collection) and reload them later — all client-side, no API call.

## Common commands

- `pnpm install` — install workspace deps.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate React Query client + Zod schemas after editing `openapi.yaml`.
- `pnpm --filter @workspace/promptease run typecheck` — typecheck the frontend.
- `pnpm --filter @workspace/api-server run typecheck` — typecheck the backend.

## Environment

- `GEMINI_API_KEY` — Gemini planner.
- `GROQ_API_KEY` — Groq code generator.
- `OLLAMA_BASE_URL` — base URL of an Ollama server with `qwen2.5-coder` available.
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase web config (loaded at build time by Vite).

The legacy Replit Auth (`SESSION_SECRET`, `REPL_ID`, `ISSUER_URL`) and `DATABASE_URL` are no longer used by the app.
