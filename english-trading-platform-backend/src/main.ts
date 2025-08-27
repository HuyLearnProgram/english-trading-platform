import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const whitelist = [
    'http://localhost:3001',
    'http://localhost:3000',      
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || whitelist.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true, // bắt buộc vì bạn dùng cookie HttpOnly
    methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();