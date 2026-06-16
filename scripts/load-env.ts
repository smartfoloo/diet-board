// Load .env into process.env when present (tsx/node don't do this automatically).
// Imported for its side effect at the top of pipeline scripts.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(import.meta.dirname, '..', '.env');
if (existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {
    console.warn(`! could not load .env: ${(e as Error).message}`);
  }
}
