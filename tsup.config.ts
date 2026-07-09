import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'transports/node/index': 'src/transports/node/index.ts',
    'transports/cloudflare/index': 'src/transports/cloudflare/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['cloudflare:sockets', 'net'],
});
