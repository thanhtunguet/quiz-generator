import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UploadModule } from "./upload/upload.module";
import { QuizModule } from "./quiz/quiz.module";
import { AiModule } from "./ai/ai.module";
import { ParsersModule } from "./parsers/parsers.module";
import { FormattersModule } from "./formatters/formatters.module";
import { DeepseekProvider } from "./ai/deepseek.provider";
import { OpenAIProvider } from "./ai/openai.provider";
import { AnthropicProvider } from "./ai/anthropic.provider";
import { GeminiProvider } from "./ai/gemini.provider";
import { LlmProviderFactory } from "./ai/llm-provider.factory";
import { GrokProvider } from "./ai/grok.provider";

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
  providers: [
    OpenAIProvider,
    AnthropicProvider,
    GeminiProvider,
    DeepseekProvider,
    GrokProvider,
    LlmProviderFactory,
  ],
})
export class AppModule {}
