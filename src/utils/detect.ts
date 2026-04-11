import type { Framework, TestingFramework } from '@/types';

import { isPackageExists } from 'local-pkg';

import {
  FRAMEWORK_DEPENDENCIES,
  TESTING_FRAMEWORK_DEPENDENCIES,
  TESTING_LIBRARY_DEPENDENCIES,
} from '@/constants';

export function detectFramework(): Framework {
  return (
    (Object.keys(FRAMEWORK_DEPENDENCIES) as Framework[]).find((key) =>
      FRAMEWORK_DEPENDENCIES[key].every((dep) => isPackageExists(dep)),
    ) ?? 'node'
  );
}

export function detectTestingFramework(): TestingFramework | undefined {
  return (Object.keys(TESTING_FRAMEWORK_DEPENDENCIES) as TestingFramework[]).find((key) =>
    TESTING_FRAMEWORK_DEPENDENCIES[key].every((dep) => isPackageExists(dep)),
  );
}

export function detectTestingLibrary(): boolean {
  const testingLibrary = TESTING_LIBRARY_DEPENDENCIES.some((dep) => isPackageExists(dep));

  return testingLibrary;
}

export function detectTailwind(): boolean {
  return isPackageExists('tailwindcss');
}
