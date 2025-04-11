import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class CacheModule {}
// This module provides a Redis service that can be used throughout the application. It uses the RedisService class to create and manage a Redis client connection. The RedisService is exported so it can be injected into other modules or services in the application.