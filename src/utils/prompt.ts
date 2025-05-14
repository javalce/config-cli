import * as p from '@clack/prompts';

export function handleCancellation(): never {
  p.cancel('Operation cancelled.');
  process.exit(0);
}
