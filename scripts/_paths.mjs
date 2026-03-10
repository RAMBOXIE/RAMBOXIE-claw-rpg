import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync } from 'fs';

const __here = dirname(fileURLToPath(import.meta.url));

export const SKILL_ROOT  = join(__here, '..');
export const SCRIPTS     = __here;
export const SCRIPTS_URL = pathToFileURL(__here + '/').href;

/** character.json 存放位置（skill 根目录）*/
export const CHARACTER_FILE = join(SKILL_ROOT, 'character.json');

/** OpenClaw workspace 根目录 */
function findWorkspace() {
  const candidates = [
    join(process.env.USERPROFILE || '', '.openclaw', 'workspace'),
    join(process.env.HOME || '',         '.openclaw', 'workspace'),
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  return candidates[0]; // 兜底
}

export const WORKSPACE = process.env.OPENCLAW_WORKSPACE || findWorkspace();
export const SOUL_FILE  = join(WORKSPACE, 'SOUL.md');
export const MEMORY_FILE = join(WORKSPACE, 'MEMORY.md');
