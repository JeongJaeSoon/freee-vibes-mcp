import fs from "node:fs/promises";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

type Response = {
  content: { type: "text"; text: string }[];
};

export const listStorybooks = async (): Promise<Response> => {
  try {
    const path = `${process.cwd()}/sources`;
    const storybooks = await fs.readdir(path);

    const content: Response["content"] = [];

    for (const storybook of storybooks) {
      const indexJsonPath = `${path}/${storybook}/storybook-static/index.json`;
      try {
        await fs.access(indexJsonPath);
        content.push({
          type: "text" as const,
          text: storybook,
        });
      } catch {}
    }

    return { content };
  } catch (error) {
    console.error("Error fetching storybooks:", error);
    throw new McpError(ErrorCode.InternalError, "Failed to list storybooks");
  }
};
