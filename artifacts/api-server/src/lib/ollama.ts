import type { UiPlan, UiOptions } from "./gemini";

const OLLAMA_MODEL = "qwen2.5-coder:latest";
const TIMEOUT_MS = 60_000;

function getOllamaUrl(): string | null {
  const url = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL;
  if (!url) return null;
  return url.replace(/\/+$/, "");
}

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOllama(messages: OllamaMessage[], temperature = 0.3): Promise<string> {
  const baseUrl = getOllamaUrl();
  if (!baseUrl) throw new Error("OLLAMA_BASE_URL is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const combinedPrompt = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n");

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: combinedPrompt,
        stream: false,
        options: { temperature },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      response?: string;
    };
    const content = data.response;
    if (!content) throw new Error("Ollama returned empty response");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function stripFences(s: string): string {
  let out = s.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```[a-zA-Z]*\n?/, "");
    if (out.endsWith("```")) out = out.slice(0, -3);
  }
  return out.trim();
}

function deepClean(raw: string): string {
  let out = stripFences(raw);
  out = out.replace(/^\s*import[^\n;]*;?\s*$/gm, "");
  return out.trim();
}

const COMPONENT_RULES = `STRICT RULES:
- Output ONLY raw JSX/JS code. No markdown fences. No prose. No explanations.
- Do NOT use import statements. The component must be a top-level function declaration named exactly "App" and exported as default.
- Do NOT use TypeScript syntax.
- Use Tailwind utility classes for ALL styling.
- React hooks (useState, useEffect, useMemo, useRef, useCallback) are available as globals via React.
- All icons must be inline SVG.
- No external image URLs — use inline SVG illustrations or solid color blocks.
- The output MUST contain: export default function App() {`;

/**
 * Best-effort cleaner pass: takes possibly-messy code from Groq and
 * returns a tidied version. If Ollama is unreachable or fails, we
 * silently return the original code so the pipeline keeps moving.
 */
export async function cleanUi(code: string): Promise<string> {
  if (!getOllamaUrl()) return code;
  try {
    const systemPrompt = `You are a code cleaner. Given a React + Tailwind component, return a tidied, working version.

${COMPONENT_RULES}
- Fix any syntax errors, remove markdown, remove imports/exports, remove TypeScript syntax.
- Do NOT change the visual design or behavior — only fix bugs and clean formatting.`;

    const raw = await callOllama([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Clean this React component:\n\n${code}\n\nReturn the full corrected component including "export default function App() {".` },
    ]);
    const cleaned = deepClean(raw);
    return cleaned.startsWith("function App") ? cleaned : code;
  } catch {
    return code;
  }
}

/**
 * Last-resort fallback: when all higher-quality generators have failed,
 * try to produce a simple working UI from the plan using local Ollama.
 * Throws if Ollama is unreachable.
 */
export async function fallbackGenerateUi(
  plan: UiPlan,
  prompt: string,
  options: UiOptions,
): Promise<string> {
  if (!getOllamaUrl()) {
    throw new Error("Ollama fallback unavailable: OLLAMA_BASE_URL not configured");
  }

  const systemPrompt = `You are a React + Tailwind UI engineer. Produce a completely unique, working UI based directly on the provided plan.
  
${COMPONENT_RULES}
- Build a polished page with header, main content, and footer.
- Use realistic varied dummy data (not "Item 1, Item 2").
- DO NOT generate a generic template. The UI MUST be customized to the user's idea.
- NEVER display the raw user prompt on the screen.`;

  const userPrompt = `Build the React component for this specific plan.

Idea (DO NOT DISPLAY THIS TEXT): "${prompt}"

Theme: ${options.theme}
Layout: ${options.layout}
Target user: ${options.targetUser}

Plan: ${JSON.stringify(plan, null, 2)}

Output only the JSX code starting with "export default function App() {".`;

  const raw = await callOllama([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
  return deepClean(raw);
}

/**
 * Last-resort edit fallback. Throws if Ollama is unreachable.
 */
export async function fallbackRefineUi(code: string, instruction: string): Promise<string> {
  if (!getOllamaUrl()) {
    throw new Error("Ollama fallback unavailable: OLLAMA_BASE_URL not configured");
  }

  const systemPrompt = `You are a React + Tailwind UI engineer editing an existing component.

${COMPONENT_RULES}
- Apply ONLY the requested change while keeping the rest intact.`;

  const userPrompt = `Existing component:
${code}

Edit instruction: ${instruction}

Return the full updated component including "export default function App() {".`;

  const raw = await callOllama([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
  return deepClean(raw);
}
