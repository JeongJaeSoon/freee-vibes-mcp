import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ZodRawShape, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { listComponents } from "./list-components";
import { listStorybooks } from "./list-storybooks";

type ToolDefinition = {
  name: string;
  description: string;
  paramsSchema: ZodRawShape;
  callback: ToolCallback<ZodRawShape>;
};

export const TOOLS_DEFINITIONS: ToolDefinition[] = [
  {
    name: "list-storybook",
    description: "Returns a list of available Storybook instances.",
    paramsSchema: {},
    callback: async () => await listStorybooks(),
  },
  {
    name: "list-components",
    description: "Returns a list of all components registered in the specified Storybook instance.",
    paramsSchema: {
      storybookKey: z.string().describe("Unique key identifying the target Storybook instance."),
    },
    callback: async ({ storybookKey }) => await listComponents({ storybookKey }),
  },
];
