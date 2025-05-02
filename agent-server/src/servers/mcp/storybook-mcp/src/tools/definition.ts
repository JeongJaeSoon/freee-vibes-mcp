import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ZodRawShape, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
type ToolDefinition = {
  name: string;
  description: string;
  paramsSchema: ZodRawShape;
  callback: ToolCallback<ZodRawShape>;
};

export const TOOLS_DEFINITIONS: ToolDefinition[] = [
  {
    name: "example",
    description: "Example tool",
    paramsSchema: { param: z.string().describe("Example parameter") },
    callback: async ({ param }) => ({
      content: [{ type: "text", text: `Example response with: ${param}` }],
    }),
  },
  {
    name: "list-components",
    description: "Return a list of all available Storybook components",
    paramsSchema: {
      name: z.string().describe("Name of the storybook"),
      path: z.string().describe("Path to the storybook index.json or stories.json file"),
    },
    callback: async ({ name, path }) => ({
      content: [{ type: "text", text: `Components: ${name} ${path}` }],
    }),
  },
];
