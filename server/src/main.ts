import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cors from "cors";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import * as fs from "fs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.use(cors());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("Quiz API")
    .setDescription("The Quiz API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // Get configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") || 3001;
  const uploadsDir = configService.get<string>("UPLOADS_DIR") || "uploads";

  // Create uploads directory if it doesn't exist
  const uploadsPath = path.join(process.cwd(), uploadsDir);
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
