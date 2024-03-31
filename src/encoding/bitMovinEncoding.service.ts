import { Injectable } from '@nestjs/common';
import {
  EncodingService,
  encodingOption,
  VideoOption,
  videoStreamInfo,
  AudioOption,
  audioStreamInfo,
  EncodingJob,
  SaveEncodingOption,
  FindEncodingsOption,
  UpdateOption,
  EncodingStatus,
} from './interfaces/encoding.service.interface';
import BitmovinApi, {
  AacAudioConfiguration,
  AclEntry,
  AclPermission,
  CencDrm,
  CencPlayReady,
  CencWidevine,
  CodecConfiguration,
  DashManifest,
  DashManifestDefault,
  DashManifestDefaultVersion,
  Encoding,
  EncodingOutput,
  Fmp4Muxing,
  H264VideoConfiguration,
  HlsManifest,
  HlsManifestDefault,
  HlsManifestDefaultVersion,
  HttpInput,
  Input,
  Manifest,
  ManifestGenerator,
  ManifestResource,
  MessageType,
  Muxing,
  MuxingStream,
  Output,
  PresetConfiguration,
  S3Input,
  S3Output,
  Sprite,
  StartEncodingRequest,
  Status,
  Stream,
  StreamInput,
  StreamSelectionMode,
  Task,
} from '@bitmovin/api-sdk';
import { isEmpty } from 'lodash';
import * as Path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import {
  ENCODING_SCHEMA_NAME,
  Encoding as encodingSchema,
} from './schemas/encoding.schema';
import { Model } from 'mongoose';
import WebhookHttpMethod from '@bitmovin/api-sdk/dist/models/WebhookHttpMethod';

@Injectable()
export class BitMovinEncodingService implements EncodingService {
  defaultInputBucket: string;
  defaultOutputBucket: string;

