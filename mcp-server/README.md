# mcp-server

To install dependencies:

```bash
bun install
```

To build:

```bash
make build
```

To run:

```bash
make run
```

After running the server, you need to configure MCP settings:

1. Open your IDE settings
2. Navigate to the MCP configuration section
3. Add a new MCP server with the following settings:
   - Name: MCP Server
   - Version: 1.0.0
   - Path: The path to your built server executable

This project was created using `bun init` in bun v1.2.5. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
