import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

export function getLLMModel() {
  const provider = process.env.LLM_PROVIDER || "ollama";

  if (provider === "gemini") {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    return google(process.env.GEMINI_MODEL || "gemini-2.5-flash");
  }

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(process.env.OPENAI_MODEL || "gpt-4o-mini");
  }

  if (provider === "azure") {
    const azure = createOpenAI({
      baseURL: process.env.AZURE_OPENAI_BASE_URL,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
    });
    return azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o");
  }

  // Default to local Ollama (OpenAI-compatible endpoint)
  const ollama = createOpenAI({
    baseURL: `${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}/v1`,
    apiKey: "ollama",
  });
  return ollama(process.env.OLLAMA_MODEL || "qwen2.5-coder:3b");
}
