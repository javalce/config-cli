export type Framework =
  | 'vanilla'
  | 'node'
  | 'react'
  | 'next'
  | 'vue'
  | 'svelte'
  | 'solid'
  | 'astro';

export type TestingFramework = 'jest' | 'vitest';

type ColorFunc = (str: string | number) => string;

export interface FrameworkOptions {
  label: string;
  value: Framework;
  color: ColorFunc;
}

export interface TestingFrameworkOptions {
  label: string;
  value: TestingFramework | null;
  color: ColorFunc;
}

export interface EslintOptions {
  framework: Framework;
  testing: TestingFramework | null;
  testingLibrary: boolean;
  lib: boolean;
}

export interface PrettierOptions {
  tailwind: boolean;
  framework: Framework | null;
}
