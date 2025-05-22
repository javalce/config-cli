import { defineConfig } from '@javalce/prettier-config';
import prettier from 'prettier';

export async function formatConfigFile(config: string): Promise<string> {
  const prettierOptions = defineConfig({
    parser: 'espree',
  });

  return prettier.format(config, prettierOptions);
}
