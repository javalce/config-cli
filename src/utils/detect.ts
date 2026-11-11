import type { Framework, TestingFramework } from '@/types';

import { isPackageExists } from 'local-pkg';

import {
  FRAMEWORK_DEPENDENCIES,
  OTHER_REACT_ROUTER_PACKAGES,
  TANSTACK_QUERY_PACKAGE,
  TANSTACK_ROUTER_FRAMEWORKS,
  TANSTACK_ROUTER_PACKAGE,
  TESTING_FRAMEWORK_DEPENDENCIES,
  TESTING_LIBRARY_DEPENDENCIES,
} from '@/constants';

export function detectFrameworks(): Framework[] {
  const detected = (
    Object.keys(FRAMEWORK_DEPENDENCIES) as Array<Exclude<Framework, 'node'>>
  ).filter((key) => FRAMEWORK_DEPENDENCIES[key].every((dep) => isPackageExists(dep)));

  return detected.length > 0 ? detected : ['node'];
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

export function detectTanstackRouter(): boolean {
  return isPackageExists(TANSTACK_ROUTER_PACKAGE);
}

export function detectOtherReactRouter(): string | undefined {
  return OTHER_REACT_ROUTER_PACKAGES.find((dep) => isPackageExists(dep));
}

export function detectTanstackQuery(): boolean {
  return isPackageExists(TANSTACK_QUERY_PACKAGE);
}

export function detectTailwind(): boolean {
  return isPackageExists('tailwindcss');
}

export function isTanstackRouterAvailable(framework: Framework): boolean {
  return (
    TANSTACK_ROUTER_FRAMEWORKS.includes(framework) ||
    (framework === 'next' && detectTanstackRouter())
  );
}
