import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SuggestedCard } from '@german-app/shared';
import { AiProvider } from './ai.provider';

const EXTRACTION_SYSTEM_PROMPT = `You are a German language learning assistant that extracts useful vocabulary and sentence patterns from conversation texts.

Extract the most useful German sentences, expressions, and phrases that would help an intermediate German learner improve their conversational ability.

PREFER:
- Reusable real-life sentences and conversation patterns
- Common verbs and expressions
- Reflexive verbs (e.g., sich freuen, sich vorstellen)
- Separable verbs (e.g., anrufen, aufstehen)
- Prepositions with their cases
- Connectors and discourse markers (e.g., deswegen, trotzdem, obwohl)
- Phrases that help speak more naturally
- Strong vocabulary that extends beyond basics

AVOID:
- Very basic sentences (unless they contain a useful pattern)
- Sentences that are too long or too specific to the conversation
- Random sentences that are not reusable in other contexts
- Trivial greetings unless they contain a useful nuance
- More than 15 cards total — be selective, quality over quantity

For each card, choose the translation language (Spanish or English) that best helps the learner understand the meaning and nuance. Default to Spanish when unsure.

You must return valid JSON matching the schema provided.`;

@Injectable()
export class OpenAiProvider extends AiProvider {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private config: ConfigService) {
    super();
    this.client = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY') });
    this.model = config.get<string>('AI_MODEL', 'gpt-4o-mini');
  }

  async extractCards(text: string): Promise<SuggestedCard[]> {
    this.logger.log(`Extracting cards using model: ${this.model}`);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `Extract useful German learning cards from this class conversation:\n\n${text}` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_cards',
          schema: {
            type: 'object',
            properties: {
              cards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    german: { type: 'string' },
                    translation: { type: 'string' },
                    translationLang: { type: 'string', enum: ['es', 'en'] },
                    type: {
                      anyOf: [
                        {
                          type: 'string',
                          enum: [
                            'reflexive-verb', 'separable-verb', 'expression',
                            'connector', 'preposition', 'vocabulary',
                            'conversation-pattern', 'other',
                          ],
                        },
                        { type: 'null' },
                      ],
                    },
                  },
                  required: ['german', 'translation', 'translationLang', 'type'],
                  additionalProperties: false,
                },
                maxItems: 15,
              },
            },
            required: ['cards'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { cards: SuggestedCard[] };
    return parsed.cards;
  }
}
