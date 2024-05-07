import { EncodingJobDto } from './encoding-job.dto';

export class FindEncodingsResponseDto {
  prevCursor: string;

  currCursor: string;

  results: EncodingJobDto[];
}
