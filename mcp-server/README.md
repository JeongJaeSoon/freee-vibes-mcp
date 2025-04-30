# mcp-server

## Initialization

Choose one of the following initialization methods based on your preferred environment:

### Node Environment (Recommended)

To initialize the Node environment (installs dependencies, builds the server, and configures MCP settings):

```bash
make node-init
```

### Docker Environment

To initialize the Docker environment (builds the Docker image and configures MCP settings):

```bash
make docker-init
```

## Development

### Using Node (Recommended)

To build and run the server using Node:

```bash
# Build the server
make node-build

# Run the server
make node-config
```

### Using Docker

To build and run the server using Docker:

```bash
# Build the Docker image
make docker-build

# Run the Docker container
make docker-run

# Stop the Docker container
make docker-stop

# Clean up Docker resources
make docker-clean
```

### MCP Settings

The MCP settings are automatically refreshed when you run `make node-config`. If you need to manually refresh the MCP settings:

```bash
make mcp-refresh
```

After running the server, you need to configure MCP settings:

1. Open your IDE settings
2. Navigate to the MCP configuration section
3. Add a new MCP server with the following settings:
   - Name: MCP Server
   - Version: 1.0.0
   - Path: The path to your built server executable

This project was created using `bun init` in bun v1.2.5. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
