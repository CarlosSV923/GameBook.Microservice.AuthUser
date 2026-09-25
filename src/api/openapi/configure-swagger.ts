import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_UI_PATH = 'docs';
export const SWAGGER_JSON_PATH = 'docs/openapi.json';

export function configureSwagger(application: INestApplication): void {
  const configuration = new DocumentBuilder()
    .setTitle('GameBook AuthUser API')
    .setDescription(
      'User registration, authentication, current-session validation and password revocation for GameBook.',
    )
    .setVersion('0.1.0')
    .addTag(
      'Authentication',
      'Registration, credentials and current-session validation.',
    )
    .addTag('User', 'Protected operations for the authenticated account.')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT issued by AuthUser. Never paste a real token here.',
      },
      'BearerAuth',
    )
    .build();

  const documentFactory = () => {
    const document = SwaggerModule.createDocument(application, configuration);

    for (const schema of Object.values(document.components?.schemas ?? {})) {
      if ('type' in schema && schema.type === 'object') {
        schema.additionalProperties = false;
      }
    }

    return document;
  };

  SwaggerModule.setup(SWAGGER_UI_PATH, application, documentFactory, {
    jsonDocumentUrl: SWAGGER_JSON_PATH,
  });
}
