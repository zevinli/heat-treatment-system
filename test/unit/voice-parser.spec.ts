import { VoiceService } from '../../server/modules/voice/voice.service';
import {
  isVoiceResultComplete,
  normalizeBillingUnit,
  normalizeVoiceFields,
  parseSpokenNumber,
  parseVoiceLocally,
} from '../../server/modules/voice/voice-parser';

describe('voice input parsing and fallback', () => {
  it.each([
    ['十', 10],
    ['一百零二', 102],
    ['两百三十五', 235],
    ['一万二千三百四十五', 12345],
    ['十二点五', 12.5],
    ['85.5', 85.5],
  ])('parses spoken number %s', (input, expected) => {
    expect(parseSpokenNumber(input)).toBe(expected);
  });

  it('normalizes field units and rejects unsafe numeric values', () => {
    expect(normalizeBillingUnit('个')).toBe('件');
    expect(normalizeBillingUnit('公斤')).toBe('kg');
    expect(normalizeBillingUnit('吨')).toBeUndefined();
    expect(normalizeVoiceFields({ quantity: -1, weight: -2, unitPrice: -3, unit: '个' }))
      .toEqual(expect.objectContaining({ quantity: undefined, weight: undefined, unitPrice: undefined, unit: '件' }));
  });

  it.each([
    ['入库齿轮一百个，单价二十五元，计价单位是件，重量五十公斤，材质四十五号钢', {
      productName: '齿轮', quantity: 100, unitPrice: 25, unit: '件', weight: 50, material: '四十五号钢',
    }],
    ['来货轴套两百件，单价三十元一件，三十公斤，淬火处理', {
      productName: '轴套', quantity: 200, unitPrice: 30, unit: '件', weight: 30, process: '淬火',
    }],
    ['轴承五十个，单价五十元一个，材质不锈钢，加急', {
      productName: '轴承', quantity: 50, unitPrice: 50, unit: '件', material: '不锈钢', remark: '加急',
    }],
    ['入库炉料十件，单价两元，重量零点五吨', {
      productName: '炉料', quantity: 10, unitPrice: 2, unit: '件', weight: 500,
    }],
  ])('parses common factory phrase: %s', (phrase, expected) => {
    const result = parseVoiceLocally(phrase);
    expect(result).toEqual(expect.objectContaining(expected));
    expect(isVoiceResultComplete(result)).toBe(true);
  });

  it('uses deterministic local parsing without calling remote AI', async () => {
    const capability = { load: jest.fn() };
    const service = new VoiceService(capability as any);
    const result = await service.parseVoiceInput({
      text: '入库齿轮一百件，单价二十五元，重量五十公斤',
      context: 'inbound',
    });
    expect(result).toMatchObject({ success: true, data: { productName: '齿轮', quantity: 100, unit: '件', unitPrice: 25 } });
    expect(capability.load).not.toHaveBeenCalled();
  });

  it('keeps locally recognized fields editable when remote AI is unavailable', async () => {
    const capability = { load: jest.fn(() => ({ call: jest.fn().mockRejectedValue(new Error('offline')) })) };
    const service = new VoiceService(capability as any);
    const result = await service.parseVoiceInput({ text: '入库特殊齿轮', context: 'inbound' });
    expect(result).toMatchObject({ success: true, data: { productName: '特殊齿轮' } });
  });

  it('rejects empty and oversized input before invoking AI', async () => {
    const capability = { load: jest.fn() };
    const service = new VoiceService(capability as any);
    await expect(service.parseVoiceInput({ text: '  ' })).resolves.toMatchObject({ success: false, error: '输入文本为空' });
    await expect(service.parseVoiceInput({ text: '入'.repeat(1001) })).resolves.toMatchObject({ success: false, error: '语音文字不能超过1000字' });
    expect(capability.load).not.toHaveBeenCalled();
  });
});
