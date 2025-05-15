import type { Framework, TestingFramework } from '@/types';

import * as p from '@clack/prompts';

import { FRAMEWORK_OPTIONS, TESTING_FRAMEWORK_OPTIONS } from '@/consts';
import { handleCancellation } from '@/utils/prompt';

export async function getEslintOptions(): Promise<{
  framework: Framework | null;
  testingFramework: TestingFramework | null;
  lib: boolean;
}> {
  const shouldAddFramework = await p.confirm({
    message: 'Are you using a framework?',
    initialValue: true,
  });

  if (p.isCancel(shouldAddFramework)) handleCancellation();

  let framework: Framework | null = null;

  if (shouldAddFramework) {
    const selectedFramework = await p.select<Framework>({
      message: 'Select a framework',
      options: FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
        label: color(label),
        value,
      })),
    });

    if (p.isCancel(selectedFramework)) handleCancellation();

    framework = selectedFramework;
  }

  const shouldAddTesting = await p.confirm({
    message: 'Do you want to add a testing framework?',
    initialValue: false,
  });

  if (p.isCancel(shouldAddTesting)) handleCancellation();
  let testingFramework: TestingFramework | null = null;

  if (shouldAddTesting) {
    const selectedFramework = await p.select({
      message: 'Select a testing framework',
      options: TESTING_FRAMEWORK_OPTIONS.map(({ label, value, color }) => ({
        label: color(label),
        value,
      })),
    });

    if (p.isCancel(selectedFramework)) handleCancellation();
    testingFramework = selectedFramework;
  }
  const lib = await p.confirm({
    message: 'Is this a library?',
    initialValue: false,
  });

  if (p.isCancel(lib)) handleCancellation();

  return {
    framework,
    testingFramework,
    lib,
  };
}
