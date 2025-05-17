import { Module } from "@nestjs/common";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { AiModule } from "../ai/ai.module";
import { ParsersModule } from "../parsers/parsers.module";
import { FormattersModule } from "../formatters/formatters.module";
import { UploadModule } from "src/upload/upload.module";

@Module({
  imports: [AiModule, UploadModule, ParsersModule, FormattersModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