  constructor(
    private bitMovinClient: BitmovinApi,
    @InjectModel(ENCODING_SCHEMA_NAME)
    private encodingModel: Model<encodingSchema>,
  ) {
    this.defaultInputBucket = 'nextjs-template-bucket';
    this.defaultOutputBucket = 'nextjs-template-output-bucket';
  }
  // bucket: string = "nextjs-template-bucket", key: string, outPutBucket: string = "s3://nextjs-template-output-bucket", outPutKey: string
  async encode(encodingOptions: encodingOption): Promise<EncodingJob> {
    const inputBucket = encodingOptions.inputBucket;
    const inputKey = encodingOptions.fileName;
    const outputBucket = encodingOptions.outputBucket;
    const outPutKey = encodingOptions.outputFileName
      ? encodingOptions.outputFileName
      : encodingOptions.fileName;

    const encoding = await this.createEncoding(inputKey, `${outPutKey}`);
    const input = await this.createS3Input(inputBucket);
    const output = await this.createS3Output(outputBucket);
    const outPutPath = `${Path.parse(outPutKey).name}/`;

    if (encodingOptions.encodeVideo) {
      // const videoOptions = this.getVideoEncodingOption(encodingOption.videoOptions, encodingOption.fileInfo?.videoStream);
      const videoOptions = encodingOptions.videoOptions;
      const videoConfigurationsPromise = (videoOptions || []).map((option) => {
        return this.createH264VideoConfig(
          option.width,
          option.height,
          option.bitrate,
        );
      });
      const videoConfigurations = await Promise.all(videoConfigurationsPromise);

      for (const videoConfig of videoConfigurations) {
        const videoStream = await this.createStream(
          encoding,
          input,
          inputKey,
          videoConfig,
        );
        //TODO: consider put generateThumbnailTrack option on each videoOptions
        if (encodingOptions.generateThumbnailTrack) {
          const filename = Path.parse(inputKey).name;
          await this.createSprite(
            encoding.id || '',
            videoStream.id || '',
            `${filename}.jpg`,
            `${filename}.vtt`,
            output,
            outPutPath,
          );
        }
        if (encodingOptions.drm) {
          const videoMuxingStream = await this.createFmp4MuxingDrm(
            encoding,
            videoStream,
          );
          await this.createDrmConfig(
            encoding,
            videoMuxingStream,
            output,
            `${outPutPath}/video/${videoConfig.bitrate}`,
          );
        } else {
          await this.createFmp4Muxing(
            encoding,
            output,
            `${outPutPath}/video/${videoConfig.bitrate}`,
            videoStream,
          );
        }
      }
    }

    if (encodingOptions.encodeAudio) {
      // const audioOptions = this.getAudioEncodingOption(encodingOptions.audioOptions, encodingOptions.fileInfo?.audioStream);
      const audioOptions = encodingOptions.audioOptions;
      const audioConfigurationsPromise = (audioOptions || []).map((option) => {
        return this.createAacAudioConfig(option.bitrate);
      });

      const audioConfigurations = await Promise.all(audioConfigurationsPromise);

      for (const audioConfig of audioConfigurations) {
        const audioStream = await this.createStream(
          encoding,
          input,
          inputKey,
          audioConfig,
        );
        if (encodingOptions.drm) {
          const audioMuxingStream = await this.createFmp4MuxingDrm(
            encoding,
            audioStream,
          );
          await this.createDrmConfig(
            encoding,
            audioMuxingStream,
            output,
            `${outPutPath}/audio/${audioConfig.bitrate}`,
          );
        } else {
          await this.createFmp4Muxing(
            encoding,
            output,
            `${outPutPath}/audio/${audioConfig.bitrate}`,
            audioStream,
          );
        }
      }
    }

    const dashManifest = await this.createDefaultDashManifest(
      encoding,
      output,
      `${outPutPath}/`,
    );
    const hlsManifest = await this.createDefaultHlsManifest(
      encoding,
      output,
      `${outPutPath}/`,
    );

    const startEncodingRequest = new StartEncodingRequest({
      manifestGenerator: ManifestGenerator.V2,
      vodDashManifests: [this.buildManifestResource(dashManifest)],
      vodHlsManifests: [this.buildManifestResource(hlsManifest)],
    });

    // await this.executeEncoding(encoding, startEncodingRequest);
    const bitMovinEncodingId = await this.startEncodingAndSubscribeToWebHook(
      encoding,
      startEncodingRequest,
    );

    const savingEncodingOption = {
      description: outPutKey,
      status: EncodingStatus.Started,
      foreignId: bitMovinEncodingId,
      thirdPartyEncoder: 'bitMovin',
      userId: encodingOptions.userId,
    };

    return await this.saveEncoding(savingEncodingOption);
  }
  getVideoEncodingOption(
    clientVideoOptions: VideoOption[] | undefined,
    videoInfo: videoStreamInfo | undefined,
  ): VideoOption[] {
    if (!clientVideoOptions || isEmpty(clientVideoOptions)) {
      return [
        {
          width: videoInfo?.width ? videoInfo.width : 1280,
          height: videoInfo?.height ? videoInfo.height : 720,
          bitrate: videoInfo?.bitRate ? videoInfo.bitRate : 3000000,
        },
      ];
    }

    return clientVideoOptions;
  }

  getAudioEncodingOption(
    clientAudioOptions: AudioOption[] | undefined,
    audioInfo: audioStreamInfo | undefined,
  ): AudioOption[] {
    if (!clientAudioOptions || isEmpty(clientAudioOptions)) {
      return [
        {
          bitrate: audioInfo?.bitRate ? audioInfo?.bitRate : 192000,
        },
      ];
    }

    return clientAudioOptions;
  }

  generateEncodingOptions(body: any): encodingOption {
    const sanitizedVideoOptions = this.getVideoEncodingOption(
      body.videoOptions,
      body.fileInfo?.videoStream,
    );
    const sanitizedAudioOptions = this.getAudioEncodingOption(
      body.audioOptions,
      body.fileInfo?.audioStream,
    );
    const sanitizedFileName = body.fileName
      ? body.fileName
      : body.fileInfo?.fileName;
    const sanitizedOutputFileName = body.outputFileName
      ? body.outputFileName
      : sanitizedFileName;
    const sanitizedInputBucket = body.inputBucket
      ? body.inputBucket
      : this.defaultInputBucket;
    const sanitizedOutputBucket = body.outputBucket
      ? body.outputBucket
      : this.defaultOutputBucket;

    return {
      fileName: sanitizedFileName,
      fileInfo: body.fileInfo,
      inputBucket: sanitizedInputBucket,
      outputBucket: sanitizedOutputBucket,
      outputFileName: sanitizedOutputFileName,
      encodeVideo: !!body.encodeVideo,
      encodeAudio: !!body.encodeAudio,
      videoOptions: sanitizedVideoOptions,
      audioOptions: sanitizedAudioOptions,
      generateThumbnailTrack: !!body.generateThumbnailTrack,
      drm: !!body.drm,
      userId: body.userId,
    };
  }

