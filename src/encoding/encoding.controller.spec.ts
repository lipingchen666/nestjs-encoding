import { Test, TestingModule } from '@nestjs/testing';
import { EncodingController } from './encoding.controller';
import { GetEncodingByIdControllerCase } from './test-fixtures/encoding.controller.fixtures';
import { BitMovinEncodingService } from './bitMovinEncoding.service';
import { ENCODING_SERVICE } from './interfaces/encoding.service.interface';
import BitmovinApi, { ConsoleLogger } from '@bitmovin/api-sdk';

const bitMovinClient = new BitmovinApi({
  apiKey:
    process.env.BITMOVIN_API_KEY || '26b08c5c-6ee8-4a14-9525-9b9e161d8b8f',
  logger: new ConsoleLogger(),
});

describe('EncodingController', () => {
  let controller: EncodingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EncodingController],
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
    }).compile();

    controller = module.get<EncodingController>(EncodingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /encodings/.id', () => {
    it.each(GetEncodingByIdControllerCase)(
      '200: pass path param $id get the response $response',
      async ({ id, response }) => {
        //setup

        //execute
        const actualResponse = await controller.getEncodingsByUserId(id);

        //assert
        expect(actualResponse).toEqual(response);
      },
    );
  });
});
