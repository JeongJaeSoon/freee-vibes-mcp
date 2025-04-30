#!/bin/bash

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variable setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATES_DIR="$PROJECT_ROOT/templates/mcp"
SERVERS_DIR="$PROJECT_ROOT/src/servers"
SERVERS_INDEX="$SERVERS_DIR/index.ts"

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
handle_error() {
  log_error "$1"
  exit 1
}

# Print header
echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}      MCP Server Creator           ${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Check templates directory
if [ ! -d "$TEMPLATES_DIR" ]; then
  log_error "Templates directory does not exist. Please run setup first."
  exit 1
fi

# Check servers directory
if [ ! -d "$SERVERS_DIR" ]; then
  log_warning "Servers directory does not exist. Creating..."
  mkdir -p "$SERVERS_DIR" || handle_error "Failed to create servers directory"

  # Create basic index.ts
  cat > "$SERVERS_INDEX" << 'EOL'
// This file exports automatically generated MCP servers.
// It will be automatically updated when new servers are created.

// Server export example:
// export * from './example-server';
EOL

  log_success "Servers directory created."
fi

# Get server name
echo ""
read -p "Enter MCP server name (kebab-case recommended, e.g., my-awesome-mcp): " SERVER_NAME

# Validate name
if [ -z "$SERVER_NAME" ]; then
  log_warning "No name provided. Using 'default-mcp'."
  SERVER_NAME="default-mcp"
fi

# Get server description
echo ""
read -p "Enter a description for your MCP server: " DESCRIPTION
DESCRIPTION=${DESCRIPTION:-"An MCP server for ${SERVER_NAME}"}

# Check if server already exists
if [ -d "$SERVERS_DIR/$SERVER_NAME" ]; then
  log_warning "Warning: Server '$SERVER_NAME' already exists. Overwrite? (y/N)"
  read -p "" overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    log_info "Operation cancelled."
    exit 0
  fi
  # Remove existing directory
  rm -rf "$SERVERS_DIR/$SERVER_NAME"
fi

# Create server directory
mkdir -p "$SERVERS_DIR/$SERVER_NAME/src" || handle_error "Failed to create server directory"

# Variable transformation function
to_pascal_case() {
  echo "$1" | sed -E 's/(^|[-_])([a-z])/\U\2/g'
}

SERVER_NAME_PASCAL=$(to_pascal_case "$SERVER_NAME")
CREATION_DATE=$(date +"%Y-%m-%d")

# Copy template directory structure
log_info "Copying template files..."
cp -r "$TEMPLATES_DIR"/* "$SERVERS_DIR/$SERVER_NAME/" || handle_error "Failed to copy template files"

# Copy hidden directories (like .vscode)
if [ -d "$TEMPLATES_DIR/.vscode" ]; then
  log_info "Copying .vscode directory..."
  cp -r "$TEMPLATES_DIR/.vscode" "$SERVERS_DIR/$SERVER_NAME/" || handle_error "Failed to copy .vscode directory"
fi

# Process all template files
find "$SERVERS_DIR/$SERVER_NAME" -name "*.template" | while read template_file; do
  output_file="${template_file%.template}"

  # Replace variables
  sed -e "s/{{SERVER_NAME}}/$SERVER_NAME/g" \
      -e "s/{{SERVER_NAME_PASCAL}}/$SERVER_NAME_PASCAL/g" \
      -e "s/{{CREATION_DATE}}/$CREATION_DATE/g" \
      -e "s/{{DESCRIPTION}}/$DESCRIPTION/g" \
      "$template_file" > "$output_file"

  # Remove template file
  rm "$template_file"

  log_info "Created: ${output_file#$SERVERS_DIR/}"
done

# Register server (update index.ts)
if ! grep -q "export \* from './$SERVER_NAME';" "$SERVERS_INDEX"; then
  echo "" >> "$SERVERS_INDEX"
  echo "export * from './$SERVER_NAME';" >> "$SERVERS_INDEX"
  log_success "Server registered in index.ts."
fi

echo ""
log_success "✅ MCP server successfully created!"
log_success "📁 Location: $SERVERS_DIR/$SERVER_NAME"
echo ""
log_info "Next steps:"
echo "  1. Edit the generated server files to add your tools and resources."
echo "  2. Build and run your server using the provided Makefile commands."
echo ""
