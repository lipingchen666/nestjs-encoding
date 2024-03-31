import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Headers,
  HttpException,
  HttpStatus,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { CreateEncodingDto } from './dtos/create-endoing.dto';
import {
  ENCODING_SERVICE,
  EncodingService,
  EncodingStatus,
  SaveEncodingOption,
} from './interfaces/encoding.service.interface';
import { SaveEncodingDto } from './dtos/save-encoding.dto';
import { EncodeResponseDto } from './dtos/encode-response.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { SaveEncodingResponseDto } from './dtos/save-encoding-response.dto';
import { FindEncodingByIdResponseDto } from './dtos/find-encoding-by-id-response.dto';
import { FindEncodingsResponseDto } from './dtos/find-encodings-response.dto';
import { EventType, updateWebhookDto } from './dtos/update-webhook.dto';
import { createHmac } from 'crypto';

@Controller('encodings')
export class EncodingController {
  constructor(
    @Inject(ENCODING_SERVICE)
    private readonly encodingService: EncodingService,
  ) {}
  @Post('/encode')
  @HttpCode(200)
  async encode(
    @Body() createEncodingDto: CreateEncodingDto,
  ): Promise<EncodeResponseDto> {
    const encodingOptions =
      this.encodingService.generateEncodingOptions(createEncodingDto);

    const encodingJob = await this.encodingService.encode(encodingOptions);

    return plainToInstance(EncodeResponseDto, encodingJob);
  }

  @Get()
  async getEncodings() {
    return ['cool'];
  }

  @Get(':id')
  async getOneEncodingById(@Param('id') id: string) {
    const encodingJob = await this.encodingService.findEncodingById(id);

    return plainToInstance(FindEncodingByIdResponseDto, encodingJob);
  }

  @Get('/users/:userId')
  async getEncodingsByUserId(@Param('userId') userId: string) {
    const encodingJob = await this.encodingService.findEncodings({ userId });

    return plainToInstance(FindEncodingsResponseDto, encodingJob);
  }

  @Post()
  async saveEncoding(
    @Body() saveEncodingDto: SaveEncodingDto,
  ): Promise<SaveEncodingResponseDto> {
    const saveEncodingOption = instanceToPlain(
      saveEncodingDto,
    ) as SaveEncodingOption;
    const encodingJob =
      await this.encodingService.saveEncoding(saveEncodingOption);

    return plainToInstance(SaveEncodingResponseDto, encodingJob);
  }

  @Post('/update-webhook')
  async updateEncodingStatusWebHook(
    @Req() req: RawBodyRequest<Request>,
    @Body() updateEvent: updateWebhookDto,
    @Headers() headers,
  ) {
    const rawBody = req.rawBody;
    const signature = headers['bitmovin-signature'];
    const hash = createHmac('sha512', process.env.BITMOVING_WEBHOOK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    const isValid = signature === hash;

    if (!isValid) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    if (updateEvent.eventType === EventType.ENCODING_FINISHED) {
      await this.encodingService.updateEncoding(
        { foreignId: updateEvent.resourceId },
        { status: EncodingStatus.FINISHED },
      );
    }
    if (updateEvent.eventType === EventType.ENCODING_ERROR) {
      await this.encodingService.updateEncoding(
        { foreignId: updateEvent.resourceId },
        { status: EncodingStatus.Error },
      );
    }
  }
}
