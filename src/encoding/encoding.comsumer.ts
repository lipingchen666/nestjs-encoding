import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import {
  ENCODING_QUEUE,
  ENCODING_SERVICE,
  EncodingOption,
  EncodingService,
} from './interfaces/encoding.service.interface';
import { Inject } from '@nestjs/common';

@Processor(ENCODING_QUEUE)
export class EncodingConsumer {
  constructor(
    @Inject(ENCODING_SERVICE)
    private readonly encodingService: EncodingService,
  ) {}
  @Process()
  async encode(job: Job<EncodingOption>) {
    console.log('job', job);
    await this.encodingService.encode(job.data);
  }
}
