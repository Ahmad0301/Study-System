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
    const baseUrl =
      this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
    const configuredModel = this.configService.get<string>('OPENROUTER_MODEL');
    const candidateModels = [
      'openrouter/free',
      configuredModel,
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'liquid/lfm-2.5-2.6b:free',
      'z-ai/glm-5.2:free',
    ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

    if (!apiKey) {
      this.logger.error('OPENROUTER_API_KEY is missing in environment configuration.');
      throw new InternalServerErrorException(
        'AI service configuration missing: OPENROUTER_API_KEY is not set.',
      );
    }

    let lastError = '';
    for (const model of candidateModels) {
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

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return typeof text === 'string' ? text : JSON.stringify(text);
          }
        } else {
          const errText = await response.text();
          lastError = `Model ${model} failed (${response.status}): ${errText}`;
          this.logger.warn(lastError);
        }
      } catch (err: any) {
        lastError = `Model ${model} network error: ${err?.message || err}`;
        this.logger.warn(lastError);
      }
    }

    if (lastError.includes('free-models-per-day') || lastError.includes('Rate limit exceeded')) {
      throw new InternalServerErrorException(
        'OpenRouter free daily quota (50 requests/day) has been reached for this API key. Please wait for the daily reset or update your OPENROUTER_API_KEY in backend/.env.',
      );
    }

    throw new InternalServerErrorException(`All candidate AI models failed. ${lastError}`);
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
