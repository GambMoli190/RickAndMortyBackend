import Redis from 'ioredis';
import { config } from '../config/environment';

export class CacheService {
  private static instance: CacheService;
  private redis: Redis | null = null;
  private isConnected: boolean = false;
  private isInitializing: boolean = false;

  private constructor() {
    // Constructor privado para Singleton
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
      CacheService.instance.initializeRedis();
    }
    return CacheService.instance;
  }

  private async initializeRedis(): Promise<void> {
    try {
      console.log('Initializing Redis connection...');

      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        lazyConnect: false,
      });

      this.redis.on('connect', () => {
        console.log('Redis connecting...');
      });

      this.redis.on('ready', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        console.warn('Redis error (cache disabled):', error.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.warn('Redis connection closed');
        this.isConnected = false;
      });

      // Test simple sin await connect()
      try {
        await this.redis.ping();
        console.log('Redis ping successful');
      } catch (pingError) {
        console.warn('Redis ping failed, cache disabled:', pingError);
        this.isConnected = false;
      }

    } catch (error) {
      console.warn('Redis initialization failed (cache disabled):', error);
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const cached = await this.redis.get(key);
      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as T;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected || !this.redis) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const ttl = ttlSeconds || config.cacheTTL;

      await this.redis.setex(key, ttl, serialized);
      console.log(`Cached data for key: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
      console.log(`Deleted cache for key: ${key}`);
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  async flush(): Promise<void> {
    if (!this.isConnected || !this.redis) {
      return;
    }

    try {
      await this.redis.flushdb();
      console.log('Cache flushed');
    } catch (error) {
      console.warn('Cache flush error:', error);
    }
  }

  generateKey(prefix: string, params: any): string {
    const paramString = typeof params === 'object'
      ? JSON.stringify(params, Object.keys(params).sort())
      : String(params);

    return `${prefix}:${Buffer.from(paramString).toString('base64')}`;
  }

  isAvailable(): boolean {
    return this.isConnected;
  }
}