import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  shims: true,
  format: 'esm',
  clean: true,
  dts: true,
  minify: true,
});
