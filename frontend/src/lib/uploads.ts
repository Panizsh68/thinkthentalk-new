const ABSOLUTE_URL_PATTERN = /^https?:\/\/\S+$/i;
const UPLOAD_PATH_PATTERN = /^(\/uploads\/|\/images\/|\/api\/upload\/files\/)/;

const legacyCategoryMap: Record<string, string> = {
  events: 'event-poster',
  'event-posters': 'event-poster',
  'event-resources': 'event-resource',
};

export type UploadedFilePath = {
  category: string;
  filename: string;
};

export const sameUploadedFilePath = (
  left: UploadedFilePath | null,
  right: UploadedFilePath | null,
): boolean =>
  Boolean(
    left &&
      right &&
      left.category === right.category &&
      left.filename === right.filename,
  );

export const getUploadedFilePath = (
  value?: string | null,
): UploadedFilePath | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let pathname: string;
  try {
    pathname = new URL(trimmed, 'http://uploads.local').pathname;
  } catch {
    return null;
  }

  if (pathname.startsWith('/uploads/')) {
    const parts = pathname.replace(/^\/uploads\//, '').split('/');
    if (parts.length < 2) return null;
    return {
      category: parts[0],
      filename: parts.slice(1).join('/'),
    };
  }

  if (pathname.startsWith('/images/')) {
    const parts = pathname.replace(/^\/images\//, '').split('/');
    if (parts.length < 2) return null;
    return {
      category: parts[0],
      filename: parts.slice(1).join('/'),
    };
  }

  if (pathname.startsWith('/api/upload/files/')) {
    const parts = pathname.replace(/^\/api\/upload\/files\//, '').split('/');
    if (parts.length < 2) return null;
    const legacyCategory = parts[0];
    return {
      category: legacyCategoryMap[legacyCategory] ?? legacyCategory,
      filename: parts.slice(1).join('/'),
    };
  }

  return null;
};

export const normalizeUploadedFileUrl = (value?: string | null): string => {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  const uploadedPath = getUploadedFilePath(trimmed);
  if (!uploadedPath) {
    return trimmed;
  }

  const canonicalPath = `/api/upload/files/${uploadedPath.category}/${uploadedPath.filename}`;
  return ABSOLUTE_URL_PATTERN.test(trimmed)
    ? `${new URL(trimmed).origin}${canonicalPath}`
    : canonicalPath;
};

export const isUploadUrl = (value?: string | null): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return ABSOLUTE_URL_PATTERN.test(trimmed) || UPLOAD_PATH_PATTERN.test(trimmed);
};
