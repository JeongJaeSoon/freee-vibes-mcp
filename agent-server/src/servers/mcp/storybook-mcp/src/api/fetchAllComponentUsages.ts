import type { Component, ComponentUsage } from "../types";
import { extractVariantUsage } from "../utils/variant";
import { readComponentFile } from "../utils/variant";

export const fetchAllComponentUsages = async (component: Component): Promise<ComponentUsage[]> => {
  const { id, importPath, variants } = component;
  if (!variants || variants.length === 0) return [];

  const fileContent = await readComponentFile(importPath);
  if (!fileContent) return [];

  const usages: ComponentUsage[] = [];

  for (const variant of variants) {
    if (!variant.name) continue;

    const usage = extractVariantUsage(fileContent, variant.name);

    if (usage) {
      usages.push({
        componentId: id,
        variantId: variant.id,
        name: variant.name,
        usage,
      });
    }
  }

  return usages.length > 0 ? usages : [];
};
