import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core/memory/memory-store.ts',
    'src/core/retrieval/smart-retriever.ts',
    'src/mcp/mcp-server.ts',
    'src/core/plugins/plugin-registry.ts',
    'src/core/orchestration/graph-builder.ts',
    'src/core/coordination/lock-manager.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  minify: false,
  sourcemap: true,
});
