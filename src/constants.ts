import type {
  Framework,
  FrameworkOptions,
  PackageManager,
  TestingFramework,
  TestingFrameworkOptions,
} from './types';

import colors from 'ansis';

export const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'yarn', 'pnpm', 'bun'];

export const NORMALIZED_NAMES: Record<
  Framework | TestingFramework | 'tailwind' | 'testing-library',
  string
> = {
  node: 'Node',
  angular: 'Angular',
  react: 'React',
  preact: 'Preact',
  next: 'Next',
  vue: 'Vue',
  svelte: 'Svelte',
  solid: 'SolidJS',
  astro: 'Astro',
  jest: 'Jest',
  vitest: 'Vitest',
  tailwind: 'Tailwind CSS',
  'testing-library': 'Testing Library',
};

export const FRAMEWORK_OPTIONS: FrameworkOptions[] = [
  { value: 'node', label: NORMALIZED_NAMES.node, color: colors.green },
  { value: 'astro', label: NORMALIZED_NAMES.astro, color: colors.rgb(255, 127, 80) },
  { value: 'react', label: NORMALIZED_NAMES.react, color: colors.hex('#1e90ff') },
  { value: 'next', label: NORMALIZED_NAMES.next, color: colors.gray },
  { value: 'angular', label: NORMALIZED_NAMES.angular, color: colors.magenta },
  { value: 'preact', label: NORMALIZED_NAMES.preact, color: colors.blueBright },
  { value: 'vue', label: NORMALIZED_NAMES.vue, color: colors.greenBright },
  { value: 'svelte', label: NORMALIZED_NAMES.svelte, color: colors.rgb(255, 69, 0) },
  { value: 'solid', label: NORMALIZED_NAMES.solid, color: colors.cyan },
];

export const TESTING_FRAMEWORK_OPTIONS: TestingFrameworkOptions[] = [
  { value: undefined, label: 'None', color: colors.gray },
  { value: 'jest', label: NORMALIZED_NAMES.jest, color: colors.red },
  { value: 'vitest', label: NORMALIZED_NAMES.vitest, color: colors.green },
];

export const ESLINT_DEPENDENCIES: Record<
  Framework | TestingFramework | 'testing-library',
  string[]
> = {
  node: [],
  angular: ['angular-eslint'],
  react: [
    '@eslint-react/eslint-plugin@2.13.0',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    'eslint-plugin-jsx-a11y',
  ],
  preact: [
    '@eslint-react/eslint-plugin@2.13.0',
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

export const FRAMEWORK_DEPENDENCIES: Record<Framework, string[]> = {
  node: [],
  angular: ['@angular/core', '@angular/common'],
  next: ['next', 'react', 'react-dom'],
  react: ['react', 'react-dom'],
  preact: ['preact'],
  vue: ['vue'],
  svelte: ['svelte', 'svelte-check', '@sveltejs/kit'],
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

export const JSX_REQUIRED_FRAMEWORKS: Framework[] = ['react', 'preact', 'next', 'solid'];

export const CSS_PATHS: Record<string, string> = {
  next: './src/app/globals.css',
  vue: './src/style.css',
  svelte: './src/app.css',
  astro: './src/styles/globals.css',
  default: './src/index.css',
};
