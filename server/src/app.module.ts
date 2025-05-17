import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { QuizModule } from './quiz/quiz.module';
import { AiModule } from './ai/ai.module';
import { ParsersModule } from './parsers/parsers.module';
import { FormattersModule } from './formatters/formatters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UploadModule,
    QuizModule,
    AiModule,
    ParsersModule,
    FormattersModule,
  ],
})
export class AppModule {}