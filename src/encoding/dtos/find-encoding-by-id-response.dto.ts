import { Expose, Exclude } from 'class-transformer';
import { EncodingStatus } from '../interfaces/encoding.service.interface';

@Exclude()
export class FindEncodingByIdResponseDto {
  @Expose()
  readonly id: string;
  readonly description: string;

  @Expose()
  readonly status: EncodingStatus;

  @Expose()
  readonly foreignId: string;

  @Expose()
  readonly thirdPartyEncoder: string;
  readonly userId: string;
}
