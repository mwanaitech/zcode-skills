# MCP Filesystem Troubleshooting

## Problem: npm Package Not Found
The MCP `filesystem` server is configured in Hermes via:
```yaml
mcp_servers:
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/mcp-filesystem"]
    enabled: true
```

However, the package `@modelcontextprotocol/mcp-filesystem` **does not exist** on the public npm registry. This causes the server to fail with:
```
npm error 404 Not Found - GET https://registry.npmjs.org/@modelcontextprotocol%2fmcp-filesystem - Not found
```

## Symptoms
- `hermes mcp list` shows the server as `✓ enabled`, but tools like `mcp_filesystem_list_directory` fail with `ENOENT` or `404`.
- Background processes exit with `npm error 404`.
- Commands like `MCP_FILESYSTEM_ALLOWED_DIRS="/path" npx -y @modelcontextprotocol/mcp-filesystem` fail immediately.

## Solutions

### 1. Use Terminal for File Operations
For simple file operations (listing directories, reading files), use the **terminal** instead of the MCP `filesystem`:
```bash
ls -la /path/to/directory
cat /path/to/file
```

### 2. Use Alternative MCP Servers
- **For `.docx` files**: Use the `office-word` MCP server.
- **For web-based operations**: Use the `hyperbrowser` MCP server.

### 3. Check for Local Installations
The MCP `filesystem` server might be installed locally. Search for the binary:
```bash
find ~/.hermes /usr/local/bin -name "*mcp-filesystem*" -o -name "*filesystem*"
```

If found, update the `command` in the Hermes config to point to the binary directly:
```bash
hermes config set mcp_servers.filesystem.command /path/to/binary
```

### 4. Verify the Package Name
Some MCP servers use variants like `@modelcontextprotocol/mcp-server-filesystem`. Check the correct package name in the Hermes logs or documentation.

## Workaround: Allow Directories via Environment Variable
If the MCP `filesystem` server is running but not allowing access to `/opt/data/`, set the `MCP_FILESYSTEM_ALLOWED_DIRS` environment variable:

```bash
MCP_FILESYSTEM_ALLOWED_DIRS="/home/gibson,/opt/data" npx -y @modelcontextprotocol/mcp-server-filesystem
```

## Error Transcripts

### Example 1: npm 404 Error
```
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@modelcontextprotocol%2fmcp-filesystem - Not found
npm error 404
npm error 404  '@modelcontextprotocol/mcp-filesystem@*' is not in this registry.
```

### Example 2: Background Process Failure
```
Background process started
session_id: proc_9ee433cf0430
pid: 411749
status: exited
output_preview: npm error 404 Not Found - GET https://registry.npmjs.org/@modelcontextprotocol%2fmcp-filesystem - Not found
```