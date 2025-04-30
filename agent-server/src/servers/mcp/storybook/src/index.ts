import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
export const server = new McpServer({
  name: "storybook",
  version: "1.0.0",
});

// Add your tools and resources here
// Example:
server.tool("example", { param: z.string() }, async ({ param }) => ({
  content: [{ type: "text", text: `Example response with: ${param}` }],
}));

// Start receiving messages on stdin and sending messages on stdout
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.info("storybook running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
