import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);

  constructor(private configService: ConfigService) { }

  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    temperature = 0.7,
    maxTokens = 4096,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const baseUrl = this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
    const model = this.configService.get<string>('OPENROUTER_MODEL') || 'openai/gpt-4o-mini';

    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is missing in .env');
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Study Assistant',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter API error (${response.status}): ${errorText}`);
        throw new InternalServerErrorException(`OpenRouter API request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new InternalServerErrorException('Received empty response from OpenRouter AI model');
      }

      return typeof text === 'string' ? text : JSON.stringify(text);
    } catch (error: any) {
      this.logger.error(`Failed to execute OpenRouter completion: ${error?.message || error}`);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(`OpenRouter API call failed: ${error?.message || error}`);
    }
  }

  async parseJsonResponse<T>(rawContent: string): Promise<T> {
    try {
      let cleanJsonStr = rawContent.trim();

      // Strip markdown code fences: ```json ... ``` or ``` ... ```
      if (cleanJsonStr.startsWith('```')) {
        cleanJsonStr = cleanJsonStr
          .replace(/^```(?:json|javascript|js)?\s*/i, '')
          .replace(/\s*```\s*$/i, '')
          .trim();
      }

      // Sometimes the model wraps JSON in a single backtick or adds text before/after JSON
      // Extract the first JSON object or array
      const jsonStart = cleanJsonStr.search(/[\[{]/);
      const jsonEnd = Math.max(cleanJsonStr.lastIndexOf('}'), cleanJsonStr.lastIndexOf(']'));

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanJsonStr = cleanJsonStr.slice(jsonStart, jsonEnd + 1);
      }

      // Remove trailing commas before closing brackets/braces (common AI mistake)
      cleanJsonStr = cleanJsonStr
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/,\s*,/g, ',');

      return JSON.parse(cleanJsonStr) as T;
    } catch (error) {
      this.logger.error(`Failed to parse AI JSON response. Raw content (first 500 chars): ${rawContent.substring(0, 500)}`);
      throw new InternalServerErrorException(
        'The AI model returned a malformed response. Please try generating again.',
      );
    }
  }
}
