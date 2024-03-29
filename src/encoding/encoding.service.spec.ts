import { Test, TestingModule } from '@nestjs/testing';
import { BitMovinEncodingService, EncodingService } from "./bitMovinEncoding.service";
import { ENCODING_SERVICE } from "./interfaces/encoding.service.interface";
import BitmovinApi from "@bitmovin/api-sdk";

describe('EncodingService', () => {
  let service: EncodingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncodingService],
    }).compile();

    service = module.get<EncodingService>(EncodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
