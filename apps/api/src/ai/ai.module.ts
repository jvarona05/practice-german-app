import { Module } from '@nestjs/common';
import { AiProvider } from './ai.provider';
import { OpenAiProvider } from './openai.provider';

@Module({
  providers: [{ provide: AiProvider, useClass: OpenAiProvider }],
  exports: [AiProvider],
})
export class AiModule {}
