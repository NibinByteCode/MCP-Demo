import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import dotenv from "dotenv";

dotenv.config();

export function getLLMModel(): any {
  const provider = (process.env.LLM_PROVIDER || "ollama").toLowerCase();

  if (provider === "openrouter") {
    const openrouter = createOpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      compatibility: "compatible", // third-party OpenAI-style API
    });
    return openrouter(process.env.OPENROUTER_MODEL || "openrouter/free");
  }

  if (provider === "gemini") {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    return google(process.env.GEMINI_MODEL || "gemini-1.5-flash");
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

  if (provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest");
  }

  // Default to local Ollama (OpenAI-compatible endpoint)
  const ollama = createOpenAI({
    baseURL: `${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}/v1`,
    apiKey: "ollama",
  });
  return ollama(process.env.OLLAMA_MODEL || "qwen2.5-coder:3b");
}