  /**
   * Adds an MPEG-CENC DRM configuration to the muxing to encrypt its output. Widevine and FairPlay
   * specific fields will be included into DASH and HLS manifests to enable key retrieval using
   * either DRM method.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/encodings#/Encoding/PostEncodingEncodingsMuxingsFmp4DrmCencByEncodingIdAndMuxingId
   *
   * @param encoding The encoding to which the muxing belongs to
   * @param muxing The muxing to apply the encryption to
   * @param output The output resource to which the encrypted segments will be written to
   * @param outputPath The output path where the encrypted segments will be written to
   */
  createDrmConfig(
    encoding: Encoding,
    muxing: Muxing,
    output: Output,
    outputPath: string,
  ): Promise<CencDrm> {
    const widevineDrm = new CencWidevine({
      pssh: 'EhBs3r1AP9LQdwNEYxd2I5sEGgVlemRybUjj3JWbBg==',
    });

    const playReadyDrm = new CencPlayReady({
      laUrl: 'https://playready.ezdrm.com/cency/preauth.aspx?pX=950E6A',
    });
    // const cencFairPlay = new CencFairPlay({
    //     iv: "88ff620764a8eb88147fa13b7e45168c",
    //     uri: "https://playready.ezdrm.com/cency/preauth.aspx?pX=950E6A",
    // });

    const cencDrm = new CencDrm({
      outputs: [this.buildEncodingOutput(output, outputPath)],
      key: '2e42d3b9ecce677ea2a2a8431d2b5551',
      kid: '6cdebd403fd2d0770344631776239b04',
      widevine: widevineDrm,
      playReady: playReadyDrm,
      // fairPlay: cencFairPlay
    });

    return this.bitMovinClient.encoding.encodings.muxings.fmp4.drm.cenc.create(
      encoding.id!,
      muxing.id!,
      cencDrm,
    );
  }

  async createSprite(
    encodingId: string,
    streamId: string,
    jpgName: string,
    vttName: string,
    output: S3Output,
    outputPath: string,
  ) {
    const spriteConfig = new Sprite({
      spriteName: jpgName,
      vttName: vttName,
      outputs: [this.buildEncodingOutput(output, outputPath)],
      distance: 2,
      width: 320,
    });

    await this.bitMovinClient.encoding.encodings.streams.sprites.create(
      encodingId || '',
      streamId || '',
      spriteConfig,
    );
  }

  /**
   * Creates an Encoding object. This is the base object to configure your encoding.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/encodings#/Encoding/PostEncodingEncodings
   *
   * @param name A name that will help you identify the encoding in our dashboard (required)
   * @param description A description of the encoding (optional)
   */
  createEncoding(name: string, description: string): Promise<Encoding> {
    const encoding = new Encoding({
      name: name,
      description: description,
    });

    return this.bitMovinClient.encoding.encodings.create(encoding);
  }

  /**
   * Creates a resource representing an HTTP server providing the input files. For alternative input
   * methods see <a
   * href="https://bitmovin.com/docs/encoding/articles/supported-input-output-storages">list of
   * supported input and output storages</a>
   *
   * <p>For reasons of simplicity, a new input resource is created on each execution of this
   * example. In production use, this method should be replaced by a <a
   * href="https://bitmovin.com/docs/encoding/api-reference/sections/inputs#/Encoding/GetEncodingInputsHttpByInputId">get
   * call</a> to retrieve an existing resource.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/inputs#/Encoding/PostEncodingInputsHttp
   *
   * @param host The hostname or IP address of the HTTP server e.g.: my-storage.biz
   */
  async createHttpInput(host: string): Promise<HttpInput> {
    const input = new HttpInput({
      host: host,
    });

    return this.bitMovinClient.encoding.inputs.http.create(input);
  }

