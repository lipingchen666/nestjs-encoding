import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  audioStreamInfo,
  videoStreamInfo,
} from '../interfaces/encoding.service.interface';
import { ApiProperty } from '@nestjs/swagger';
export class CreateEncodingDto {
  @IsOptional()
  @Type(() => VideoOptionsDto)
  @ApiProperty({ type: () => [VideoOptionsDto], example: null })
  videoOptions: VideoOptionsDto[];

  @ApiProperty({ type: () => [AudioOption], example: null })
  @IsOptional()
  @Type(() => AudioOption)
  audioOptions: any;

  @ApiProperty({ example: 'keyAndPeele.mp4' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: null })
  @IsOptional()
  @Type(() => FileInfo)
  fileInfo: any;

  @ApiProperty({ example: null })
  @IsOptional()
  @IsString()
  outputFileName: string;

  @ApiProperty({ example: null })
  @IsOptional()
  @IsString()
  inputBucket: string;

  @ApiProperty({ example: null })
  @IsOptional()
  @IsString()
  outputBucket: string;

  @ApiProperty({ example: 'exampleUser1' })
  @IsString()
  userId: string;

  @ApiProperty({ example: true })
  generateThumbnailTrack: boolean;

  @ApiProperty({ example: true })
  drm: boolean;

  @ApiProperty({ example: true })
  encodeVideo: boolean;

  @ApiProperty({ example: true })
  encodeAudio: boolean;
}

class VideoOptionsDto {
  @ApiProperty({ example: 1280 })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 720 })
  @IsNumber()
  height: number;

  @ApiProperty({ example: 3000000 })
  @IsNumber()
  bitrate: number;
}

class AudioOption {
  @ApiProperty({ example: 192000 })
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
