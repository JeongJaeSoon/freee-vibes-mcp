NODE_PATH := $(shell which node)
WORKSPACE_PATH := $(shell pwd)

.PHONY: node-build node-config docker-build docker-run docker-stop docker-clean node-init docker-init mcp-refresh

# Node commands
node-build:
	bun run build

node-config:
	@echo "Updating .cursor/mcp.json with current paths..."
	@jq '.mcpServers."mcp-server-node".command = "$(NODE_PATH)" | .mcpServers."mcp-server-node".args = ["$(WORKSPACE_PATH)/build/index.js"]' .cursor/mcp.json > .cursor/mcp.json.tmp
	@mv .cursor/mcp.json.tmp .cursor/mcp.json

# Docker commands
docker-build:
	docker build -t mcp-server .

docker-run:
	docker run -i --rm mcp-server

docker-stop:
	docker stop mcp-server || true
	docker rm mcp-server || true

docker-clean: docker-stop
	docker rmi mcp-server || true

# Initialization commands
node-init:
	@echo "Initializing Node environment..."
	@mkdir -p .cursor
	@echo '{\n  "mcpServers": {\n    "mcp-server-node": {\n      "command": "$(NODE_PATH)",\n      "args": ["$(WORKSPACE_PATH)/build/index.js"]\n    }\n  }\n}' > .cursor/mcp.json
	@echo "Installing dependencies..."
	@bun install
	@echo "Building the server..."
	@make node-build
	@echo "Node environment initialization complete!"

docker-init:
	@echo "Initializing Docker environment..."
	@mkdir -p .cursor
	@echo '{\n  "mcpServers": {\n    "mcp-server-docker": {\n      "command": "docker",\n      "args": [\n        "run",\n        "-i",\n        "--rm",\n        "mcp-server"\n      ]\n    }\n  }\n}' > .cursor/mcp.json
	@echo "Building Docker image..."
	@make docker-build
	@echo "Docker environment initialization complete!"

# MCP commands
mcp-refresh:
	@jq '.mcpServers."mcp-server-node".command = "$(NODE_PATH)" | .mcpServers."mcp-server-node".args = ["$(WORKSPACE_PATH)/build/index.js"]' .cursor/mcp.json > .cursor/mcp.json.tmp
	@mv .cursor/mcp.json.tmp .cursor/mcp.json
