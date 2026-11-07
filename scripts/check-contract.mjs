// Fails if src/app/api/contract.ts no longer matches the backend's OpenAPI contract.
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BACKEND = '../ecoScannBack';
const GENERATED = 'src/app/api/contract.ts';

const normalize = (text) => text.replace(/\r\n/g, '\n');
const folder = mkdtempSync(join(tmpdir(), 'contract-'));

try {
  const output = join(folder, 'contract.ts');
  execSync(`npx openapi-typescript contract/openapi.yaml -o "${output}"`, { cwd: BACKEND, stdio: 'ignore' });

  if (normalize(readFileSync(output, 'utf8')) !== normalize(readFileSync(GENERATED, 'utf8'))) {
    console.error(`${GENERATED} is out of date: run "npm run contract:types".`);
    process.exitCode = 1;
  } else {
    console.log('The frontend types match the contract.');
  }
} finally {
  rmSync(folder, { recursive: true, force: true });
}
