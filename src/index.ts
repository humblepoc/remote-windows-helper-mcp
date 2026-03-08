#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  listWindowsToolName,
  listWindowsToolDescription,
  listWindowsInputSchema,
  listWindowsHandler,
} from "./tools/list-windows.js";

import {
  screenshotScreenToolName,
  screenshotScreenToolDescription,
  screenshotScreenInputSchema,
  screenshotScreenHandler,
} from "./tools/screenshot-screen.js";

import {
  screenshotWindowToolName,
  screenshotWindowToolDescription,
  screenshotWindowInputSchema,
  screenshotWindowHandler,
} from "./tools/screenshot-window.js";

import {
  recordScreenToolName,
  recordScreenToolDescription,
  recordScreenInputSchema,
  recordScreenHandler,
} from "./tools/record-screen.js";

const server = new McpServer({
  name: "remote-windows-helper",
  version: "1.0.0",
});

// Register tools
server.tool(
  listWindowsToolName,
  listWindowsToolDescription,
  listWindowsInputSchema,
  listWindowsHandler
);

server.tool(
  screenshotScreenToolName,
  screenshotScreenToolDescription,
  screenshotScreenInputSchema,
  screenshotScreenHandler
);

server.tool(
  screenshotWindowToolName,
  screenshotWindowToolDescription,
  screenshotWindowInputSchema,
  screenshotWindowHandler
);

server.tool(
  recordScreenToolName,
  recordScreenToolDescription,
  recordScreenInputSchema,
  recordScreenHandler
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("remote-windows-helper MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
