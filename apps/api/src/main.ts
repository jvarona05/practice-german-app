import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { execSync } from 'child_process';
import { AppModule } from './app.module';

const PORT = process.env.PORT || 3001;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' });

  for (let attempts = 5; attempts > 0; attempts--) {
    try {
      await app.listen(PORT);
      console.log(`API running on http://localhost:${PORT}/api`);
      return;
    } catch (err) {
      const isPortInUse = (err as NodeJS.ErrnoException).code === 'EADDRINUSE';
      if (!isPortInUse || attempts === 1) throw err;

      console.log(`Port ${PORT} busy, force-clearing and retrying… (${attempts - 1} left)`);
      try { execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`); } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 800));
    }
  }
}

bootstrap();
