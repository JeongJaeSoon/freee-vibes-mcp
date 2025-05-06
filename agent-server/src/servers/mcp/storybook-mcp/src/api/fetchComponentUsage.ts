import fs from "node:fs/promises";
import type { Component, ComponentUsage } from "../types";
import { extractVariantUsage, readComponentFile } from "../utils/variant";

export const fetchComponentUsage = async (
  component: Component,
  variantId: string
): Promise<ComponentUsage[]> => {
  const { id, importPath, variants } = component;

  if (!variants || variants.length === 0) return [];

  const targetVariant = variants.find((v) => v.id === variantId);
  if (!targetVariant || !targetVariant.name) return [];

  const fileContent = await readComponentFile(importPath);
  if (!fileContent) return [];

  const variantUsage = extractVariantUsage(fileContent, targetVariant.name);
  if (!variantUsage) return [];

  const usage = {
    componentId: id,
    variantId: targetVariant.id,
    name: targetVariant.name,
    usage: variantUsage,
  };

  return [usage];
};
