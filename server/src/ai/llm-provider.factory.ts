import { Injectable } from "@nestjs/common";
import { LlmProvider, LlmProviderType } from "./llm-provider.interface";
import { OpenAIProvider } from "./openai.provider";
import { GeminiProvider } from "./gemini.provider";
import { AnthropicProvider } from "./anthropic.provider";

@Injectable()
export class LlmProviderFactory {
  private providers: Map<LlmProviderType, LlmProvider> = new Map();

  constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly anthropicProvider: AnthropicProvider
  ) {
    // Initialize providers map
    this.providers.set("openai", openaiProvider);
    this.providers.set("gemini", geminiProvider);
    this.providers.set("anthropic", anthropicProvider);
  }

  /**
   * Get a specific LLM provider by type
   * @param type The type of provider to get
   * @returns The requested provider or undefined if not found
   */
  getProvider(type: LlmProviderType): LlmProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get the first available provider
   * @returns The first available provider or undefined if none are available
   */
  async getFirstAvailableProvider(): Promise<LlmProvider | undefined> {
    for (const [type, provider] of this.providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Get all available providers
   * @returns Array of available providers
   */
  async getAvailableProviders(): Promise<LlmProvider[]> {
    const availableProviders: LlmProvider[] = [];

    for (const [_, provider] of this.providers) {
      if (await provider.isAvailable()) {
        availableProviders.push(provider);
      }
    }

    return availableProviders;
  }
}
