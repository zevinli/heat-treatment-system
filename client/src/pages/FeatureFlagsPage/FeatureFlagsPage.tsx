import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Mic, Brain, AlertCircle } from 'lucide-react';
import { useData } from '@/data/DataContext';

export default function FeatureFlagsPage() {
  const { featureConfig, toggleFeature } = useData();

  const features = [
    {
      key: 'voiceInput' as const,
      title: '语音录入',
      description: '允许通过语音输入快速录入产品信息，适用于现场快速操作场景',
      icon: Mic,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'aiRecognition' as const,
      title: 'AI图片识别',
      description: '自动识别产品图片中的文字信息，智能提取产品名称、规格等数据',
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">实验功能</h1>
          <p className="text-muted-foreground mt-1">
            启用或禁用实验性功能。这些功能处于测试阶段，可能会影响系统稳定性
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            <CardTitle>功能开关</CardTitle>
          </div>
          <CardDescription>
            控制实验性功能的启用状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {features.map((feature) => {
            const config = featureConfig[feature.key];
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className={`p-4 border rounded-lg transition-all ${
                  config.enabled ? 'border-primary/30 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                      <Icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={config.enabled ? 'default' : 'secondary'}>
                      {config.enabled ? '已启用' : '已禁用'}
                    </Badge>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={() => toggleFeature(feature.key)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">使用说明</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>启用实验功能后即可使用，无使用次数限制</li>
              <li>语音录入功能需要浏览器支持麦克风权限</li>
              <li>AI图片识别需要上传清晰的产品图片以获得最佳效果</li>
              <li>如遇问题可随时关闭功能</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
