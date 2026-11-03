import {NestFactory} from '@nestjs/core';

import {AppModule} from './app.module';
import {configureApp} from './shared/bootstrap/configure-app';
import {setupSwagger} from './shared/bootstrap/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
