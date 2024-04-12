import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EncodingModule } from './encoding/encoding.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ENCODING_QUEUE } from './encoding/interfaces/encoding.service.interface';
import { EncodingConsumer } from './encoding/encoding.comsumer';

@Module({
  controllers: [AppController],
  // providers: [AppService, EncodingConsumer],
  providers: [AppService],
  imports: [
    EncodingModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.ATLAS_MONGO_CONNECTION_STRING, {
      dbName: 'encoding',
    }),
    // BullModule.forRoot({
    //   redis: {
    //     host: process.env.REDIS_HOST,
    //     port: Number(process.env.REDIS_PORT),
    //   },
    // }),
    // BullModule.registerQueue({
    //   name: ENCODING_QUEUE,
    // }),
  ],
})
export class AppModule {}
