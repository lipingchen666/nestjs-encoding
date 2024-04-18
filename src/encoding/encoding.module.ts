import { Module } from '@nestjs/common';
import { BitMovinEncodingService } from './bitMovinEncoding.service';
import { EncodingController } from './encoding.controller';
import {
  ENCODING_QUEUE,
  ENCODING_SERVICE,
} from './interfaces/encoding.service.interface';
import BitmovinApi, { ConsoleLogger } from '@bitmovin/api-sdk';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ENCODING_SCHEMA_NAME,
  EncodingSchema,
} from './schemas/encoding.schema';
import { BullModule } from '@nestjs/bull';
import { EncodingConsumer } from './encoding.comsumer';

const bitMovinClient = new BitmovinApi({
  apiKey:
    process.env.BITMOVIN_API_KEY || '26b08c5c-6ee8-4a14-9525-9b9e161d8b8f',
  logger: new ConsoleLogger(),
});
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ENCODING_SCHEMA_NAME, schema: EncodingSchema },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: ENCODING_QUEUE,
    }),
  ],
  providers: [
    {
      // You can switch useClass to different implementation
      useClass: BitMovinEncodingService,
      provide: ENCODING_SERVICE,
    },
    {
      provide: BitmovinApi,
      useValue: bitMovinClient,
    },
    EncodingConsumer,
  ],
  controllers: [EncodingController],
})
export class EncodingModule {}
