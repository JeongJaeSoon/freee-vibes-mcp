import fs from "node:fs/promises";

export default async function readComponentFile(filePath: string): Promise<string | null> {
  if (!filePath) {
    return null;
  }

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading component file: ${filePath}`, error);
    return null;
  }
}
