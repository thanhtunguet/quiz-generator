import { Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { MulterModule } from "@nestjs/platform-express";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as path from "path";

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: undefined, // Use memory storage
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
