import * as dotenv from "dotenv";
dotenv.config();

console.log("GROQ API KEY PRESENT:", !!process.env.GROQ_API_KEY);
console.log("GEMINI API KEY PRESENT:", !!process.env.GEMINI_API_KEY);
console.log("OLLAMA URL:", process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL);

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
