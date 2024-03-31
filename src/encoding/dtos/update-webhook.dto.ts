import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum EventType {
  ENCODING_FINISHED = 'ENCODING_FINISHED',
}
export class updateWebhookDto {
  @IsString()
  resourceId: string;

  @IsEnum(EventType)
  eventType: EventType;

  @Type(() => EncodingStatus)
  encodingStatus: {
    type: string;
    progress: number;
    status: string;
  };

  @IsString()
  webhookId: string;
}

class EncodingStatus {
  @IsString()
  type: string;

  @IsNumber()
  progress: number;

  @IsString()
  status: string;
}
