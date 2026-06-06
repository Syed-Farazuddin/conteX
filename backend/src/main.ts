import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json } from "express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow credentialed requests from the configured web origins (needed for the
  // httpOnly refresh cookie). Falls back to permissive CORS when unset.
  const origins = process.env.CORS_ORIGIN?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins && origins.length > 0 ? origins : true,
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.use(json({ limit: "50mb" }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`Backend started on http://localhost:${port}/api`);
}

bootstrap();
