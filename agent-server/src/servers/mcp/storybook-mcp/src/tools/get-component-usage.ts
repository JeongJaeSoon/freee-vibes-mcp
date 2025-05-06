import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { fetchAllComponentUsages } from "../api/fetchAllComponentUsages";
import { fetchComponentUsage } from "../api/fetchComponentUsage";
import { getComponents } from "../api/getComponents";

type Request = {
  storybookKey: string;
  componentId: string;
  variantId?: string;
};

type Response = {
  content: { type: "text"; text: string }[];
};

export const getComponentUsage = async ({
  storybookKey,
  componentId,
  variantId,
}: Request): Promise<Response> => {
  try {
    const storybookPath = `${process.env.WORKSPACE_ROOT}/sources/${storybookKey}`;
    const components = await getComponents(storybookPath);

    const component = components.find((component) => component.id === componentId);

    if (!component) {
      throw new McpError(ErrorCode.InternalError, `Component with ID ${componentId} not found`);
    }

    const usage = variantId
      ? await fetchComponentUsage(component, variantId)
      : await fetchAllComponentUsages(component);

    return { content: [{ type: "text", text: JSON.stringify(usage, null, 2) }] };
  } catch (error) {
    console.error("Error fetching component usage:", error);
    throw new McpError(ErrorCode.InternalError, "Failed to fetch component usage");
  }
};
