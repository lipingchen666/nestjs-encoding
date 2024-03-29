import { CreateEncodingDto } from '../dtos/create-endoing.dto';

export const ENCODING_SERVICE = 'ENCODING SERVICE';
export interface EncodingService {
  encode(encodingOption: encodingOption): Promise<EncodingJob>;
  generateEncodingOptions(body: CreateEncodingDto): encodingOption;
  saveEncoding(saveEncodingOption: SaveEncodingOption): Promise<EncodingJob>;
  findEncodingById(id: string): Promise<EncodingJob>;
}

export type EncodingJob = {
  userId: string;
  foreignId: string;
  thirdPartyEncoder: string;
  id: string;
  status: string;
  description: string;
};

export type SaveEncodingOption = {
  description: string;
  status: string;
  foreignId: string;
  thirdPartyEncoder: string;
  userId: string;
};

export type encodingOption = {
  fileName: string;
  fileInfo: fileInfo;
  inputBucket: string;
  outputBucket: string;
  outputFileName: string;
  encodeVideo?: boolean;
  videoOptions?: VideoOption[];
  encodeAudio?: boolean;
  audioOptions?: AudioOption[];
  generateThumbnailTrack?: boolean;
  drm?: boolean;
  userId: string;
};
export interface fileInfo {
  hasVideo: boolean;
  hasAudio: boolean;
  videoStream?: videoStreamInfo;
  audioStream?: audioStreamInfo;
  fileName: string;
  size: number;
  extension?: string;
}

export type videoStreamInfo = {
  bitRate: number;
  width: number;
  height: number;
  duration_s: number;
};

export type audioStreamInfo = {
  bitRate: number;
  duration_s: number;
};

export type VideoOption = {
  width: number;
  height: number;
  bitrate: number;
};

export type AudioOption = {
  bitrate: number;
};
