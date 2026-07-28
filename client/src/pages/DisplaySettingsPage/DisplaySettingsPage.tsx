import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Monitor, Type, Check } from 'lucide-react';
import { useDisplaySettings, FontSizeLevel, fontSizeLabels } from '@/hooks/useDisplaySettings';
import { cn } from '@/lib/utils';

const fontSizeDescriptions: Record<FontSizeLevel, string> = {
  small: '当前标准大小，适合大多数用户',
  medium: '稍大字号，阅读更舒适',
  large: '较大字号，适合视力较弱用户',
  xlarge: '特大字号，最大化可读性',
};

const DisplaySettingsPage: React.FC = () => {
  const { fontSize, setFontSize } = useDisplaySettings();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Monitor className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">页面显示设置</h1>
          <p className="text-sm text-muted-foreground">自定义系统界面显示效果</p>
        </div>
      </div>

      {/* 字体大小设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="w-5 h-5 text-primary" />
            字体大小
          </CardTitle>
          <CardDescription>
            调整整个系统的字体显示大小，当前为{fontSizeLabels[fontSize]}（{fontSizeDescriptions[fontSize]}）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(fontSizeLabels) as FontSizeLevel[]).map((level) => (
              <Button
                key={level}
                variant={fontSize === level ? 'default' : 'outline'}
                className={cn(
                  'h-auto py-4 flex flex-col items-center gap-2 transition-all',
                  fontSize === level && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => setFontSize(level)}
              >
                <span 
                  className="font-medium"
                  style={{ fontSize: level === 'small' ? '14px' : level === 'medium' ? '16px' : level === 'large' ? '18px' : '20px' }}
                >
                  Aa
                </span>
                <span className="text-sm">{fontSizeLabels[level]}</span>
                {fontSize === level && (
                  <Check className="w-4 h-4 absolute top-2 right-2" />
                )}
              </Button>
            ))}
          </div>
          
          {/* 预览区域 */}
          <div className="mt-6 p-4 border rounded-lg bg-muted/30">
            <Label className="text-sm text-muted-foreground mb-2 block">预览效果</Label>
            <div className="space-y-2">
              <p className="text-lg font-bold">这是标题文字示例</p>
              <p className="text-base">这是正文文字示例，您可以通过上方选项调整字体大小</p>
              <p className="text-sm text-muted-foreground">这是辅助文字示例，字号会随设置联动调整</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 说明卡片 */}
      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-blue-100 text-blue-600 mt-0.5">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">提示</h4>
              <p className="text-sm text-blue-700 mt-1">
                字体大小设置会自动保存并应用到所有页面。如果您在使用过程中发现显示异常，
                建议尝试刷新页面或重新登录系统。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisplaySettingsPage;
