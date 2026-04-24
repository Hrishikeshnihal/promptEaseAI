import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { planUi, type UiPlan } from "./lib/gemini";
import { generateUi, planUiWithGroq } from "./lib/groq";
import { cleanUi, fallbackGenerateUi } from "./lib/ollama";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.get("/api/health", (req, res) => {
  res.json({
    backend: "ok",
    groqLoaded: !!process.env.GROQ_API_KEY,
    geminiLoaded: !!process.env.GEMINI_API_KEY,
    ollamaUrl: process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "not set",
    port: process.env.PORT || 5000,
  });
});

app.post("/api/build-ui", async (req, res) => {
  let step = "STEP 1: request received";
  logger.info(step);

  const { prompt, options: userOptions } = req.body;

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    res.status(500).json({
      success: false,
      error: "Missing GEMINI_API_KEY and GROQ_API_KEY",
    });
    return;
  }

  if (!prompt) {
    res.status(400).json({
      success: false,
      error: "Prompt is required",
    });
    return;
  }

  const options = {
    appType: userOptions?.appType || "App",
    theme: userOptions?.theme || "Colorful",
    layout: userOptions?.layout || "Landing Page",
    targetUser: userOptions?.targetUser || "Creator",
  };

  try {
    let plan: UiPlan | null = null;

    try {
      step = "STEP 2: Gemini planning started";
      logger.info(step);

      plan = await planUi(prompt, options);

      step = "STEP 3: Gemini completed";
      logger.info(step);
    } catch (geminiPlanErr) {
      logger.warn({ err: geminiPlanErr }, "Gemini planner failed - falling back to Groq");

      try {
        step = "STEP 2b: Groq planning started (fallback)";
        logger.info(step);

        plan = await planUiWithGroq(prompt, options);

        step = "STEP 3b: Groq completed (fallback)";
        logger.info(step);
      } catch (groqPlanErr) {
        logger.warn({ err: groqPlanErr }, "Groq planner also failed - using default plan");

        plan = {
          appName: "Generated App",
          targetUser: options.targetUser,
          theme: options.theme,
          layout: options.layout,
          sections: [`Custom sections for: ${prompt}`, "Main Content", "Interactive Area", "Summary Section"],
          components: ["Navbar", "Hero", "Card", "Button", "Footer"],
          dummyDataNeeded: ["feature cards", "navigation links", "call to action text"],
          visualStyle: "Modern, clean, beginner-friendly UI with good spacing and responsive layout.",
          colorDirection: "Use a polished color palette matching the selected theme.",
          suggestedEdits: ["Make it modern", "Add sidebar", "Improve spacing"],
        };

        step = "STEP 3c: Default plan used";
        logger.info(step);
      }
    }

    step = "STEP 4: Groq generation started";
    logger.info(step);

    let code = "";

    try {
      code = await generateUi(plan, prompt, options);

      step = "STEP 5: Groq completed";
      logger.info(step);
    } catch (groqErr) {
      logger.warn({ err: groqErr }, "Groq generator failed - falling back to Ollama");

      try {
        step = "STEP 4b: Ollama generation started (fallback)";
        logger.info(step);

        code = await fallbackGenerateUi(plan, prompt, options);

        step = "STEP 5b: Ollama completed (fallback)";
        logger.info(step);
      } catch (ollamaGenErr: any) {
        logger.error({ err: ollamaGenErr }, "Ollama generation failed.");
        throw new Error("All AI generations failed. Last error: " + (ollamaGenErr.message || "Unknown Ollama error"));
      }
    }

    step = "STEP 6: Ollama cleanup started";
    logger.info(step);

    let finalCode = code;

    try {
      finalCode = await cleanUi(code);

      step = "STEP 7: Ollama completed";
      logger.info(step);
    } catch (cleanErr) {
      logger.warn({ err: cleanErr }, "Ollama cleanup failed - using raw code");

      finalCode = code;
      step = "STEP 7b: Ollama cleanup skipped";
      logger.info(step);
    }

    finalCode = finalCode
      .replace(/```jsx/g, "")
      .replace(/```tsx/g, "")
      .replace(/```javascript/g, "")
      .replace(/```js/g, "")
      .replace(/```/g, "")
      .replace(/export default function GeneratedApp/g, "export default function App")
      .replace(/function GeneratedApp/g, "function App")
      .trim();

    if (!finalCode.includes("export default")) {
      if (finalCode.includes("function App")) {
        finalCode += "\n\nexport default App;";
      } else {
        throw new Error("Generated code is invalid. Missing component export. Output was: " + finalCode.substring(0, 200));
      }
    }

    console.log("FINAL GENERATED CODE PREVIEW:", finalCode.slice(0, 1000));

    res.json({
      success: true,
      message: "UI generated successfully",
      code: finalCode,
      plan,
    });
  } catch (error: any) {
    logger.error({ error, step }, "ERROR:");

    res.status(500).json({
      success: false,
      step,
      message: error?.message || "Failed to generate UI",
      details: error?.response?.data || error,
    });
  }
});

export default app;