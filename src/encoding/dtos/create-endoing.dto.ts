import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  audioStreamInfo,
  videoStreamInfo,
} from '../interfaces/encoding.service.interface';
export class CreateEncodingDto {
  @IsOptional()
  @Type(() => VideoOptionsDto)
  videoOptions: VideoOptionsDto[];

  @IsOptional()
  @Type(() => AudioOption)
  audioOptions: any;

  @IsString()
  fileName: string;

  @IsOptional()
  @Type(() => FileInfo)
  fileInfo: any;

  @IsOptional()
  @IsString()
  outputFileName: string;

  @IsOptional()
  @IsString()
  inputBucket: string;

  @IsOptional()
  @IsString()
  outputBucket: string;

  @IsString()
  userId: string;
}

class VideoOptionsDto {
  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsNumber()
  bitrate: number;
}

class AudioOption {
  @IsNumber()
  bitrate: number;
}

class FileInfo {
  @IsBoolean()
  hasVideo: boolean;

  @IsBoolean()
  hasAudio: boolean;

  @IsOptional()
  @Type(() => VideoStreamInfo)
  videoStream?: videoStreamInfo;

  @IsOptional()
  @Type(() => AudioStreamInfo)
  audioStream?: audioStreamInfo;

  @IsString()
  fileName: string;

  @IsNumber()
  size: number;

  @IsOptional()
  @IsString()
  extension?: string;
}

class VideoStreamInfo {
  @IsNumber()
  bitRate: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsNumber()
  duration_s: number;
}

class AudioStreamInfo {
  @IsNumber()
  bitRate: number;

  @IsNumber()
  duration_s: number;
}
