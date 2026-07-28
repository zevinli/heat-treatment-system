import { Controller, Post, Body, Logger } from '@nestjs/common';
import { VoiceService, ParseVoiceInputDto, ParsedVoiceResult } from './voice.service';

@Controller('api/voice')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);

  constructor(private readonly voiceService: VoiceService) {}

  @Post('parse')
  async parseVoiceInput(
    @Body() dto: ParseVoiceInputDto,
  ): Promise<ParsedVoiceResult> {
    this.logger.debug(`解析语音输入: ${dto.text}`);
    return this.voiceService.parseVoiceInput(dto);
  }
}
