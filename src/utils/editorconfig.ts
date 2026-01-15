import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import * as p from '@clack/prompts';

export async function writeEditorConfigFile(dryRun: boolean): Promise<void> {
  const editorConfigFilePath = join(process.cwd(), '.editorconfig');
  const editorConfigContent = `root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
`;

  if (dryRun) {
    p.log.info('Created .editorconfig with the following content:');
    p.note(editorConfigContent);

    return;
  }

  try {
    await writeFile(editorConfigFilePath, editorConfigContent, 'utf8');
    p.log.success('Created .editorconfig file.');
  } catch {
    p.log.error('Failed to create .editorconfig file.');
  }
}
