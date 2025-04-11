import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    inject: [ConfigService],
    useFactory:  (configService: ConfigService) => {
      const options: DataSourceOptions = {
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
      };
      const dataSource = new DataSource(options);
      return dataSource.initialize();
    },
  },
];
