import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { LessonsModule } from './lessons/lessons.module';
import { ReviewModule } from './review/review.module';
import { AiModule } from './ai/ai.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/german-app'),
      }),
    }),
    AuthModule,
    UsersModule,
    CardsModule,
    LessonsModule,
    ReviewModule,
    AiModule,
    StatsModule,
  ],
})
export class AppModule {}
