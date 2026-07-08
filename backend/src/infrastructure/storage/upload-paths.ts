import * as fs from 'fs';
import * as path from 'path';

const normalizeDir = (dir: string): string => path.resolve(dir);

export const getUploadDirCandidates = (
  configuredUploadDir?: string,
): string[] => {
  const candidates = [
    configuredUploadDir,
    process.env.UPLOADS_DIR,
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), '..', 'uploads'),
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(candidates.map(normalizeDir)));
};

export const resolvePrimaryUploadDir = (
  configuredUploadDir?: string,
): string => {
  const candidates = getUploadDirCandidates(configuredUploadDir);
  const existingDir = candidates.find((dir) => fs.existsSync(dir));
  return existingDir ?? candidates[0] ?? normalizeDir('./uploads');
};
