import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { BullModule } from "@nestjs/bullmq";
import { UsersModule } from "./users/users.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { validationSchema } from "./config.schema";
import { MarketplaceModule } from "./marketplace/marketplace.module";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`${process.env.STAGE ? "." + process.env.STAGE : ""}.env`],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USERNAME"),
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_NAME"),
        migrations: [__dirname + "/**/*.migration{.ts,.js}"],
        autoLoadEntities: true,
        synchronize: ["prod", "test"].includes(
          configService.get<string>("STAGE")!
        ),
        migrationsRun: true,
        migrationsTableName: "schema_migrations",
        migrationsTransactionMode: "all",
        logging: true,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        prefix: "bullmq:",
        connection: {
          host: configService.get<string>("REDIS_HOST"),
          port: configService.get<number>("REDIS_PORT"),
        },
      }),
    }),
    MarketplaceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
