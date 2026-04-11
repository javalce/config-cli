export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export type Framework =
  | 'node'
  | 'angular'
  | 'react'
  | 'preact'
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
  value?: TestingFramework;
  color: ColorFunc;
}

export interface Config {
  framework: Framework;
  testingFramework?: TestingFramework;
  hasTestingLibrary: boolean;
  hasTailwind: boolean;
}
