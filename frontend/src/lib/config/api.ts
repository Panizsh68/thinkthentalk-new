export const getApiUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    // We use a relative path so the Next.js rewrite can proxy it to the backend.
    return '/api';
  }
  return apiUrl;
};
