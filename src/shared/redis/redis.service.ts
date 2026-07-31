import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { getEnvConfig } from '../../config/env.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly defaultTtl: number = 3600;

  constructor() {
    const config = getEnvConfig();
    this.client = createClient({
      url: `redis://${config.redisHost}:${config.redisPort}`,
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('⚡ Connected to Redis Cache Server successfully.');
    } catch (err) {
      console.warn('⚠️ Redis connection warning:', err.message);
    }
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client.isOpen) return null;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTtl): Promise<boolean> {
    try {
      if (!this.client.isOpen) return false;
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
      return true;
    } catch (e) {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.client.isOpen) return false;
      await this.client.del(key);
      return true;
    } catch (e) {
      return false;
    }
  }
}
