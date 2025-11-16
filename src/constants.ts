import type { Framework, TestingFramework } from './types';

export const ESLINT_DEPENDENCIES: Record<
  Framework | TestingFramework | 'testing-library',
  string[]
> = {
  node: [],
  angular: ['angular-eslint'],
  react: [
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    'eslint-plugin-jsx-a11y',
  ],
  next: ['@next/eslint-plugin-next'],
  vue: ['eslint-plugin-vue', 'vue-eslint-parser'],
  svelte: ['eslint-plugin-svelte', 'svelte-eslint-parser'],
  solid: ['eslint-plugin-solid'],
  astro: ['eslint-plugin-astro', 'astro-eslint-parser', 'eslint-plugin-jsx-a11y'],
  jest: ['eslint-plugin-jest'],
  vitest: ['@vitest/eslint-plugin'],
  'testing-library': ['eslint-plugin-testing-library'],
};

export const FRAMEWORK_DEPENDENCIES: Record<Exclude<Framework, 'node'>, string[]> = {
  angular: ['@angular/core', '@angular/common'],
  react: ['react', 'react-dom'],
  next: ['next', 'react', 'react-dom'],
  vue: ['vue'],
  svelte: ['svelte'],
  solid: ['solid-js'],
  astro: ['astro'],
};

export const TESTING_FRAMEWORK_DEPENDENCIES: Record<TestingFramework, string[]> = {
  jest: ['jest'],
  vitest: ['vitest'],
};

export const TESTING_LIBRARY_DEPENDENCIES = [
  '@testing-library/dom',
  '@testing-library/react',
  '@testing-library/angular',
  '@testing-library/vue',
  '@testing-library/svelte',
  '@solidjs/testing-library',
  '@testing-library/preact',
];
