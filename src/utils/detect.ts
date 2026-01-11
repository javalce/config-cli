import type { Framework, Options, TestingFramework } from '@/types';

import * as p from '@clack/prompts';
import colors from 'ansis';
import { isPackageExists } from 'local-pkg';

import {
  FRAMEWORK_DEPENDENCIES,
  TESTING_FRAMEWORK_DEPENDENCIES,
  TESTING_LIBRARY_DEPENDENCIES,
} from '@/constants';

import { handleCancellation } from './prompt';

export async function detectOptions(): Promise<Options> {
  const framework =
    (Object.keys(FRAMEWORK_DEPENDENCIES) as Array<Exclude<Framework, 'node'>>).find((key) =>
      FRAMEWORK_DEPENDENCIES[key].every((dep) => isPackageExists(dep)),
    ) ?? 'node';

  p.log.info(`Detected framework: ${colors.cyan(framework)}`);

  const testing =
    (Object.keys(TESTING_FRAMEWORK_DEPENDENCIES) as TestingFramework[]).find((key) =>
      TESTING_FRAMEWORK_DEPENDENCIES[key].every((dep) => isPackageExists(dep)),
    ) ?? null;

  p.log.info(`Detected testing framework: ${colors.cyan(testing ?? 'none')}`);

  const testingLibrary = TESTING_LIBRARY_DEPENDENCIES.some((dep) => isPackageExists(dep));

  p.log.info(`Using testing library: ${colors.cyan(testingLibrary ? 'yes' : 'no')}`);

  const lib = await p.confirm({
    message: 'Are you building a library?',
    initialValue: false,
  });

  if (p.isCancel(lib)) handleCancellation();

  return {
    framework,
    testingLibrary,
    testing,
    lib,
  };
}

export function confirmTailwindIntegration(): boolean {
  const tailwind = isPackageExists('tailwindcss');

  if (tailwind) {
    p.log.info(`Detected Tailwind CSS installation: ${colors.cyan('tailwindcss')}`);
  }

  return tailwind;
}
