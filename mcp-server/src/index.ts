import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDbPool } from "./db.js";

const server = new Server(
  { name: "pest-control-erp-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "execute_sql_query",
        description:
          "Execute a read-only SQL SELECT query against the PestControlERP database.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The SQL SELECT query to execute.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_database_schema",
        description: "Retrieve table and column definitions for the database.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const pool = await getDbPool();

    if (request.params.name === "execute_sql_query") {
      const query = (request.params.arguments as any).query;
      if (!query.trim().toLowerCase().startsWith("select")) {
        throw new Error(
          "Only read-only SELECT queries are permitted through this MCP tool.",
        );
      }
      const result = await pool.request().query(query);
      return {
        content: [
          { type: "text", text: JSON.stringify(result.recordset, null, 2) },
        ],
      };
    } else if (request.params.name === "get_database_schema") {
      const schemaQuery = `
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'dbo'
      `;
      const result = await pool.request().query(schemaQuery);
      return {
        content: [
          { type: "text", text: JSON.stringify(result.recordset, null, 2) },
        ],
      };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error: any) {
    return {
      content: [
        { type: "text", text: `Error executing query: ${error.message}` },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PestControlERP MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
