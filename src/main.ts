import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { ConsoleLogger, ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      timestamp: true,
      colors: true,
      prefix: "FlairTech",
    }),
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("FlairTech API")
    .setDescription("The FlairTech API description")
    .setVersion("1.0")
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig, {
      operationIdFactory: (_: string, methodKey: string) => methodKey,
    });
  SwaggerModule.setup("api-docs", app, documentFactory, {
    jsonDocumentUrl: "/api-docs-json",
    yamlDocumentUrl: "/api-docs-yaml",
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT");

  if (!port) {
    throw new Error("PORT is not defined");
  }

  app.enableCors({
    origin: configService.get<string>("CORS_ORIGIN"),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    credentials: true,
  });
  await app.listen(port);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
