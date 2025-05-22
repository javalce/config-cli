import type {
  Framework,
  FrameworkOptions,
  TestingFramework,
  TestingFrameworkOptions,
} from './types';

import colors from 'ansis';

export const FRAMEWORK_OPTIONS: FrameworkOptions[] = [
  {
    label: 'None',
    value: null,
    color: colors.white,
  },
  {
    label: 'React',
    value: 'react',
    color: colors.cyan,
  },
  {
    label: 'Next.js',
    value: 'next',
    color: colors.fg(240),
  },
  {
    label: 'Vue',
    value: 'vue',
    color: colors.green,
  },
  {
    label: 'Svelte',
    value: 'svelte',
    color: colors.fg(202),
  },
  {
    label: 'SolidJS',
    value: 'solid',
    color: colors.blue,
  },
  {
    label: 'Astro',
    value: 'astro',
    color: colors.fg(250),
  },
];

export const TESTING_FRAMEWORK_OPTIONS: TestingFrameworkOptions[] = [
  {
    label: 'None',
    value: null,
    color: colors.white,
  },
  {
    label: 'Jest',
    value: 'jest',
    color: colors.magenta,
  },
  {
    label: 'Vitest',
    value: 'vitest',
    color: colors.green,
  },
];

export const DEPENDENCIES_MAP: Record<Framework | TestingFramework | 'testing-library', string[]> =
  {
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
