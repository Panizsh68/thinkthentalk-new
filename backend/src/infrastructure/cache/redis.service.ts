import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) { }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return (await this.cacheManager.get<T>(key)) ?? undefined;
    } catch (error) {
      this.logger.error(`Failed to get key "${key}" from cache`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const ttlMs = this.toMilliseconds(ttlSeconds);
      await this.cacheManager.set(key, value, ttlMs);
    } catch (error) {
      this.logger.error(`Failed to set key "${key}" in cache`, error);
    }
  }

  async setWithTTL<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.set(key, value, ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | undefined> {
    const raw = await this.get<string>(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.error(`Failed to parse JSON from cache key "${key}"`, error);
      return undefined;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async delByPrefix(prefix: string): Promise<void> {
    if (!this.cacheManager) {
      this.logger.warn('Cache manager not available; skipping prefix delete');
      return;
    }
    const store = (this.cacheManager as any).store;
    try {
      if (store && typeof store.keys === 'function') {
        const keys: string[] = await store.keys(`${prefix}*`);
        await Promise.all(keys.map((k: string) => this.del(k)));
        return;
      }

      // Fallback: try scanStream if underlying ioredis is exposed
      if (store?.client?.scanStream) {
        const stream = store.client.scanStream({ match: `${prefix}*` });
        const deletePromises: Promise<void>[] = [];
        stream.on('data', (keys: string[]) => {
          for (const key of keys) deletePromises.push(this.del(key));
        });
        await new Promise((resolve, reject) => {
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        await Promise.all(deletePromises);
        return;
      }

      // Last resort: reset the cache store
      const resetFn = (this.cacheManager as unknown as { reset?: () => Promise<void> }).reset;
      if (typeof resetFn === 'function') {
        this.logger.warn('Cache store does not support key iteration; resetting entire cache store');
        await resetFn();
      } else {
        this.logger.warn('Cache store does not support key iteration and no reset available; skipping prefix delete');
      }
    } catch (error) {
      this.logger.error(`Failed to delete keys by prefix "${prefix}"`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key "${key}" from cache`, error);
    }
  }

  async reset(): Promise<void> {
    this.logger.log('Resetting cache manager store');
    const store = this.cacheManager as unknown as {
      reset?: () => Promise<void>;
    };
    if (store.reset) {
      try {
        await store.reset();
      } catch (error) {
        this.logger.error('Failed to reset cache store', error);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    const key = `redis-health-${Date.now()}`;
    try {
      await this.setWithTTL(key, 'ok', 5);
      await this.del(key);
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }

  private toMilliseconds(ttlSeconds?: number): number | undefined {
    if (ttlSeconds === undefined || ttlSeconds === null) return undefined;
    if (ttlSeconds <= 0) return 0;
    return ttlSeconds * 1000;
  }
}
