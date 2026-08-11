import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { useTenant } from '@/contexts/TenantContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Config = {
  bitableAppToken: string;
  baseUrl: string;
  isActive: boolean;
  tableInbound: string;
  tableOutbound: string;
  tableInventory: string;
  tableCustomer: string;
  tableReconciliation: string;
  tableQuality: string;
  tableProcess: string;
};

const emptyConfig: Config = {
  bitableAppToken: '', baseUrl: '', isActive: false,
  tableInbound: '', tableOutbound: '', tableInventory: '', tableCustomer: '',
  tableReconciliation: '', tableQuality: '', tableProcess: '',
};

const tableFields: Array<{ key: keyof Config; label: string; description: string }> = [
  { key: 'tableInbound', label: '来货登记表 ID', description: '来货单及产品明细' },
  { key: 'tableOutbound', label: '发货记录表 ID', description: '发货单、产品和批次' },
  { key: 'tableInventory', label: '库存快照表 ID', description: '按真实库存批次同步' },
  { key: 'tableCustomer', label: '客户总览表 ID', description: '客户、交易次数和回款率' },
  { key: 'tableReconciliation', label: '每日对账表 ID', description: '对账、开票及回款状态' },
  { key: 'tableQuality', label: '质检记录表 ID', description: '预留质检数据表' },
  { key: 'tableProcess', label: '工艺参数表 ID', description: '预留工艺参数数据表' },
];

