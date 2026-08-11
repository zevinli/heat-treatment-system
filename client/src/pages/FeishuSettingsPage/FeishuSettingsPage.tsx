import { useEffect, useState } from 'react';
import { ExternalLink, History, Link2, Loader2, RefreshCw, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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

const queueStatusLabels: Record<string, string> = {
  pending: '等待同步',
  processing: '同步中',
  failed: '同步失败',
  completed: '已完成',
};
const topicLabels: Record<string, string> = { inbound: '来货登记', outbound: '发货记录', customer: '客户总览', reconciliation: '对账与回款' };

export default function FeishuSettingsPage() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<Config>(emptyConfig);
  const [globalConfigured, setGlobalConfigured] = useState(false);
  const [queue, setQueue] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillScope, setBackfillScope] = useState<'today' | '90d' | '365d' | 'all'>('90d');
  const [jobs, setJobs] = useState<any[]>([]);

  const load = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const [statusResp, configResp, tablesResp, jobsResp] = await Promise.all([
        axiosForBackend.get('/api/integration/feishu/status'),
        axiosForBackend.get(`/api/integration/feishu/org/${currentTenant.orgCode}/config`),
        axiosForBackend.get('/api/integration/feishu/current/tables'),
        axiosForBackend.get('/api/integration/feishu/current/jobs'),
      ]);
      setGlobalConfigured(Boolean(statusResp.data?.configured));
      setConfig({ ...emptyConfig, ...(configResp.data?.config || {}) });
      setQueue(tablesResp.data?.syncQueue || {});
      setJobs(jobsResp.data?.items || []);
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
      await queryClient.invalidateQueries({ queryKey: ['feishu-runtime-tables'] });
      await load();
    } catch (error: any) {
      toast.error(error.message || '保存飞书配置失败');
    } finally {
      setSaving(false);
    }
  };

  const connectExisting = async () => {
    if (!currentTenant || !connectionUrl.trim()) {
      toast.error('请粘贴飞书多维表格链接');
      return;
    }
    setDiscovering(true);
    try {
      const response = await axiosForBackend.post('/api/integration/feishu/current/discover', { url: connectionUrl.trim() });
      const discovered = response.data;
      const coreKeys = ['inbound', 'outbound', 'inventory', 'customer', 'reconciliation'];
      const missingCore = coreKeys.filter(key => !discovered.tables?.[key]);
      const nextConfig: Config = {
        ...emptyConfig,
        bitableAppToken: discovered.appToken,
        baseUrl: discovered.baseUrl,
        tableInbound: discovered.tables?.inbound || '',
        tableOutbound: discovered.tables?.outbound || '',
        tableInventory: discovered.tables?.inventory || '',
        tableCustomer: discovered.tables?.customer || '',
        tableReconciliation: discovered.tables?.reconciliation || '',
        tableQuality: discovered.tables?.quality || '',
        tableProcess: discovered.tables?.process || '',
        isActive: missingCore.length === 0,
      };
      setConfig(nextConfig);
      if (missingCore.length > 0) {
        toast.error(`已识别 ${discovered.discovered?.length || 0} 张表，但缺少核心业务表，请在高级配置中确认映射`);
        return;
      }
      await axiosForBackend.post(`/api/integration/feishu/org/${currentTenant.orgCode}/config`, nextConfig);
      await queryClient.invalidateQueries({ queryKey: ['feishu-runtime-tables'] });
      toast.success('已有飞书业务表已识别、校验并启用');
      await load();
    } catch (error: any) {
      toast.error(error.message || '识别飞书业务表失败');
    } finally {
      setDiscovering(false);
    }
  };

  const provision = async () => {
    if (!currentTenant || !window.confirm('将为当前组织新建一套飞书多维表格。已有表格请使用手动配置，确认继续新建吗？')) return;
    setProvisioning(true);
    try {
      await axiosForBackend.post(`/api/integration/feishu/org/${currentTenant.orgCode}/provision`, {
        orgName: currentTenant.orgName,
      });
      await queryClient.invalidateQueries({ queryKey: ['feishu-runtime-tables'] });
      toast.success('飞书业务表已创建并启用，可继续初始化历史数据');
      await load();
    } catch (error: any) {
      toast.error(error.message || '自动创建飞书多维表格失败');
    } finally {
      setProvisioning(false);
    }
  };

  const backfill = async () => {
    setBackfilling(true);
    try {
      const response = await axiosForBackend.post('/api/integration/feishu/current/backfill', { scope: backfillScope });
      const queued = response.data?.queued || {};
      const message = `历史数据已进入同步队列：来货 ${queued.inbound || 0}、发货 ${queued.outbound || 0}、客户 ${queued.customer || 0}、对账 ${queued.reconciliation || 0}`;
      if (response.data?.inventory?.error) toast.warning(`${message}；库存快照暂时失败，将由定时任务继续处理`);
      else toast.success(message);
      await load();
    } catch (error: any) {
      toast.error(error.message || '初始化历史数据失败');
    } finally {
      setBackfilling(false);
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
        toast.success('已配置的飞书业务表及所需字段校验通过');
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="size-5" />快速连接飞书</CardTitle>
          <CardDescription>推荐自动新建；如果已有业务表，只需粘贴整套多维表格链接，系统会自动识别表格和字段。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={connectionUrl}
              onChange={event => setConnectionUrl(event.target.value)}
              placeholder="粘贴 https://xxx.feishu.cn/base/..."
              aria-label="飞书多维表格链接"
            />
            <Button onClick={connectExisting} disabled={!globalConfigured || discovering || !connectionUrl.trim()}>
              {discovering && <Loader2 className="mr-2 size-4 animate-spin" />}识别并连接
            </Button>
            <Button variant="outline" onClick={provision} disabled={!globalConfigured || provisioning || Boolean(config.bitableAppToken)}>
              {provisioning && <Loader2 className="mr-2 size-4 animate-spin" />}自动新建（推荐）
            </Button>
          </div>
          {config.bitableAppToken && <p className="text-sm text-success">当前组织已绑定飞书业务表。技术标识和字段映射可在下方高级配置中查看。</p>}
          <Alert>
            <AlertTitle>请只分享给“{currentTenant?.orgName}”成员</AlertTitle>
            <AlertDescription>系统组织权限与飞书文件权限相互独立。连接完成后请在飞书中把整套业务表分享给本组织对应的群组或成员，避免无权用户打不开或分享范围过大。</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
          <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-medium">自动同步</p><p className="text-xs text-muted-foreground">暂停只会停止发送，不会删除系统数据或飞书表格。</p></div>
            <div className="flex items-center gap-3"><Switch id="feishu-active" checked={config.isActive} onCheckedChange={value => update('isActive', value)} /><Label htmlFor="feishu-active">{config.isActive ? '已启用' : '已暂停'}</Label></div>
          </div>

          <details className="rounded-lg border p-4" open={!config.bitableAppToken}>
            <summary className="cursor-pointer font-medium">高级配置：技术标识与字段映射</summary>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">仅供排查和连接非标准表格时使用，日常使用无需修改。</p>
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

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {tableFields.map(field => (
                <div className="space-y-2" key={field.key}>
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input id={field.key} value={String(config[field.key] || '')} onChange={event => update(field.key, event.target.value.trim())} placeholder="tbl..." />
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>
              ))}
            </div>
          </details>

          <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">启用或修改绑定时，系统会先校验真实表格和字段，失败不会覆盖原连接。</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={validate} disabled={!config.isActive}>校验表结构</Button>
              <Button variant="outline" onClick={repairFields} disabled={!config.isActive || !globalConfigured || repairing}>
                {repairing && <Loader2 className="mr-2 size-4 animate-spin" />}补齐缺失字段
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}保存配置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {config.isActive && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5" />初始化历史数据</CardTitle><CardDescription>首次连接或更换表格后执行一次。客户和库存始终按当前状态初始化。</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={backfillScope}
              onChange={event => setBackfillScope(event.target.value as typeof backfillScope)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="历史数据范围"
            >
              <option value="today">仅今天</option>
              <option value="90d">最近90天（推荐）</option>
              <option value="365d">最近一年</option>
              <option value="all">全部历史数据</option>
            </select>
            <Button onClick={backfill} disabled={backfilling}>
              {backfilling && <Loader2 className="mr-2 size-4 animate-spin" />}开始初始化
            </Button>
            <p className="text-xs text-muted-foreground">初始化在后台可靠队列中进行，不影响正常收发货。</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>同步队列</CardTitle><CardDescription>业务提交先落库，再可靠同步到飞书；失败任务会自动重试。</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {['pending', 'processing', 'failed', 'completed'].map(status => (
            <div key={status} className="min-w-28 rounded-lg border p-3"><p className="text-xs text-muted-foreground">{queueStatusLabels[status]}</p><p className="text-2xl font-semibold">{queue[status] || 0}</p></div>
          ))}
          <Button variant="outline" onClick={retryFailed} disabled={!queue.failed}>立即重试失败任务</Button>
          {jobs.filter(job => job.status === 'failed').slice(0, 5).map(job => (
            <div key={job.id} className="w-full rounded-lg border border-error/20 bg-error/5 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{topicLabels[job.topic] || job.topic} · {job.aggregateKey}</span>
                <span className="text-xs text-muted-foreground">已重试 {job.attemptCount || 0} 次</span>
              </div>
              <p className="mt-1 break-words text-xs text-error">{job.lastError || '未知同步错误'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
