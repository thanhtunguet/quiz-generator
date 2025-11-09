import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cors from "cors";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import * as fs from "fs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function bootstrap() {
  // Create app with Express platform
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.use(cors());

  // Serve static files from the client build directory
  const clientBuildPath = path.join(__dirname, "..", "public");
  console.log(clientBuildPath);
  if (fs.existsSync(clientBuildPath)) {
    app.useStaticAssets(clientBuildPath, {
      index: false, // Don't serve index.html for directory requests
    });

    // Serve index.html for all routes that don't match API or static files
    app.use((req, res, next) => {
      if (
        !req.path.startsWith("/api") && // Don't handle API routes
        !req.path.startsWith("/uploads") && // Don't handle upload routes
        !req.path.match(
          /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/
        ) // Don't handle static assets
      ) {
        res.sendFile(join(clientBuildPath, "index.html"));
      } else {
        next();
      }
    });
  } else {
    console.warn(
      "Client build directory not found. Static file serving is disabled."
    );
  }

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
