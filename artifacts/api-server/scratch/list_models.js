import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const client = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
});

async function listModels() {
  try {
    const response = await client.models.listModels();
    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error(err);
  }
}

listModels();
