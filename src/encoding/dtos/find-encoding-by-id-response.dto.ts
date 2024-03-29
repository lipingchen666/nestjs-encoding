import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class FindEncodingByIdResponseDto {
  @Expose()
  readonly id: string;
  readonly description: string;

  @Expose()
  readonly status: string;

  @Expose()
  readonly foreignId: string;

  @Expose()
  readonly thirdPartyEncoder: string;
  readonly userId: string;
}