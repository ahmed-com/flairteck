import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { validationSchema } from "../config.schema";
import { Team } from "src/marketplace/schema/team.entity";
import { Player } from "src/marketplace/schema/player.entity";
import { TeamProcessor } from "./team.service";
import { MarketplaceModule } from "src/marketplace/marketplace.module";

@Module({
  imports: [
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
        autoLoadEntities: false,
        entities: [Team, Player],
        synchronize: false,
        migrationsRun: false,
        logging: true,
      }),
    }),
    MarketplaceModule,
  ],
  controllers: [],
  providers: [TeamProcessor],
  exports: [TeamProcessor],
})
export class TeamModule {}
