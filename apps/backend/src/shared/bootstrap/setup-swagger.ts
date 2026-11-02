import {INestApplication} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';

export const SWAGGER_PATH = 'api/docs';

// Swagger UI: http://localhost:3000/api/docs
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Car Maintenance Tracker API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(SWAGGER_PATH, app, () => SwaggerModule.createDocument(app, config));
}
