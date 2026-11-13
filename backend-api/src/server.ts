import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateText } from "ai";
import { getLLMModel } from "./llm";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.API_PORT || 3000;

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const MCP_SERVER_URL =
      process.env.MCP_SERVER_URL || "http://localhost:4000";
    const schemaResponse = await fetch(`${MCP_SERVER_URL}/schema`);
    if (!schemaResponse.ok) {
      throw new Error("Failed to fetch schema from MCP server");
    }
    const schemaData = await schemaResponse.json();
    const schemaContext = JSON.stringify(schemaData);

    const model = getLLMModel();
    const sqlPrompt = `You are an expert T-SQL developer for a Pest Control ERP system. 
Database Schema: ${schemaContext}

User Request: "${message}"

Write ONLY a valid MS SQL SELECT query that answers the user request. Do not include markdown formatting blocks, backticks, or explanations—just the raw SQL query string.`;

    const { text: rawQuery } = await generateText({ model, prompt: sqlPrompt });
    const cleanQuery = rawQuery
      .replace(/```sql/gi, "")
      .replace(/```/g, "")
      .trim();

    if (!cleanQuery.toLowerCase().startsWith("select")) {
      throw new Error(
        "Generated query is not a safe read-only SELECT statement.",
      );
    }

    const queryResponse = await fetch(`${MCP_SERVER_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: cleanQuery }),
    });

    const queryResult = await queryResponse.json();

    const summaryPrompt = `Based on the user request "${message}" and the database query result: ${JSON.stringify(queryResult)}, write a clear, helpful, and concise natural language response.`;
    const { text: finalResponse } = await generateText({
      model,
      prompt: summaryPrompt,
    });

    res.json({
      response: finalResponse,
      query: cleanQuery,
      data: queryResult,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

console.log(`Attempting to start Backend API Gateway on port ${PORT}...`);

app.listen(Number(PORT), () => {
  console.log(`✅ Backend API Gateway successfully running on port ${PORT}`);
});
