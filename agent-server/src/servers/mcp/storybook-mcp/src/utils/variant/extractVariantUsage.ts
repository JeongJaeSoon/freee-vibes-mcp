export default function extractVariantUsage(
  fileContent: string,
  variantName: string
): string | null {
  if (!fileContent || !variantName) {
    return null;
  }

  try {
    const variantRegex = new RegExp(`export const ${variantName} = .*?(?=export const|$)`, "s");

    const match = fileContent.match(variantRegex);
    return match ? match[0].trim() : null;
  } catch (error) {
    console.error(`Error extracting variant: ${variantName}`, error);
    return null;
  }
}
