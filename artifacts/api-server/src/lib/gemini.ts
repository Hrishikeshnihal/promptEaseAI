import { ai } from "@workspace/integrations-gemini-ai";

const PLANNER_MODEL = "gemini-1.5-flash";

export interface UiPlan {
  appName: string;
  targetUser: string;
  theme: string;
  layout: string;
  sections: string[];
  components: string[];
  dummyDataNeeded: string[];
  visualStyle: string;
  colorDirection: string;
  suggestedEdits: string[];
}

export interface UiOptions {
  appType: string;
  theme: string;
  layout: string;
  targetUser: string;
}

function extractText(response: unknown): string {
  const r = response as { text?: string | (() => string) };
  if (typeof r.text === "function") return r.text();
  if (typeof r.text === "string") return r.text;
  return "";
}

function stripFences(s: string): string {
  let out = s.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```[a-zA-Z]*\n?/, "");
    if (out.endsWith("```")) out = out.slice(0, -3);
  }
  return out.trim();
}

function extractJson<T>(raw: string): T {
  const cleaned = stripFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Failed to parse JSON from Gemini planner output");
  }
}

export async function planUi(prompt: string, options: UiOptions): Promise<UiPlan> {
  const systemPrompt = `You are a UI planner for a no-code app generator. Given a plain-language idea and a few guided options, return a structured JSON plan describing what to build. You DO NOT write code — only the plan.

Return ONLY valid JSON (no prose, no code fences) matching this exact shape:
{
  "appName": string,
  "targetUser": string,
  "theme": string,
  "layout": string,
  "sections": string[],
  "components": string[],
  "dummyDataNeeded": string[],
  "visualStyle": string,
  "colorDirection": string,
  "suggestedEdits": string[]
}

- appName: short, friendly product name derived from the idea (1-3 words).
- sections: ordered list of high-level page sections (e.g. "Hero", "Feature Grid", "Stats", "CTA").
- components: concrete UI components needed ("ProgressBar", "Card", "Avatar", ...).
- dummyDataNeeded: realistic example data the UI should display.
- visualStyle: 1-2 sentence description of the look and feel.
- colorDirection: a concrete palette direction matching the theme.
- suggestedEdits: 3 follow-up tweaks the user might ask for next.`;

  const userPrompt = `User idea: ${prompt}
App type: ${options.appType}
Theme: ${options.theme}
Layout: ${options.layout}
Target user: ${options.targetUser}

Generate the JSON plan.`;

  const response = await ai.models.generateContent({
    model: PLANNER_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    },
  });

  return extractJson<UiPlan>(extractText(response));
}
