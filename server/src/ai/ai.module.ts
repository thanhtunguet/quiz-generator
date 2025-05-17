import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAIProvider } from './openai.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    {
      provide: 'LLM_PROVIDER',
      useClass: OpenAIProvider,
    },
  ],
  exports: [AiService],
})
export class AiModule {}