import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { WalletsModule } from './wallets/wallets.module';
import { ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from './config'
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true,load: [configuration], validationSchema }),
    DatabaseModule,
    WalletsModule,
    UsersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

