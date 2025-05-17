import { Injectable } from "@nestjs/common";
import { LlmProvider, LlmProviderType } from "./llm-provider.interface";
import { OpenAIProvider } from "./openai.provider";
import { AnthropicProvider } from "./anthropic.provider";
import { GeminiProvider } from "./gemini.provider";
import { DeepseekProvider } from "./deepseek.provider";

@Injectable()
export class LlmProviderFactory {
  constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly anthropicProvider: AnthropicProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly deepseekProvider: DeepseekProvider
  ) {}

  getProvider(type: LlmProviderType): LlmProvider {
    switch (type) {
      case LlmProviderType.OPENAI:
        return this.openaiProvider;
      case LlmProviderType.ANTHROPIC:
        return this.anthropicProvider;
      case LlmProviderType.GOOGLE:
        return this.geminiProvider;
      case LlmProviderType.DEEPSEEK:
        return this.deepseekProvider;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  async getFirstAvailableProvider(): Promise<LlmProvider | null> {
    const providers = [
      this.openaiProvider,
      this.anthropicProvider,
      this.geminiProvider,
      this.deepseekProvider,
    ];

    for (const provider of providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    return null;
  }
}
