import { Project, SyntaxKind } from "ts-morph";

export default function extractVariantUsage(
  fileContent: string,
  variantName: string
): string | null {
  if (!fileContent || !variantName) return null;

  try {
    const project = new Project({ useInMemoryFileSystem: true });
    const source = project.createSourceFile("temp.tsx", fileContent);
    const decl = source.getVariableDeclaration(variantName);
    if (!decl || !decl.hasExportKeyword()) return null;

    // Return the full export statement text, including comments or decorators
    const exportStmt = decl.getFirstAncestorByKindOrThrow(SyntaxKind.VariableStatement);
    return exportStmt.getText();
  } catch (error) {
    console.error(`Error extracting variant: ${variantName}`, error);
    return null;
  }
}
