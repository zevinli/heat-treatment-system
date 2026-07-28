"use client"

import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { capabilityClient } from '@lark-apaas/client-toolkit';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';

// AI识别结果类型
export interface AIRecognitionResult {
  产品名称?: string;
  材质?: string;
  工艺?: string;
  工件编号?: string;
  单位?: string;
  技术要求?: string;
}

// 字段置信度类型
interface FieldConfidence {
  field: keyof AIRecognitionResult;
  value: string;
  confidence: 'high' | 'medium' | 'low';
}

interface AIRecognitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: AIRecognitionResult) => void;
}

export const AIRecognitionDialog: React.FC<AIRecognitionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<AIRecognitionResult | null>(null);
  const [fieldConfidences, setFieldConfidences] = useState<FieldConfidence[]>([]);
  const [editedResult, setEditedResult] = useState<AIRecognitionResult>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 重置状态
  const resetState = useCallback(() => {
    setImageUrl('');
    setIsUploading(false);
    setIsRecognizing(false);
    setResult(null);
    setFieldConfidences([]);
    setEditedResult({});
  }, []);

  // 处理关闭
  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  // 上传图片到存储
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const dataloom = await getDataloom();
      const bucketId = getDefaultBucketId();
      
      const { data, error } = await dataloom
        .storage
        .from(bucketId)
        .uploadFile(file);

      if (error || !data?.download_url) {
        throw new Error(error?.message || '上传失败：未获取到文件URL');
      }

      return data.download_url;
    } catch (error) {
      logger.error({ level: 'error', args: [`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`] });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // 执行AI识别
  const performRecognition = useCallback(async (url: string) => {
    setIsRecognizing(true);
    try {
      const recognitionResult = await capabilityClient
        .load('heat_treatment_inventory_image_extract')
        .call<AIRecognitionResult>('imageToJson', {
          images: [url],
        });

      logger.log({ level: 'info', args: [`AI识别结果: ${JSON.stringify(recognitionResult)}`] });

      // 处理识别结果，计算置信度
      const fields: FieldConfidence[] = [
        { field: '产品名称', value: recognitionResult.产品名称 || '', confidence: calculateConfidence(recognitionResult.产品名称) },
        { field: '材质', value: recognitionResult.材质 || '', confidence: calculateConfidence(recognitionResult.材质) },
        { field: '工艺', value: recognitionResult.工艺 || '', confidence: calculateConfidence(recognitionResult.工艺) },
        { field: '工件编号', value: recognitionResult.工件编号 || '', confidence: calculateConfidence(recognitionResult.工件编号) },
        { field: '单位', value: recognitionResult.单位 || '', confidence: calculateConfidence(recognitionResult.单位) },
        { field: '技术要求', value: recognitionResult.技术要求 || '', confidence: calculateConfidence(recognitionResult.技术要求) },
      ];

      setFieldConfidences(fields);
      setResult(recognitionResult);
      setEditedResult(recognitionResult);
      
      toast.success('识别完成，请核对结果');
    } catch (error) {
      logger.error({ level: 'error', args: [`AI识别失败: ${error instanceof Error ? error.message : '未知错误'}`] });
      toast.error('识别失败，请重试或手动输入');
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  // 计算置信度（基于字段值的存在性和长度）
  const calculateConfidence = (value?: string): 'high' | 'medium' | 'low' => {
    if (!value || value === '未识别' || value === '无法识别' || value === '') {
      return 'low';
    }
    if (value.length >= 2 && value.length <= 20) {
      return 'high';
    }
    return 'medium';
  };

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过10MB');
      return;
    }

    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      await performRecognition(url);
    } catch (error) {
      toast.error('图片处理失败，请重试');
    }
  }, [uploadImage, performRecognition]);

  // 处理input文件选择
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-primary', 'bg-primary/5');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 处理粘贴
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileSelect(file);
          break;
        }
      }
    }
  }, [handleFileSelect]);

  // 重新识别
  const handleRetry = useCallback(() => {
    if (imageUrl) {
      performRecognition(imageUrl);
    }
  }, [imageUrl, performRecognition]);

  // 确认填充
  const handleConfirm = useCallback(() => {
    onConfirm(editedResult);
    handleClose();
  }, [editedResult, onConfirm, handleClose]);

  // 获取置信度图标
  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'low':
        return <HelpCircle className="w-4 h-4 text-red-500" />;
    }
  };

  // 获取置信度文本
  const getConfidenceText = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return '可信';
      case 'medium':
        return '待核对';
      case 'low':
        return '需确认';
    }
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'emerald' as const;
      case 'medium':
        return 'orange' as const;
      case 'low':
        return 'red' as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPaste={handlePaste}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI图片识别
          </DialogTitle>
        </DialogHeader>

        {/* 上传区域 */}
        {!imageUrl && !isUploading && (
          <div
            ref={dropZoneRef}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-muted/50"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Camera className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium">点击或拖拽上传产品图片</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 JPG、PNG 格式，最大 10MB
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="w-3 h-3" />
                <span>也可直接粘贴截图</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {/* 上传中 */}
        {isUploading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">正在上传图片...</p>
          </div>
        )}

        {/* 图片预览和识别结果 */}
        {imageUrl && !isUploading && (
          <div className="space-y-4">
            {/* 图片预览 */}
            <div className="relative">
              <img
                src={imageUrl}
                alt="识别图片"
                className="w-full h-48 object-contain bg-muted rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                onClick={() => {
                  resetState();
                  fileInputRef.current?.click();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 识别中 */}
            {isRecognizing && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
                <p className="text-sm font-medium">AI正在识别图片...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  正在提取产品名称、材质、工艺等信息
                </p>
              </div>
            )}

            {/* 识别结果 */}
            {result && !isRecognizing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">识别结果</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="h-7 gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    重新识别
                  </Button>
                </div>

                <div className="space-y-3">
                  {fieldConfidences.map(({ field, value, confidence }) => (
                    <div key={field} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{field}</Label>
                        <Badge
                          color={getConfidenceColor(confidence)}
                          className="text-[10px] h-4 gap-1"
                        >
                          {getConfidenceIcon(confidence)}
                          {getConfidenceText(confidence)}
                        </Badge>
                      </div>
                      <Input
                        value={editedResult[field] || ''}
                        onChange={(e) =>
                          setEditedResult((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                        placeholder={`请输入${field}`}
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                  <p className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    提示：识别结果仅供参考，请务必核对后再确认填充
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          {result && !isRecognizing && (
            <Button onClick={handleConfirm} className="gap-1">
              <CheckCircle className="w-4 h-4" />
              确认填充
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIRecognitionDialog;