  async createS3Input(bucketName: string): Promise<any> {
    const s3Input = new S3Input({
      bucketName: bucketName,
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    return this.bitMovinClient.encoding.inputs.s3.create(s3Input);
  }

  /**
   * Creates a resource representing an AWS S3 cloud storage bucket to which generated content will
   * be transferred. For alternative output methods see <a
   * href="https://bitmovin.com/docs/encoding/articles/supported-input-output-storages">list of
   * supported input and output storages</a>
   *
   * <p>The provided credentials need to allow <i>read</i>, <i>write</i> and <i>list</i> operations.
   * <i>delete</i> should also be granted to allow overwriting of existings files. See <a
   * href="https://bitmovin.com/docs/encoding/faqs/how-do-i-create-a-aws-s3-bucket-which-can-be-used-as-output-location">creating
   * an S3 bucket and setting permissions</a> for further information
   *
   * <p>For reasons of simplicity, a new output resource is created on each execution of this
   * example. In production use, this method should be replaced by a <a
   * href="https://bitmovin.com/docs/encoding/api-reference/sections/outputs#/Encoding/GetEncodingOutputsS3">get
   * call</a> retrieving an existing resource.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/outputs#/Encoding/PostEncodingOutputsS3
   *
   * @param bucketName The name of the S3 bucket
   * @param accessKey The access key of your S3 account
   * @param secretKey The secret key of your S3 account
   */
  async createS3Output(bucketName: string): Promise<S3Output> {
    const s3Output = new S3Output({
      bucketName: bucketName,
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    return this.bitMovinClient.encoding.outputs.s3.create(s3Output);
  }
  /**
   * Creates a configuration for the H.264 video codec to be applied to video streams.
   *
   * <p>The output resolution is defined by setting the height to 1080 pixels. Width will be
   * determined automatically to maintain the aspect ratio of your input video.
   *
   * <p>To keep things simple, we use a quality-optimized VoD preset configuration, which will apply
   * proven settings for the codec. See <a
   * href="https://bitmovin.com/docs/encoding/tutorials/how-to-optimize-your-h264-codec-configuration-for-different-use-cases">How
   * to optimize your H264 codec configuration for different use-cases</a> for alternative presets.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/configurations#/Encoding/PostEncodingConfigurationsVideoH264
   *
   * @param width The width of the output video
   * @param height The height of the output video
   * @param bitrate The target bitrate of the output video
   */
  async createH264VideoConfig(
    width: number,
    height: number,
    bitrate: number,
  ): Promise<H264VideoConfiguration> {
    const config = new H264VideoConfiguration({
      name: `H.264 ${height}p ${Math.round(bitrate / 1000)} Kbit/s`,
      presetConfiguration: PresetConfiguration.VOD_STANDARD,
      height: height,
      width: width,
      bitrate: bitrate,
    });

    return this.bitMovinClient.encoding.configurations.video.h264.create(
      config,
    );
  }

  /**
   * Creates a configuration for the AAC audio codec to be applied to audio streams.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/configurations#/Encoding/PostEncodingConfigurationsAudioAac
   *
   * @param bitrate The target bitrate for the encoded audio
   */
  async createAacAudioConfig(bitrate: number): Promise<AacAudioConfiguration> {
    const config = new AacAudioConfiguration({
      name: `AAC ${Math.round(bitrate / 1000)} kbit/s`,
      bitrate: bitrate,
    });

    return this.bitMovinClient.encoding.configurations.audio.aac.create(config);
  }

  /**
   * Adds a video or audio stream to an encoding
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/encodings#/Encoding/PostEncodingEncodingsStreamsByEncodingId
   *
   * @param encoding The encoding to which the stream will be added
   * @param input The input resource providing the input file
   * @param inputPath The path to the input file
   * @param codecConfiguration The codec configuration to be applied to the stream
   */
  async createStream(
    encoding: Encoding,
    input: Input,
    inputPath: string,
    codecConfiguration: CodecConfiguration,
  ): Promise<Stream> {
    const streamInput = new StreamInput({
      inputId: input.id,
      inputPath: inputPath,
      selectionMode: StreamSelectionMode.AUTO,
    });

    const stream = new Stream({
      inputStreams: [streamInput],
      codecConfigId: codecConfiguration.id,
    });

    return this.bitMovinClient.encoding.encodings.streams.create(
      encoding.id!,
      stream,
    );
  }

  /**
   * Creates a fragmented MP4 muxing. This will generate segments with a given segment length for
   * adaptive streaming.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/all#/Encoding/PostEncodingEncodingsMuxingsFmp4ByEncodingId
   *
   * @param encoding The encoding where to add the muxing to
   * @param output The output that should be used for the muxing to write the segments to
   * @param outputPath The output path where the fragmented segments will be written to
   * @param stream The stream that is associated with the muxing
   */
  async createFmp4Muxing(
    encoding: Encoding,
    output: Output,
    outputPath: string,
    stream: Stream,
  ): Promise<Fmp4Muxing> {
    const muxing = new Fmp4Muxing({
      segmentLength: 4.0,
      outputs: [this.buildEncodingOutput(output, outputPath)],
      streams: [new MuxingStream({ streamId: stream.id })],
    });

    return this.bitMovinClient.encoding.encodings.muxings.fmp4.create(
      encoding.id!,
      muxing,
    );
  }

  /**
   * Creates a fragmented MP4 muxing. This will split the output into continuously numbered segments
   * of a given length for adaptive streaming. However, the unencrypted segments will not be written
   * to a permanent storage as there's no output defined for the muxing. Instead, an output needs to
   * be defined for the DRM configuration resource which will later be added to this muxing.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/all#/Encoding/PostEncodingEncodingsMuxingsFmp4ByEncodingId
   *
   * @param encoding The encoding to which the muxing will be added
   * @param stream The stream to be muxed
   */
  async createFmp4MuxingDrm(
    encoding: Encoding,
    stream: Stream,
  ): Promise<Fmp4Muxing> {
    const muxingStream = new MuxingStream({
      streamId: stream.id,
    });

    const muxing = new Fmp4Muxing({
      streams: [muxingStream],
      segmentLength: 4,
    });

    return this.bitMovinClient.encoding.encodings.muxings.fmp4.create(
      encoding.id!,
      muxing,
    );
  }

  buildEncodingOutput(output: Output, outputPath: string): EncodingOutput {
    const aclEntry = new AclEntry({
      permission: AclPermission.PUBLIC_READ,
    });

    return new EncodingOutput({
      outputPath: outputPath,
      outputId: output.id,
      acl: [aclEntry],
    });
  }

  /**
   * Creates a DASH default manifest that automatically includes all representations configured in
   * the encoding.
   *
   * <p>API endpoint:
   * https://bitmovin.com/docs/encoding/api-reference/sections/manifests#/Encoding/PostEncodingManifestsDash
   *
   * @param encoding The encoding for which the manifest should be generated
   * @param output The output to which the manifest should be written
   * @param outputPath The path to which the manifest should be written
   */
  async createDefaultDashManifest(
    encoding: Encoding,
    output: Output,
    outputPath: string,
  ): Promise<DashManifest> {
    const dashManifestDefault = new DashManifestDefault({
      encodingId: encoding.id,
      manifestName: 'stream.mpd',
      version: DashManifestDefaultVersion.V1,
      outputs: [this.buildEncodingOutput(output, outputPath)],
    });

    return await this.bitMovinClient.encoding.manifests.dash.default.create(
      dashManifestDefault,
    );
  }

  async createDefaultHlsManifest(
    encoding: Encoding,
    output: Output,
    outputPath: string,
  ): Promise<HlsManifest> {
    const hlsManifestDefault = new HlsManifestDefault({
      encodingId: encoding.id,
      outputs: [this.buildEncodingOutput(output, outputPath)],
      name: 'master.m3u8',
      manifestName: 'master.m3u8',
      version: HlsManifestDefaultVersion.V1,
    });

    return await this.bitMovinClient.encoding.manifests.hls.default.create(
      hlsManifestDefault,
    );
  }

  buildManifestResource(manifest: Manifest) {
    return new ManifestResource({
      manifestId: manifest.id,
    });
  }

  logTaskErrors(task: Task): void {
    if (task.messages == undefined) {
      return;
    }
    task
      .messages!.filter((msg) => msg.type === MessageType.ERROR)
      .forEach((msg) => console.error(msg.text));
  }

  timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Starts the actual encoding process and periodically polls its status until it reaches a final
   * state
   *
   * <p>API endpoints:
   * https://bitmovin.com/docs/encoding/api-reference/all#/Encoding/PostEncodingEncodingsStartByEncodingId
   * https://bitmovin.com/docs/encoding/api-reference/sections/encodings#/Encoding/GetEncodingEncodingsStatusByEncodingId
   *
   * <p>Please note that you can also use our webhooks API instead of polling the status. For more
   * information consult the API spec:
   * https://bitmovin.com/docs/encoding/api-reference/sections/notifications-webhooks
   *
   * @param encoding The encoding to be started
   * @param startEncodingRequest The request object to be sent with the start call
   */
  async executeEncoding(
    encoding: Encoding,
    startEncodingRequest: StartEncodingRequest,
  ): Promise<void> {
    await this.bitMovinClient.encoding.encodings.start(
      encoding.id!,
      startEncodingRequest,
    );

    let task: Task;
    do {
      await this.timeout(5000);
      task = await this.bitMovinClient.encoding.encodings.status(encoding.id!);
      console.log(
        `Encoding status is ${task.status} (progress: ${task.progress} %)`,
      );
    } while (task.status !== Status.FINISHED && task.status !== Status.ERROR);

    if (task.status === Status.ERROR) {
      this.logTaskErrors(task);
      throw new Error('Encoding failed');
    }

    console.log('Encoding finished successfully');
  }

  async startEncodingAndSubscribeToWebHook(
    encoding: Encoding,
    startEncodingRequest: StartEncodingRequest,
  ) {
    const { id } = await this.bitMovinClient.encoding.encodings.start(
      encoding.id!,
      startEncodingRequest,
    );

    //add code to subscribe to webhook
    const sub =
      await this.bitMovinClient.notifications.webhooks.encoding.encodings.finished.createByEncodingId(
        encoding.id,
        {
          url: 'https://278b-100-15-220-37.ngrok-free.app/encodings/update-webhook',
          method: WebhookHttpMethod.POST,
        },
      );
    const sub2 =
      await this.bitMovinClient.notifications.webhooks.encoding.encodings.error.createByEncodingId(
        encoding.id,
        {
          url: 'https://278b-100-15-220-37.ngrok-free.app/encodings/update-webhook',
          method: WebhookHttpMethod.POST,
        },
      );
    console.log(sub);
    console.log(sub2);

    return id;
  }
  async saveEncoding(
    saveEncodingOption: SaveEncodingOption,
  ): Promise<EncodingJob> {
    const encoding = new this.encodingModel(saveEncodingOption);
    const encodingDoc = await encoding.save();

    return {
      id: encodingDoc._id.toString(),
      userId: encodingDoc.userId,
      status: encodingDoc.status,
      description: encodingDoc.description,
      foreignId: encodingDoc.foreignId,
      thirdPartyEncoder: encodingDoc.thirdPartyEncoder,
    };
  }

  async findEncodingById(id: string): Promise<EncodingJob> {
    const encodingDoc = await this.encodingModel.findById(id);

    return {
      id: encodingDoc._id.toString(),
      userId: encodingDoc.userId,
      status: encodingDoc.status,
      description: encodingDoc.description,
      foreignId: encodingDoc.foreignId,
      thirdPartyEncoder: encodingDoc.thirdPartyEncoder,
    };
  }

  async findEncodings(
    findEncodingsOption: FindEncodingsOption,
  ): Promise<EncodingJob> {
    const encodingDoc = await this.encodingModel.findOne(findEncodingsOption);

    return {
      id: encodingDoc._id.toString(),
      userId: encodingDoc.userId,
      status: encodingDoc.status,
      description: encodingDoc.description,
      foreignId: encodingDoc.foreignId,
      thirdPartyEncoder: encodingDoc.thirdPartyEncoder,
    };
  }

  async updateEncodingById(id: string, updateOption: UpdateOption) {
    const encodingDoc = await this.encodingModel.findOneAndUpdate(
      { _id: id },
      updateOption,
    );

    return {
      id: encodingDoc._id.toString(),
      userId: encodingDoc.userId,
      status: encodingDoc.status,
      description: encodingDoc.description,
      foreignId: encodingDoc.foreignId,
      thirdPartyEncoder: encodingDoc.thirdPartyEncoder,
    };
  }

  async updateEncoding(
    filters: FindEncodingsOption,
    updateOption: UpdateOption,
  ) {
    const encodingDoc = await this.encodingModel.findOneAndUpdate(
      filters,
      updateOption,
    );

    return {
      id: encodingDoc._id.toString(),
      userId: encodingDoc.userId,
      status: encodingDoc.status,
      description: encodingDoc.description,
      foreignId: encodingDoc.foreignId,
      thirdPartyEncoder: encodingDoc.thirdPartyEncoder,
    };
  }
}
