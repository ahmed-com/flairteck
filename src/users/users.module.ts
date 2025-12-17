import { Module } from "@nestjs/common";
import { UserService } from "./service/user.service";
import { User } from "./schema/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { join } from "node:path";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BullModule.registerQueue({
      name: "team",
      processors: [join(__dirname, "..", "processors", "team.processor.js")],
    }),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