export default function FeishuSettingsPage() {
  const { currentTenant } = useTenant();
  const [config, setConfig] = useState<Config>(emptyConfig);
  const [globalConfigured, setGlobalConfigured] = useState(false);
  const [queue, setQueue] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [repairing, setRepairing] = useState(false);

  const load = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const [statusResp, configResp, tablesResp] = await Promise.all([
        axiosForBackend.get('/api/integration/feishu/status'),
        axiosForBackend.get(`/api/integration/feishu/org/${currentTenant.orgCode}/config`),
        axiosForBackend.get('/api/integration/feishu/current/tables'),
      ]);
      setGlobalConfigured(Boolean(statusResp.data?.configured));
      setConfig({ ...emptyConfig, ...(configResp.data?.config || {}) });
      setQueue(tablesResp.data?.syncQueue || {});
    } catch (error: any) {
      toast.error(error.message || '读取飞书配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [currentTenant?.orgCode]);

  const update = (key: keyof Config, value: string | boolean) => {
    setConfig(previous => ({ ...previous, [key]: value }));
  };

  const save = async () => {
    if (!currentTenant) return;
    setSaving(true);
    try {
      await axiosForBackend.post(`/api/integration/feishu/org/${currentTenant.orgCode}/config`, config);
      toast.success('飞书多维表格配置已保存');
      await load();
    } catch (error: any) {
      toast.error(error.message || '保存飞书配置失败');
    } finally {
      setSaving(false);
    }
  };

  const provision = async () => {
    if (!currentTenant || !window.confirm('将为当前组织新建一套飞书多维表格。已有表格请使用手动配置，确认继续新建吗？')) return;
    setProvisioning(true);
    try {
      await axiosForBackend.post(`/api/integration/feishu/org/${currentTenant.orgCode}/provision`, {
        orgName: currentTenant.orgName,
      });
      toast.success('飞书多维表格已创建并启用');
      await load();
    } catch (error: any) {
      toast.error(error.message || '自动创建飞书多维表格失败');
    } finally {
      setProvisioning(false);
    }
  };

  const retryFailed = async () => {
    try {
      const response = await axiosForBackend.post('/api/integration/feishu/current/retry-failed');
      toast.success(`已重新排队 ${response.data?.retried || 0} 个失败任务`);
      await load();
    } catch (error: any) {
      toast.error(error.message || '重试失败');
    }
  };

  const validate = async () => {
    try {
      const response = await axiosForBackend.get('/api/integration/feishu/current/validate');
      if (response.data?.valid) {
        toast.success('七张飞书数据表及所需字段校验通过');
        return;
      }
      const invalid = Object.entries(response.data?.tables || {})
        .filter(([, result]: any) => !result.valid)
        .map(([name, result]: any) => `${name}${result.missingFields?.length ? ` 缺少：${result.missingFields.join('、')}` : ''}${result.typeMismatches?.length ? ` 类型错误：${result.typeMismatches.join('、')}` : ''}`)
        .join('；');
      toast.error(response.data?.error || invalid || '飞书表结构校验未通过', { duration: 10000 });
    } catch (error: any) {
      toast.error(error.message || '飞书表结构校验失败');
    }
  };

  const repairFields = async () => {
    if (!window.confirm('只会新增同步必需但缺失的字段，不会删除现有记录或字段。确认补齐吗？')) return;
    setRepairing(true);
    try {
      const response = await axiosForBackend.post('/api/integration/feishu/current/repair-fields');
      const count = Number(response.data?.addedCount || 0);
      if (response.data?.validation?.valid) toast.success(`表结构已修复，共补齐 ${count} 个字段`);
      else toast.warning(`已补齐 ${count} 个字段，仍有字段类型问题，请再次校验查看`);
    } catch (error: any) {
      toast.error(error.message || '补齐飞书字段失败');
    } finally {
      setRepairing(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!globalConfigured && (
        <Alert variant="destructive">
          <AlertTitle>服务端飞书凭据未配置</AlertTitle>
          <AlertDescription>请先在部署环境配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET；租户表配置会保留，但在此之前不会发送数据。</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>飞书多维表格连接</CardTitle>
            <CardDescription>配置仅属于“{currentTenant?.orgName}”，其他租户无法读取或写入这套表。</CardDescription>
          </div>
          <div className="flex gap-2">
            {config.baseUrl && <Button variant="outline" asChild><a href={config.baseUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 size-4" />打开表格</a></Button>}
            <Button variant="outline" onClick={load} aria-label="刷新配置"><RefreshCw className="size-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="feishu-token">多维表格 App Token</Label>
              <Input id="feishu-token" value={config.bitableAppToken} onChange={event => update('bitableAppToken', event.target.value.trim())} placeholder="例如：bascn..." autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feishu-url">多维表格访问地址</Label>
              <Input id="feishu-url" value={config.baseUrl} onChange={event => update('baseUrl', event.target.value.trim())} placeholder="https://.../base/..." />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tableFields.map(field => (
              <div className="space-y-2" key={field.key}>
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input id={field.key} value={String(config[field.key] || '')} onChange={event => update(field.key, event.target.value.trim())} placeholder="tbl..." />
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Switch id="feishu-active" checked={config.isActive} onCheckedChange={value => update('isActive', value)} />
              <Label htmlFor="feishu-active">启用当前组织的自动同步</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={validate} disabled={!config.isActive}>校验表结构</Button>
              <Button variant="outline" onClick={repairFields} disabled={!config.isActive || !globalConfigured || repairing}>
                {repairing && <Loader2 className="mr-2 size-4 animate-spin" />}补齐缺失字段
              </Button>
              <Button variant="outline" onClick={provision} disabled={!globalConfigured || provisioning}>
                {provisioning && <Loader2 className="mr-2 size-4 animate-spin" />}自动新建整套表格
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}保存配置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>同步队列</CardTitle><CardDescription>业务提交先落库，再可靠同步到飞书；失败任务会自动重试。</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {['pending', 'processing', 'failed', 'completed'].map(status => (
            <div key={status} className="min-w-28 rounded-lg border p-3"><p className="text-xs text-muted-foreground">{status}</p><p className="text-2xl font-semibold">{queue[status] || 0}</p></div>
          ))}
          <Button variant="outline" onClick={retryFailed} disabled={!queue.failed}>立即重试失败任务</Button>
        </CardContent>
      </Card>
    </div>
  );
}
