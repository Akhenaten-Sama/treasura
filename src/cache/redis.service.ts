// src/cache/redis.service.ts
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost', // Use REDIS_HOST environment variable
      port: parseInt(process.env.REDIS_PORT || '6379', 10), // Use REDIS_PORT environment variable
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttl); // Set with expiration
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
