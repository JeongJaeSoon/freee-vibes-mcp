import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { getComponents } from "../api/getComponents";

type Request = {
  storybookKey: string;
};

type Response = {
  content: { type: "text"; text: string }[];
};

export const listComponents = async ({ storybookKey }: Request): Promise<Response> => {
  try {
    const storybookDirname = `${process.cwd()}/sources/${storybookKey}`;
    const components = await getComponents(storybookDirname);

    return {
      content: [{ type: "text", text: JSON.stringify(components, null, 2) }],
    };
  } catch (error) {
    console.error("Error fetching components:", error);
    throw new McpError(ErrorCode.InternalError, "Failed to list components");
  }
};
