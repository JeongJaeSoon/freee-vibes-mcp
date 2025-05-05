import fs from "node:fs/promises";
import path from "node:path";
import type { StoryIndex } from "storybook/internal/types";

type Components = {
  id: string;
  name: string;
  importPath: string;
  variants: { id: string; name: string }[];
}[];

export const getComponents = async (storybookDirname: string) => {
  try {
    const storybookStaticFilePath = `${storybookDirname}/storybook-static/index.json`;

    const storybookJsonContent = await fs.readFile(storybookStaticFilePath, "utf-8");
    const storyIndex: StoryIndex = JSON.parse(storybookJsonContent);
    const storyEntries = storyIndex.entries;

    const components: Components = [];

    for (const storyId in storyEntries) {
      const story = storyEntries[storyId];
      const [componentId, variantId] = storyId.split("--");

      if (!story || !componentId) {
        continue;
      }

      const componentName = componentId
        .replace(/-/g, "/")
        .replace(/(^|\/)(\w)/g, (_, separator, char) => `${separator}${char.toUpperCase()}`);

      let component = components.find((c) => c.id === componentId);
      const importPath = path.resolve(storybookDirname, story.importPath);

      if (!component) {
        component = {
          id: componentId,
          name: componentName,
          importPath,
          variants: [],
        };
        components.push(component);
      }

      if (component) {
        if (story.type === "story" && variantId) {
          const variantName = variantId.replace(/(^\w|-\w)/g, (match) =>
            match.replace("-", "").toUpperCase()
          );
          component.variants.push({ id: variantId, name: variantName });
        }
      }
    }

    return components;
  } catch (err) {
    console.error("Error reading or parsing index.json:", err);
    return [];
  }
};
