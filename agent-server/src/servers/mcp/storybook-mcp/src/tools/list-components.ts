type Request = {
  storybookKey: string;
};

type Response = {
  content: { type: "text"; text: string }[];
};

export const listComponents = async ({ storybookKey }: Request): Promise<Response> => {
  return {
    content: [{ type: "text", text: `Hello, ${storybookKey}!` }],
  };
};
