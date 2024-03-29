import { Module } from '@nestjs/common';
import { BitMovinEncodingService } from './bitMovinEncoding.service';
import { EncodingController } from './encoding.controller';
import { ENCODING_SERVICE } from './interfaces/encoding.service.interface';
import BitmovinApi, { ConsoleLogger } from '@bitmovin/api-sdk';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ENCODING_SCHEMA_NAME,
  EncodingSchema,
} from './schemas/encoding.schema';

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
  ],
  controllers: [EncodingController],
})
export class EncodingModule {}
