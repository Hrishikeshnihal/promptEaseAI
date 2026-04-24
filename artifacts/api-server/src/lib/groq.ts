import type { UiPlan, UiOptions } from "./gemini";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(messages: GroqMessage[], temperature = 0.85): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("Groq returned empty response");

  return content;
}

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```$/g, "")
    .replace(/```/g, "")
    .trim();
}

function quickClean(raw: string): string {
  return stripFences(raw)
    .replace(/^\s*import .*$/gm, "")
    .replace(/export default function GeneratedApp/g, "export default function App")
    .replace(/function GeneratedApp/g, "function App")
    .trim();
}

const COMPONENT_RULES = `STRICT PREVIEW-SAFE RULES:
- Output ONLY raw JSX/JS code. No markdown fences. No prose.
- Do NOT use import statements.
- Do NOT use external libraries.
- Use only plain JSX elements.
- Use Tailwind CSS classes only.
- Use emoji or inline SVG only.
- Component must be self-contained.
- Must start with: export default function App() {

CRITICAL CONTENT RULES:
- NEVER display the user's prompt text.
- The prompt is ONLY instructions.
- Do NOT copy sentences from the prompt.
- Generate realistic product content instead.

INTERACTIVITY RULES:
- Add basic working interactivity using React.useState.
- Do not import useState, use React.useState.
- Add meaningful button actions:
  - Add/remove items
  - Toggle states
  - Simple filtering
  - Alerts for forms
- Keep everything inside App().

PREMIUM UI QUALITY RULES:
- The design MUST be uniquely tailored to the user's specific prompt.
- Do NOT generate generic templates.
- Make the UI look like a real polished startup product.
- Use modern SaaS dashboard/landing page design.
- Use rounded-2xl cards, shadows, gradients.
- Use spacing: p-6, p-8, gap-6, gap-8.
- Use typography: text-4xl, text-5xl, font-bold.
- Add hyper-realistic dummy data related to the prompt.
- Include multiple distinct sections.
- Add badges, progress bars, avatars, stats.
- Use responsive layout.

CRITICAL:
- IF YOU GENERATE A GENERIC OR REPETITIVE PAGE, YOU FAIL.
- YOU MUST IMPLEMENT THE SPECIFIC FEATURES REQUESTED IN THE DESIGN BRIEF.
- DO NOT just copy the prompt text. Interpret it and build the features it describes.

The output MUST contain:
export default function App() {`;

export async function generateUi(
  plan: UiPlan,
  prompt: string,
  options: UiOptions
): Promise<string> {
  const systemPrompt = `You are an expert React UI generator. You must create highly specific, unique designs.

${COMPONENT_RULES}`;

  const userPrompt = `You must create a UNIQUE UI based specifically on this user idea.

USER IDEA:
${prompt}

This idea is the main source of truth. Do not create a generic dashboard unless the idea asks for a dashboard.

Selected options:
- App type: ${options.appType}
- Theme: ${options.theme}
- Layout: ${options.layout}
- Target user: ${options.targetUser}

UI plan:
${JSON.stringify(plan, null, 2)}

MANDATORY:
- If it is food app, show restaurants, menu, cart, add-to-cart buttons, cart total.
- If it is todo/productivity app, show tasks, input, priority labels, progress, add/delete/toggle actions.
- If it is ecommerce app, show products, filters, cart, add-to-cart buttons.
- If it is portfolio, show hero, projects, skills, contact, working section links.
- If it is education app, show courses, lessons, progress, enrolled cards.
- Never reuse the same layout for every prompt.
- Never display the prompt text.
- Generate realistic content related to the idea.

Return ONLY JSX code starting with:
export default function App() {`;

  const raw = await callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    0.85
  );

  return quickClean(raw);
}

export async function refineUi(
  code: string,
  instruction: string
): Promise<string> {
  const systemPrompt = `You are an expert React UI editor.

${COMPONENT_RULES}

Apply the edit instruction to the existing component.
Keep the code preview-safe.
Do not display the edit instruction in the UI.`;

  const refinePrompt = `Existing code:
${code}

Edit instruction:
${instruction}

IMPORTANT:
The instruction is NOT UI content.
Never display it directly.
Apply changes only.

Return ONLY JSX code starting with:
export default function App() {`;

  const raw = await callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: refinePrompt },
    ],
    0.45
  );

  return quickClean(raw);
}

export async function planUiWithGroq(
  prompt: string,
  options: UiOptions
): Promise<UiPlan> {
  const systemPrompt = `Return ONLY valid JSON UI plan. No markdown. No prose.

Schema:
{
  "appName": "string",
  "targetUser": "string",
  "theme": "string",
  "layout": "string",
  "sections": ["string"],
  "components": ["string"],
  "dummyDataNeeded": ["string"],
  "visualStyle": "string",
  "colorDirection": "string",
  "suggestedEdits": ["string"]
}`;

  const planPrompt = `Create a specific UI plan for this user idea:
${prompt}

Options:
- App type: ${options.appType}
- Theme: ${options.theme}
- Layout: ${options.layout}
- Target user: ${options.targetUser}

Return JSON only.`;

  const raw = await callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: planPrompt },
    ],
    0.5
  );

  try {
    return JSON.parse(stripFences(raw)) as UiPlan;
  } catch {
    return {
      appName: "Generated App",
      targetUser: options.targetUser,
      theme: options.theme,
      layout: options.layout,
      sections: [`Custom UI for ${options.appType}`, "Main Content", "Interactive Area", "Summary Section"],
      components: ["Navbar", "Card", "Button", "Form", "Stats"],
      dummyDataNeeded: ["realistic app-specific data"],
      visualStyle: "Modern, polished, responsive UI tailored to the user's prompt.",
      colorDirection: `A ${options.theme} color palette matched to the product idea.`,
      suggestedEdits: ["Make it more modern", "Add more interactivity", "Improve spacing"],
    };
  }
}