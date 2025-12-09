export const getApiUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000/api';
    }
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }
  return apiUrl;
};
