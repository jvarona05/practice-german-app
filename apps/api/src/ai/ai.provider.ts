import { SuggestedCard } from '@german-app/shared';

export abstract class AiProvider {
  abstract extractCards(text: string): Promise<SuggestedCard[]>;
}
