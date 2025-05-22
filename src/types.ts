export type Framework = 'react' | 'next' | 'vue' | 'svelte' | 'solid' | 'astro';

export type TestingFramework = 'jest' | 'vitest';

type ColorFunc = (str: string | number) => string;

export interface FrameworkOptions {
  label: string;
  value: Framework | null;
  color: ColorFunc;
}

export interface TestingFrameworkOptions {
  label: string;
  value: TestingFramework | null;
  color: ColorFunc;
}

export interface EslintOptions {
  framework: Framework | null;
  testing: TestingFramework | null;
  lib: boolean;
}

export interface PrettierOptions {
  tailwind: boolean;
  framework: Framework | null;
}
