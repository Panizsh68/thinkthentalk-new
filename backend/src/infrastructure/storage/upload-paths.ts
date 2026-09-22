import * as fs from 'fs';
import * as path from 'path';

const normalizeDir = (dir: string): string => path.resolve(dir);
const normalizeRelativeFilePath = (filePath: string): string =>
  path.posix.normalize(filePath.replace(/\\/g, '/')).replace(/^\/+/, '');

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

  // Never allow a normalized path to escape the configured upload root. This
  // helper is used by legacy public-file resolution as well as by storage
  // callers, so traversal must be rejected at this boundary too.
  if (
    !normalizedRelativePath ||
    normalizedRelativePath === '..' ||
    normalizedRelativePath.startsWith('../') ||
    path.posix.isAbsolute(relativeFilePath.replace(/\\/g, '/'))
  ) {
    return null;
  }

  for (const dir of getUploadDirCandidates(configuredUploadDir)) {
    const absolutePath = path.join(dir, normalizedRelativePath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return null;
};
