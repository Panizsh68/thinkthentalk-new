import * as fs from 'fs';
import * as path from 'path';

const normalizeDir = (dir: string): string => path.resolve(dir);
const normalizeRelativeFilePath = (filePath: string): string =>
  path.posix
    .normalize(filePath.replace(/\\/g, '/'))
    .replace(/^\/+/, '');

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

export const resolveExistingUploadFile = (
  relativeFilePath: string,
  configuredUploadDir?: string,
): string | null => {
  const normalizedRelativePath = normalizeRelativeFilePath(relativeFilePath);

  for (const dir of getUploadDirCandidates(configuredUploadDir)) {
    const absolutePath = path.join(dir, normalizedRelativePath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return null;
};
