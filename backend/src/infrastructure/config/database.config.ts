import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  url: string;
}

export const databaseConfig = registerAs<DatabaseConfig>('database', () => {
  const host = process.env.DB_HOST ?? 'localhost';
  const port = Number(process.env.DB_PORT ?? 3306);
  const user = process.env.DB_USER ?? 'root';
  const password = process.env.DB_PASSWORD ?? '';
  const name = process.env.DB_NAME ?? 'think_then_talk';

  return {
    host,
    port,
    user,
    password,
    name,
    url: `mysql://${user}:${password}@${host}:${port}/${name}`,
  };
});
