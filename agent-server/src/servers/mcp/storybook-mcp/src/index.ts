import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOLS_DEFINITIONS } from "./tools/definition.js";

// Create an MCP server
export const server = new McpServer({
  name: "storybook-mcp",
  version: "1.0.0",
});

for (const tool of TOOLS_DEFINITIONS) {
  server.tool(tool.name, tool.description, tool.paramsSchema, tool.callback);
}

// Start receiving messages on stdin and sending messages on stdout
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.info("storybook-mcp running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
