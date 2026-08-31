import { Injectable, Logger } from '@nestjs/common';
import { CapabilityService } from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import { isVoiceResultComplete, normalizeVoiceFields, parseVoiceLocally, type ParsedVoiceFields } from './voice-parser';

export interface ParseVoiceInputDto {
  text: string;
  context?: 'inbound' | 'outbound' | 'inventory';
}

export interface ParsedVoiceResult {
  success: boolean;
  data?: {
    productName?: string;
    quantity?: number;
    weight?: number;
    unit?: string;
    unitPrice?: number;
    material?: string;
    process?: string;
    customerName?: string;
    remark?: string;
  };
  rawText: string;
  error?: string;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @Inject() private readonly capabilityService: CapabilityService,
  ) {}

  async parseVoiceInput(dto: ParseVoiceInputDto): Promise<ParsedVoiceResult> {
    const { text, context = 'inbound' } = dto;

    this.logger.log(`收到语音解析请求: text="${text}", context=${context}`);

    if (!text || text.trim().length === 0) {
      this.logger.warn('输入文本为空');
      return {
        success: false,
        rawText: text,
        error: '输入文本为空',
      };
    }
    if (text.length > 1000) {
      return { success: false, rawText: text, error: '语音文字不能超过1000字' };
    }

    const localResult = parseVoiceLocally(text);
    // 常见现场话术在本地即可稳定解析，避免网络或 AI 服务波动阻塞收货。
    if (isVoiceResultComplete(localResult)) {
      return { success: true, data: localResult, rawText: text };
    }

    try {
      // 使用智能写作插件进行语义解析
      // 构建prompt来提取结构化数据
      const prompt = this.buildParsePrompt(text, context);
      this.logger.log(`构建的prompt长度: ${prompt.length}`);

      if (!prompt || prompt.trim().length === 0) {
        throw new Error('构建的prompt为空');
      }

      // 调用AI进行解析
      const aiResult = await this.callAIForParsing(prompt);
      const result = { ...localResult, ...Object.fromEntries(Object.entries(aiResult).filter(([, value]) => value !== undefined)) };

      return {
        success: true,
        data: result,
        rawText: text,
      };
    } catch (error) {
      this.logger.error('语音解析失败:', error);
      if (Object.values(localResult).some(value => value !== undefined)) {
        return {
          success: true,
          data: localResult,
          rawText: text,
        };
      }
      return {
        success: false,
        rawText: text,
        error: error instanceof Error ? error.message : '解析失败',
      };
    }
  }

  private buildParsePrompt(text: string, context: string): string {
    const contextDesc = context === 'inbound'
      ? '入库登记场景'
      : context === 'outbound'
        ? '出库发货场景'
        : '库存管理场景';

    const prompt = `请从以下语音输入中提取结构化数据，场景为：${contextDesc}。

语音输入："${text}"

请提取以下字段（JSON格式）：
- productName: 产品名称（必填，如：齿轮、轴套、轴承等）
- quantity: 数量（数字，如：100、50）
- weight: 重量（数字，单位公斤）
- unit: 计价单位（必填，如：件、个、kg、套等）
- unitPrice: 单价（数字，单位元，如：10.5、25）
- material: 材质（如：45#钢、不锈钢、铝合金等）
- process: 工艺（如：调质、淬火、回火等）
- customerName: 客户名称（如果有提到）
- remark: 备注信息（如加急、特殊要求等）

注意：
1. 中文数字请转为阿拉伯数字（如"一百"转为100）
2. productName（产品名称）、unit（计价单位）、unitPrice（单价）是必填字段，如果语音中未提及，请设为null
3. 只返回JSON对象，不要有任何其他文字

示例输出格式：
{
  "productName": "齿轮",
  "quantity": 100,
  "weight": 50,
  "unit": "件",
  "unitPrice": 25,
  "material": "45#钢",
  "process": "调质",
  "customerName": null,
  "remark": "加急"
}`;

    return prompt;
  }

  private async callAIForParsing(prompt: string): Promise<ParsedVoiceFields> {
    this.logger.log(`开始调用AI插件，prompt前50字符: ${prompt.substring(0, 50)}...`);

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('prompt不能为空');
    }

    try {
      this.logger.log(`调用AI插件，prompt长度: ${prompt.length}`);

      // 使用智能写作插件 - 只传递 prompt，modelID 和 modelParams 通过 formValue 模板自动填充
      const result = await this.capabilityService
        .load('intelligent_writing_quick_quality_1')
        .call('textGenerate', {
          prompt: prompt,
        });

      this.logger.log(`AI插件返回结果类型: ${typeof result}`);

      const resultData = result as { content?: string };

      if (!resultData?.content) {
        throw new Error('AI返回结果为空');
      }

      this.logger.log(`AI返回内容前100字符: ${resultData.content.substring(0, 100)}...`);

      // 解析JSON结果
      const jsonMatch = resultData.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从AI响应中提取JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return normalizeVoiceFields({
        productName: parsed.productName || undefined,
        quantity: parsed.quantity,
        weight: parsed.weight,
        unit: parsed.unit || undefined,
        unitPrice: parsed.unitPrice,
        material: parsed.material || undefined,
        process: parsed.process || undefined,
        customerName: parsed.customerName || undefined,
        remark: parsed.remark || undefined,
      });
    } catch (error) {
      this.logger.error('AI解析失败:', error);
      throw error;
    }
  }

}
