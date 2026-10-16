import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env files for local execution of migrations
config({ path: join(__dirname, '../../../../.env.local') });
config({ path: join(__dirname, '../../../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL;

export const dataSourceOptions: DataSourceOptions = (isProduction || !!dbUrl || !!process.env.DATABASE_HOST)
  ? (dbUrl
      ? {
          type: 'postgres',
          url: dbUrl,
          ssl: { rejectUnauthorized: false },
          entities: [join(__dirname, 'entities/**/*.entity{.ts,.js}'), join(__dirname, 'entities/all-entities{.ts,.js}')],
          migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
          synchronize: false,
        }
      : {
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: parseInt(process.env.DATABASE_PORT || '5432', 10),
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          ssl: { rejectUnauthorized: false },
          entities: [join(__dirname, 'entities/**/*.entity{.ts,.js}'), join(__dirname, 'entities/all-entities{.ts,.js}')],
          migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
          synchronize: false,
        })
  : {
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [join(__dirname, 'entities/**/*.entity{.ts,.js}'), join(__dirname, 'entities/all-entities{.ts,.js}')],
      migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
      synchronize: true, // Only for dev
    };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
