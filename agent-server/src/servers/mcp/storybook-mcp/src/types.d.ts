export type Component = {
  id: string;
  name: string;
  importPath: string;
  variants: { id: string; name: string }[];
};

export type Components = Component[];

export type ComponentUsage = {
  componentId: string;
  variantId: string;
  name: string;
  usage: string;
};
