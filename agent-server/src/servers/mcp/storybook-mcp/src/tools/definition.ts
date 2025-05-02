import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ZodRawShape, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { listStorybooks } from "./list-storybooks";
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
    name: "list-storybook",
    description: "Returns a list of available Storybook instances.",
    paramsSchema: {},
    callback: async () => await listStorybooks(),
  },
  {
    name: "list-stories",
    description: "Returns a list of all components registered in the specified Storybook instance.",
    paramsSchema: {
      name: z.string().describe("Name of the storybook"),
      path: z.string().describe("Path to the storybook index.json or stories.json file"),
    },
    callback: async ({ name, path }) => ({
      content: [{ type: "text", text: `Components: ${name} ${path}` }],
    }),
  },
];
