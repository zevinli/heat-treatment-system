import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInputButton } from './VoiceInputButton';
import { parseVoiceInput, VoiceParseResult } from '@/api';
import { Mic, Check, X, Lightbulb, Loader2, Asterisk } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface VoiceInputPanelProps {
  onApply: (data: NonNullable<VoiceParseResult['data']>) => void;
  onCancel: () => void;
}

export const VoiceInputPanel: React.FC<VoiceInputPanelProps> = ({
  onApply,
  onCancel,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
  const [editedData, setEditedData] = useState<NonNullable<VoiceParseResult['data']>>({});

  const handleVoiceResult = useCallback(async (text: string) => {
    setIsParsing(true);
    try {
      const result = await parseVoiceInput(text, 'inbound');
      setParseResult(result);
      
      if (result.success && result.data) {
        setEditedData(result.data);
        toast.success('语音识别成功，请核对信息');
      } else {
        toast.error(result.error || '解析失败，请重试');
      }
    } catch (error) {
      logger.error('语音解析失败:', error);
      toast.error('语音解析服务异常，请稍后重试');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleVoiceError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const handleApply = () => {
    // 验证必填字段
    if (!editedData.productName || !editedData.productName.trim()) {
      toast.error('产品名称不能为空');
      return;
    }
    if (!editedData.unit || !editedData.unit.trim()) {
      toast.error('计价单位不能为空');
      return;
    }
    if (editedData.unitPrice === undefined || editedData.unitPrice === null) {
      toast.error('单价不能为空');
      return;
    }
    
    onApply(editedData);
    toast.success('已应用语音录入数据');
  };

  const handleFieldChange = (field: keyof NonNullable<VoiceParseResult['data']>, value: string | number) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const examplePhrases = [
    '入库齿轮一百个，单价二十五元，计价单位是件，重量五十公斤，材质四十五号钢',
    '来货轴套两百件，单价三十元一件，三十公斤，淬火处理',
    '轴承五十个，单价五十元一个，材质不锈钢，加急',
  ];

  // 必填字段标记组件
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <Label className="flex items-center gap-1">
      {children}
      <Asterisk className="h-3 w-3 text-destructive" />
    </Label>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          语音录入
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 语音输入按钮和说明 */}
        {!parseResult && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <VoiceInputButton
                onResult={handleVoiceResult}
                onError={handleVoiceError}
                className="scale-150"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              点击麦克风按钮，说出产品信息
            </p>
            
            {/* 示例话术 */}
            <div className="bg-muted/50 rounded-lg p-3 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Lightbulb className="h-3 w-3" />
                <span>您可以这样说：</span>
              </div>
              <ul className="space-y-1.5">
                {examplePhrases.map((phrase, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    onClick={() => handleVoiceResult(phrase)}
                  >
                    "{phrase}"
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 解析中状态 */}
        {isParsing && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">正在解析语音内容...</p>
          </div>
        )}

        {/* 解析结果编辑 */}
        {parseResult?.success && !isParsing && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              原始语音：「{parseResult.rawText}」
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <RequiredLabel>产品名称</RequiredLabel>
                <Input
                  id="productName"
                  value={editedData.productName || ''}
                  onChange={(e) => handleFieldChange('productName', e.target.value)}
                  placeholder="如：齿轮、轴套"
                  className={!editedData.productName ? 'border-destructive' : ''}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="quantity">数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={editedData.quantity || ''}
                  onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value) || 0)}
                  placeholder="如：100"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="weight">重量 (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={editedData.weight || ''}
                  onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value) || 0)}
                  placeholder="如：50"
                />
              </div>
              
              <div className="space-y-1.5">
                <RequiredLabel>计价单位</RequiredLabel>
                <Input
                  id="unit"
                  value={editedData.unit || ''}
                  onChange={(e) => handleFieldChange('unit', e.target.value)}
                  placeholder="如：件、个、kg"
                  className={!editedData.unit ? 'border-destructive' : ''}
                />
              </div>
              
              <div className="space-y-1.5">
                <RequiredLabel>单价 (元)</RequiredLabel>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={editedData.unitPrice || ''}
                  onChange={(e) => handleFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
                  placeholder="如：25"
                  className={editedData.unitPrice === undefined || editedData.unitPrice === null ? 'border-destructive' : ''}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="material">材质</Label>
                <Input
                  id="material"
                  value={editedData.material || ''}
                  onChange={(e) => handleFieldChange('material', e.target.value)}
                  placeholder="如：45#钢"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="process">工艺</Label>
                <Input
                  id="process"
                  value={editedData.process || ''}
                  onChange={(e) => handleFieldChange('process', e.target.value)}
                  placeholder="如：调质、淬火"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="remark">备注</Label>
                <Input
                  id="remark"
                  value={editedData.remark || ''}
                  onChange={(e) => handleFieldChange('remark', e.target.value)}
                  placeholder="如：加急"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button className="flex-1" onClick={handleApply}>
                <Check className="h-4 w-4 mr-1" />
                应用
              </Button>
            </div>
          </div>
        )}

        {/* 解析失败 */}
        {parseResult && !parseResult.success && !isParsing && (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-3">{parseResult.error}</p>
            <Button variant="outline" onClick={() => setParseResult(null)}>
              重试
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceInputPanel;
