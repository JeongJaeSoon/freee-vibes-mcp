import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fetch } from "undici";
import { z } from "zod";
import type { MastraResponse } from "./types/mastra.ts";

// Create an MCP server
export const server = new McpServer({
  name: "MCP Server",
  version: "1.0.0",
});

// Add an addition tool
server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

server.tool(
  "getDiceRoll",
  "Roll a dice with a specified number of sides and return the result.",
  { sides: z.number().min(1).describe("Number of sides on the die") },
  async ({ sides }) => {
    const roll = Math.floor(Math.random() * sides) + 1;

    return {
      content: [
        {
          type: "text",
          text: roll.toString(),
        },
      ],
    };
  }
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  })
);

// Add Mastra communication tool
server.tool(
  "askMastra",
  "Send a question to the Mastra server and get a response",
  {
    question: z.string().describe("The question to ask the Mastra server"),
    agentId: z.string().optional().describe("The ID of the agent to use"),
  },
  async ({ question, agentId = "weatherAgent" }) => {
    try {
      const url = `http://localhost:4111/api/agents/${agentId}/generate`;
      const request = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          messages: [question],
        }),
      };

      const response = await fetch(url, request);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Mastra server responded with status: ${response.status}, body: ${errorText}`
        );
      }

      const data = (await response.json()) as MastraResponse;

      return {
        content: [
          {
            type: "text",
            text: data.text,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Error communicating with Mastra server: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.info("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
