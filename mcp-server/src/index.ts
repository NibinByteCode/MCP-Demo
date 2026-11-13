import express from "express";
import dotenv from "dotenv";
import { getDbPool } from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.MCP_PORT || 4000;

// Expose Schema Endpoint
app.get("/schema", async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'dbo'
    `);
    res.json(result.recordset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Expose Query Execution Endpoint
app.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim().toLowerCase().startsWith("select")) {
      return res
        .status(400)
        .json({ error: "Only read-only SELECT queries are permitted." });
    }

    const pool = await getDbPool();
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`PestControlERP MCP HTTP Server running on port ${PORT}`);
});
