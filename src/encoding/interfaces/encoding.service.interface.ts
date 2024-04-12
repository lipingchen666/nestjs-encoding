import { CreateEncodingDto } from '../dtos/create-endoing.dto';

export const ENCODING_SERVICE = 'ENCODING SERVICE';
export const ENCODING_QUEUE = 'ENCODING_QUEUE';
export interface EncodingService {
  encode(encodingOption: EncodingOption): Promise<EncodingJob>;
  generateEncodingOptions(body: CreateEncodingDto): EncodingOption;
  saveEncoding(saveEncodingOption: SaveEncodingOption): Promise<EncodingJob>;
  findEncodingById(id: string): Promise<EncodingJob>;
  findEncodings(findEncodingOption: FindEncodingsOption): Promise<EncodingJob>;
  updateEncodingById(
    id: string,
    updateOption: UpdateOption,
  ): Promise<EncodingJob>;
  updateEncoding(
    filters: FindEncodingsOption,
    updateOption: UpdateOption,
  ): Promise<EncodingJob>;
  submitEncoding(encodingOption: EncodingOption): void;
}
export enum EncodingStatus {
  Submitted = 'SUBMITTED',
  Started = 'STARTED',
  Error = 'ERROR',
  FINISHED = 'FINISHED',
}

export type UpdateOption = {
  status: EncodingStatus;
};

export type FindEncodingsOption = {
  userId?: string;
  foreignId?: string;
  thirdPartyEncoder?: string;
  id?: string;
  status?: string;
};

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

export type EncodingOption = {
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
