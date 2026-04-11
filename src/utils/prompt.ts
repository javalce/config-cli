import type { Config, Framework, TestingFramework } from '@/types';

import * as p from '@clack/prompts';

import { FRAMEWORK_OPTIONS, TESTING_FRAMEWORK_OPTIONS } from '@/constants';

export function handleCancellation(): never {
  p.cancel('Operation cancelled.');
  process.exit(0);
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
  testingFramework,
  hasTestingLibrary,
  hasTailwind,
}: Config): Promise<{
  hasTestingLibrary: boolean;
  hasTailwind: boolean;
}> {
  const hasTestingFramework = testingFramework !== undefined;
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
    ],
    initialValues: [hasTestingLibrary && 'testing-library', hasTailwind && 'tailwind'].filter(
      Boolean,
    ),
    required: false,
  });

  if (p.isCancel(extras)) handleCancellation();

  return {
    hasTestingLibrary: extras.includes('testing-library'),
    hasTailwind: extras.includes('tailwind'),
  };
}
