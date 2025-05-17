import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiService } from "./ai.service";
import { OpenAIProvider } from "./openai.provider";
import { GeminiProvider } from "./gemini.provider";
import { AnthropicProvider } from "./anthropic.provider";
import { LlmProviderFactory } from "./llm-provider.factory";
import { DeepseekProvider } from "./deepseek.provider";

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    OpenAIProvider,
    GeminiProvider,
    AnthropicProvider,
    DeepseekProvider,
    LlmProviderFactory,
  ],
  exports: [AiService],
})
export class AiModule {}
