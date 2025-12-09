import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import { VersioningType } from '@nestjs/common';
import { AppModule } from '../src/app.module';

const INTEREST_CODES = ['200', '201', '204', '400', '401', '403', '404', '429'];

function normalizePath(p: string): string {
  return p.replace(/^\/api/, '').replace(/^\/v[0-9]+\//, '/');
}

async function generateSwagger() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Think Then Talk API')
    .setDescription('The complete API specification for the Think Then Talk event platform.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearerAuth')
    .build();

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  await app.close();
  return doc;
}

function compareSpecs(openapi: any, generated: any): number {
  let issues = 0;
  const genPaths = Object.keys(generated.paths || {});
  const normalizedGen = new Map<string, string>();
  genPaths.forEach((p) => normalizedGen.set(normalizePath(p), p));

  const openapiPaths = Object.keys(openapi.paths || {});
  for (const rawPath of openapiPaths) {
    const normalized = normalizePath(rawPath);
    const match = normalizedGen.get(normalized);
    if (!match) {
      console.error(`Missing path in generated spec: ${rawPath}`);
      issues++;
      continue;
    }

    const openapiPathItem = openapi.paths[rawPath];
    const generatedPathItem = generated.paths[match];
    for (const method of Object.keys(openapiPathItem)) {
      const lower = method.toLowerCase();
      if (!generatedPathItem[lower]) {
        console.error(`Missing method ${method} for path ${rawPath}`);
        issues++;
        continue;
      }
      const openapiResponses = openapiPathItem[method].responses || {};
      const generatedResponses = generatedPathItem[lower].responses || {};
      INTEREST_CODES.forEach((code) => {
        if (openapiResponses[code] && !generatedResponses[code]) {
          console.error(`Missing response ${code} for ${method.toUpperCase()} ${rawPath}`);
          issues++;
        }
      });
    }
  }

  const hasBearer =
    generated.components?.securitySchemes &&
    Object.prototype.hasOwnProperty.call(generated.components.securitySchemes, 'bearerAuth');
  if (!hasBearer) {
    console.error('Missing bearerAuth security scheme in generated spec');
    issues++;
  }

  return issues;
}

async function main() {
  const openapiPath = path.join(process.cwd(), 'openapi.yaml');
  const openapiYaml = fs.readFileSync(openapiPath, 'utf8');
  const openapi = yaml.load(openapiYaml) as any;

  const generated = await generateSwagger();
  const issues = compareSpecs(openapi, generated);

  if (issues > 0) {
    console.error(`OpenAPI comparison failed with ${issues} issue(s).`);
    process.exit(1);
  } else {
    console.log('OpenAPI comparison succeeded: generated spec matches openapi.yaml structure.');
  }
}

main().catch((err) => {
  console.error('OpenAPI comparison failed to execute', err);
  process.exit(1);
});
