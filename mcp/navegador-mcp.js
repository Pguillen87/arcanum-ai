#!/usr/bin/env node
import { start } from "@agentdeskai/browser-tools-mcp";

start({
  headless: true, // coloque false se quiser ver o navegador aberto
  autoRetry: true,
  maxAttempts: 3,
});