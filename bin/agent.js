#!/usr/bin/env node

// CLI entry point — sets AGENT_KIT_CLI flag so dist/index.js knows to run CLI
process.env.AGENT_KIT_CLI = '1';
await import('../dist/index.js');
