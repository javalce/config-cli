import type { Config, Framework, TestingFramework } from '@/types';

import * as p from '@clack/prompts';

import {
  FRAMEWORK_OPTIONS,
  TANSTACK_QUERY_FRAMEWORKS,
  TESTING_FRAMEWORK_OPTIONS,
} from '@/constants';

import { detectOtherReactRouter, detectTanstackRouter, isTanstackRouterAvailable } from './detect';

export function handleCancellation(): never {
  p.cancel('Operation cancelled.');
  process.exit(130);
}

export function exitWithError(message?: string): never {
  if (message) p.log.error(message);

  p.cancel('Operation failed.');
  process.exit(1);
}

export async function selectFramework({ framework: defaultValue }: Config): Promise<Framework> {
  const framework = await p.select({
    message: 'Select framework:',
    options: FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
      label: color(label),
      value,
    })),
    initialValue: defaultValue,
  });

  if (p.isCancel(framework)) handleCancellation();

  return framework;
}

export async function selectNextOrTanstack(): Promise<Framework> {
  const framework = await p.select<Framework>({
    message: 'Both Next and TanStack Start were detected. Which one do you want to configure?',
    options: FRAMEWORK_OPTIONS.filter(({ value }) => value === 'tanstack' || value === 'next').map(
      ({ label, value, color }) => ({ label: color(label), value }),
    ),
    initialValue: 'tanstack',
  });

  if (p.isCancel(framework)) handleCancellation();

  return framework;
}

export async function selectTestingFramework({
  testingFramework: defaultValue,
}: Config): Promise<TestingFramework | undefined> {
  const testingFramework = await p.select({
    message: 'Select testing framework:',
    options: TESTING_FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
      label: color(label),
      value,
    })),
    initialValue: defaultValue,
  });

  if (p.isCancel(testingFramework)) handleCancellation();

  return testingFramework;
}

export async function selectExtras({
  framework,
  testingFramework,
  hasTestingLibrary,
  hasTailwind,
  hasTanstackQuery,
  hasTanstackRouter,
}: Config): Promise<{
  hasTestingLibrary: boolean;
  hasTailwind: boolean;
  hasTanstackQuery: boolean;
  hasTanstackRouter: boolean;
}> {
  const hasTestingFramework = testingFramework !== undefined;
  const offersTanstackRouter = framework !== 'tanstack' && isTanstackRouterAvailable(framework);
  const otherRouter = detectTanstackRouter() ? undefined : detectOtherReactRouter();
  const supportsTanstackQuery = TANSTACK_QUERY_FRAMEWORKS.includes(framework);
  const extras = await p.multiselect({
    message: 'Select additional features:',
    options: [
      {
        label: 'Testing Library',
        value: 'testing-library',
        disabled: !hasTestingFramework,
        hint: hasTestingFramework ? undefined : 'Requires a testing framework',
      },
      { label: 'Tailwind CSS', value: 'tailwind' },
      ...(offersTanstackRouter
        ? [
            {
              label: 'TanStack Router',
              value: 'tanstack-router',
              hint: otherRouter ? `${otherRouter} detected, not TanStack Router` : undefined,
            },
          ]
        : []),
      {
        label: 'TanStack Query',
        value: 'tanstack-query',
        disabled: !supportsTanstackQuery,
        hint: supportsTanstackQuery ? undefined : 'Requires React, Next or TanStack Start',
      },
    ],
    initialValues: [
      hasTestingLibrary && 'testing-library',
      hasTailwind && 'tailwind',
      hasTanstackRouter && offersTanstackRouter && 'tanstack-router',
      hasTanstackQuery && supportsTanstackQuery && 'tanstack-query',
    ].filter(Boolean),
    required: false,
  });

  if (p.isCancel(extras)) handleCancellation();

  return {
    hasTestingLibrary: extras.includes('testing-library'),
    hasTailwind: extras.includes('tailwind'),
    hasTanstackQuery: extras.includes('tanstack-query'),
    hasTanstackRouter: extras.includes('tanstack-router'),
  };
}
