import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useStaticAssets(join(__dirname, '..', '_site'));
  // app.setViewEngine('html');

  await app.listen(3004);
}
bootstrap();
