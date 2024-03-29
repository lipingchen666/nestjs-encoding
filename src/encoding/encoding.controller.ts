import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { CreateEncodingDto } from './dtos/create-endoing.dto';
import {
  ENCODING_SERVICE,
  EncodingService,
  SaveEncodingOption,
} from './interfaces/encoding.service.interface';
import { SaveEncodingDto } from './dtos/save-encoding.dto';
import { EncodeResponseDto } from './dtos/encode-response.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { SaveEncodingResponseDto } from './dtos/save-encoding-response.dto';
import { FindEncodingByIdResponseDto } from "./dtos/find-encoding-by-id-response.dto";

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
  async getEncodingsByUserId(@Param('userId') userId: any) {
    return userId;
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
}
