import { Router, type IRouter, type Request, type Response } from "express";
import { BuildUiBody, EditUiBody } from "@workspace/api-zod";
import { planUi } from "../lib/gemini";
import { generateUi, refineUi } from "../lib/groq";
import { cleanUi, fallbackGenerateUi, fallbackRefineUi } from "../lib/ollama";

const router: IRouter = Router();

router.post("/ai/build", async (req: Request, res: Response) => {
  const parsed = BuildUiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid build request" });
    return;
  }

  const { prompt, options } = parsed.data;

  try {
    const plan = await planUi(prompt, options);

    let code: string;
    try {
      code = await generateUi(plan, prompt, options);
    } catch (groqErr) {
      req.log.warn({ err: groqErr }, "Groq generator failed — trying Ollama fallback");
      try {
        code = await fallbackGenerateUi(plan, prompt, options);
      } catch (ollamaErr) {
        req.log.error({ err: ollamaErr }, "Ollama fallback also failed");
        res.status(502).json({
          error: "Code generation failed: Groq returned an error and the Ollama fallback is unreachable. Check GROQ_API_KEY and OLLAMA_BASE_URL.",
        });
        return;
      }
    }

    const cleaned = await cleanUi(code);
    res.json({ code: cleaned, plan });
  } catch (err) {
    req.log.error({ err }, "AI build failed");
    const message = err instanceof Error ? err.message : "Failed to generate UI";
    res.status(500).json({ error: message });
  }
});

router.post("/ai/edit", async (req: Request, res: Response) => {
  const parsed = EditUiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid edit request" });
    return;
  }

  const { code, instruction } = parsed.data;

  try {
    let updated: string;
    try {
      updated = await refineUi(code, instruction);
    } catch (groqErr) {
      req.log.warn({ err: groqErr }, "Groq editor failed — trying Ollama fallback");
      try {
        updated = await fallbackRefineUi(code, instruction);
      } catch (ollamaErr) {
        req.log.error({ err: ollamaErr }, "Ollama fallback also failed");
        res.status(502).json({
          error: "Edit failed: Groq returned an error and the Ollama fallback is unreachable. Check GROQ_API_KEY and OLLAMA_BASE_URL.",
        });
        return;
      }
    }

    const cleaned = await cleanUi(updated);
    res.json({ code: cleaned });
  } catch (err) {
    req.log.error({ err }, "AI edit failed");
    const message = err instanceof Error ? err.message : "Failed to edit UI";
    res.status(500).json({ error: message });
  }
});

export default router;
