import { NestFactory } from "@nestjs/core";
import { TeamProcessor } from "./team.service";
import { TeamModule } from "./team.module";
import { UserCreatedJobData } from "types/types";
import { Job } from "bullmq";

let teamProcessor: TeamProcessor;

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(TeamModule);
  teamProcessor = await appContext.get(TeamProcessor);
  appContext.enableShutdownHooks();
}

export default async function (job: Job<UserCreatedJobData>) {
  if (!teamProcessor) {
    await bootstrap();
  }
  await teamProcessor.process(job);
}
