import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  ChevronRight,
  HelpCircle,
  Printer,
  Download,
  Sun,
  Moon,
  Eye,
  Monitor,
  Keyboard,
  MousePointer,
  Search,
  Bell,
  LayoutDashboard,
  Package,
  Truck,
  Box,
  FileText,
  BarChart3,
  Users,
  Settings,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  Printer as PrinterIcon,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  X,
  Menu,
  LogOut,
  Key,
  Palette,
  Type,
  Grid,
  List,
  Clock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  Tag,
  DollarSign,
  Weight,
  Hash,
  AlignLeft,
  Image as ImageIcon,
  FilePlus,
  FileMinus,
  RotateCcw,
  History,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  Percent,
  CreditCard,
  Wallet,
  Receipt,
  Plus,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  AlertOctagon,
  Book,
  GraduationCap,
  Award,
  Star,
  Heart,
  Zap,
  Flame,
  Snowflake,
  Thermometer,
  Gauge,
  Scale,
  Ruler,
  Crosshair,
  Target,
  Compass,
  Navigation,
  Map,
  Globe,
  Home,
  Briefcase,
  ShoppingCart,
  Store,
  Warehouse,
  Factory,
  Construction,
  Wrench,
  Hammer,
  Drill,
  Cog,
  Settings2,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Power,
  Play,
  Pause,
  StopCircle,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Mic,
  Camera,
  Video,
  ImagePlus,
  Images,
  Folder,
  FolderOpen,
  File,
  FilePlus2,
  FileMinus2,
  FileEdit,
  FileCheck,
  FileX,
  FileCode,
  FileStack,
  Files,
  Copy,
  Clipboard,
  ClipboardCheck,
  ClipboardX,
  ClipboardCopy,
  StickyNote,
  Notebook,
  Bookmark,
  Library,
  School,
  Trophy,
  Medal,
  Crown,
  Gem,
  Diamond,
  Coins,
  Banknote,
  FileSignature,
  Stamp,
  Badge,
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Scan,
  ScanFace,
  ScanLine,
  QrCode,
  Barcode,
  Radio,
  Wifi,
  Bluetooth,
  Signal,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Plug,
  ZapOff,
  FlameKindling,
  SunDim,
  SunMedium,
  SunMoon,
  MoonStar,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  ThermometerSun,
  ThermometerSnowflake,
  Droplets,
  Droplet,
  Umbrella,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

// ==================== 目录结构 ====================
const menuItems: MenuItem[] = [
  {
    id: 'overview',
    title: '系统概述',
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      { id: 'system-intro', title: '系统简介', icon: <Info className="h-4 w-4" /> },
      { id: 'target-users', title: '适用对象', icon: <Users className="h-4 w-4" /> },
      { id: 'features', title: '核心特点', icon: <Star className="h-4 w-4" /> },
      { id: 'tech-specs', title: '技术规格', icon: <Settings2 className="h-4 w-4" /> },
    ],
  },
  {
    id: 'quick-start',
    title: '快速入门',
    icon: <Zap className="h-4 w-4" />,
    children: [
      { id: 'login', title: '登录系统', icon: <Key className="h-4 w-4" /> },
      { id: 'layout', title: '界面布局详解', icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: 'theme-switching', title: '主题切换指南', icon: <Palette className="h-4 w-4" /> },
      { id: 'common-ops', title: '通用操作说明', icon: <MousePointer className="h-4 w-4" /> },
      { id: 'keyboard-shortcuts', title: '快捷键大全', icon: <Keyboard className="h-4 w-4" /> },
    ],
  },
  {
    id: 'modules',
    title: '功能模块详解',
    icon: <Grid className="h-4 w-4" />,
    children: [
      { id: 'dashboard', title: '工作台', icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: 'inbound', title: '来货登记', icon: <Package className="h-4 w-4" /> },
      { id: 'outbound', title: '快速发货', icon: <Truck className="h-4 w-4" /> },
      { id: 'orders', title: '单据查询', icon: <FileText className="h-4 w-4" /> },
      { id: 'inventory', title: '库存管理', icon: <Box className="h-4 w-4" /> },
      { id: 'reconciliation', title: '智能对账', icon: <ClipboardCheck className="h-4 w-4" /> },
      { id: 'statistics', title: '数据统计', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'statistics-detail', title: '→ 统计子模块详解', icon: <PieChart className="h-4 w-4" /> },
      { id: 'customers', title: '客户管理', icon: <Users className="h-4 w-4" /> },
      { id: 'products', title: '产品管理', icon: <Package className="h-4 w-4" /> },
      { id: 'templates', title: '打印模板配置', icon: <PrinterIcon className="h-4 w-4" /> },
      { id: 'display', title: '页面显示设置', icon: <Monitor className="h-4 w-4" /> },
      { id: 'permissions', title: '权限管理', icon: <Shield className="h-4 w-4" /> },
      { id: 'profile', title: '个人中心', icon: <User className="h-4 w-4" /> },
    ],
  },
  {
    id: 'workflow',
    title: '业务流程指南',
    icon: <ArrowRight className="h-4 w-4" />,
    children: [
      { id: 'inbound-workflow', title: '来货入库流程', icon: <ArrowLeft className="h-4 w-4" /> },
      { id: 'outbound-workflow', title: '出库发货流程', icon: <ArrowRight className="h-4 w-4" /> },
      { id: 'reconciliation-workflow', title: '财务对账流程', icon: <ClipboardCheck className="h-4 w-4" /> },
      { id: 'inventory-check-workflow', title: '库存盘点流程', icon: <RotateCcw className="h-4 w-4" /> },
    ],
  },
  {
    id: 'scenarios',
    title: '典型业务场景',
    icon: <Lightbulb className="h-4 w-4" />,
    children: [
      { id: 'scenario-new-customer', title: '新客户首次来货', icon: <User className="h-4 w-4" /> },
      { id: 'scenario-batch-outbound', title: '批量分批发货', icon: <Truck className="h-4 w-4" /> },
      { id: 'scenario-urgent-order', title: '紧急订单处理', icon: <Zap className="h-4 w-4" /> },
      { id: 'scenario-month-end', title: '月底对账结算', icon: <Calendar className="h-4 w-4" /> },
      { id: 'scenario-stock-warning', title: '库存预警处理', icon: <AlertTriangle className="h-4 w-4" /> },
    ],
  },
  {
    id: 'advanced',
    title: '高级功能',
    icon: <Cog className="h-4 w-4" />,
    children: [
      { id: 'animations', title: '动效系统说明', icon: <Activity className="h-4 w-4" /> },
      { id: 'data-export', title: '数据导出导入', icon: <FileSpreadsheet className="h-4 w-4" /> },
      { id: 'print-guide', title: '打印最佳实践', icon: <PrinterIcon className="h-4 w-4" /> },
    ],
  },
  {
    id: 'faq',
    title: '常见问题',
    icon: <HelpCircle className="h-4 w-4" />,
  },
  {
    id: 'notes',
    title: '注意事项',
    icon: <AlertCircle className="h-4 w-4" />,
  },
];

// ==================== 辅助组件 ====================

// 信息提示框
const InfoBox = ({ children, title = '提示' }: { children: React.ReactNode; title?: string }) => (
  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-4">
    <div className="flex items-start gap-3">
      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
      <div>
        <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">{title}</h5>
        <div className="text-sm text-blue-700 dark:text-blue-300">{children}</div>
      </div>
    </div>
  </div>
);

// 警告提示框
const WarningBox = ({ children, title = '注意' }: { children: React.ReactNode; title?: string }) => (
  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div>
        <h5 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">{title}</h5>
        <div className="text-sm text-amber-700 dark:text-amber-300">{children}</div>
      </div>
    </div>
  </div>
);

// 成功提示框
const SuccessBox = ({ children, title = '成功' }: { children: React.ReactNode; title?: string }) => (
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 my-4">
    <div className="flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
      <div>
        <h5 className="font-semibold text-green-800 dark:text-green-200 mb-1">{title}</h5>
        <div className="text-sm text-green-700 dark:text-green-300">{children}</div>
      </div>
    </div>
  </div>
);

// 步骤指示器
const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="relative pl-8 pb-6 border-l-2 border-primary/30 last:border-l-0 last:pb-0">
    <div className="absolute left-0 top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
      {number}
    </div>
    <h4 className="font-semibold text-foreground mb-2">{title}</h4>
    <div className="text-muted-foreground">{children}</div>
  </div>
);

// 键盘按键
const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono">
    {children}
  </kbd>
);

// 截图占位符
const ScreenshotPlaceholder = ({ label }: { label: string }) => (
  <div className="bg-muted border-2 border-dashed border-border rounded-lg p-8 my-4 text-center">
    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

// ==================== 手册内容 ====================
const manualContent: Record<string, { title: string; content: React.ReactNode }> = {
  'system-intro': {
    title: '系统简介',
    content: (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold text-foreground mb-2">热处理收发货管理系统</h3>
          <p className="text-muted-foreground">
            专为热处理加工企业设计的数字化管理平台，覆盖来货登记、快速发货、库存管理、智能对账、数据统计等核心业务场景，实现收发货全流程数字化管理。
          </p>
        </div>

        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          核心功能模块
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: LayoutDashboard, title: '工作台', desc: '业务概览、快捷入口、风险预警、业务完成度统计' },
            { icon: Package, title: '来货登记', desc: '三步完成入库，自动生成入库单号，支持打印流程卡' },
            { icon: Truck, title: '快速发货', desc: '智能筛选可发产品，灵活分批发货，支持关单平账' },
            { icon: Box, title: '库存管理', desc: '实时库存监控，支持手动调整，超期预警提醒' },
            { icon: ClipboardCheck, title: '智能对账', desc: '按月汇总出库数据，自动计算应收金额，回款跟踪' },
            { icon: BarChart3, title: '数据统计', desc: '综合报表、客户分析、库存分析、产品分析、财务分析' },
            { icon: Users, title: '客户管理', desc: '维护客户基础信息，查看历史收发货记录' },
            { icon: Package, title: '产品管理', desc: '统一管理产品档案，关联客户信息' },
            { icon: PrinterIcon, title: '打印模板', desc: '自定义流程卡、送货单、对账单的打印格式' },
            { icon: Shield, title: '权限管理', desc: '分级控制用户权限，保障数据安全' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <item.icon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h5 className="font-medium text-foreground">{item.title}</h5>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h4 className="font-semibold text-lg flex items-center gap-2 mt-6">
          <Star className="h-5 w-5 text-amber-500" />
          系统特点
        </h4>
        
        <div className="space-y-3">
          {[
            { title: '三步闭环流程', desc: '来货/发货均采用"选客户→选产品→录数据"三步完成，操作简单高效' },
            { title: '智能单号生成', desc: '入库单号（RK开头）、出库单号（CK开头）自动生成，规则统一' },
            { title: '实时库存联动', desc: '入库自动增加库存，出库自动扣减，数据实时同步' },
            { title: '灵活分批处理', desc: '支持部分发货，关单功能可平账处理尾数' },
            { title: '多维度筛选', desc: '支持按客户、产品、材质、状态等多条件组合筛选' },
            { title: '现场打印支持', desc: '流程卡、送货单可直接打印，支持模板自定义' },
            { title: '数据导出能力', desc: '各模块均支持导出Excel，方便二次处理' },
            { title: '多主题支持', desc: '浅色、深色、护眼三种主题模式，适应不同使用环境' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-foreground">{item.title}：</span>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  'target-users': {
    title: '适用对象',
    content: (
      <div className="space-y-6">
        <p className="text-muted-foreground">本系统适用于热处理加工企业的各类岗位人员，根据不同角色提供针对性的功能权限。</p>
        
        <div className="grid gap-4">
          {[
            { 
              role: '收货员', 
              duty: '现场收货、入库登记', 
              features: ['来货登记', '产品信息查询', '流程卡打印'],
              icon: Package,
              color: 'blue'
            },
            { 
              role: '发货员', 
              duty: '出库发货、送货单打印', 
              features: ['快速发货', '库存查询', '送货单打印'],
              icon: Truck,
              color: 'green'
            },
            { 
              role: '财务人员', 
              duty: '对账结算、回款跟踪', 
              features: ['智能对账', '数据统计', '报表导出'],
              icon: DollarSign,
              color: 'purple'
            },
            { 
              role: '仓库管理员', 
              duty: '库存管理、盘点调整', 
              features: ['库存管理', '库存调整', '预警处理'],
              icon: Box,
              color: 'amber'
            },
            { 
              role: '业务主管', 
              duty: '客户管理、业务分析', 
              features: ['客户管理', '数据统计', '业务监控'],
              icon: Users,
              color: 'indigo'
            },
            { 
              role: '系统管理员', 
              duty: '系统配置、权限管理、基础数据维护', 
              features: ['全部功能', '权限管理', '打印模板', '系统设置'],
              icon: Shield,
              color: 'red'
            },
          ].map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-card">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  item.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
                  item.color === 'green' && "bg-green-100 dark:bg-green-900/30 text-green-600",
                  item.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
                  item.color === 'amber' && "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                  item.color === 'indigo' && "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600",
                  item.color === 'red' && "bg-red-100 dark:bg-red-900/30 text-red-600",
                )}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-lg text-foreground">{item.role}</h5>
                  <p className="text-sm text-muted-foreground mb-2">{item.duty}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.features.map((feature, fidx) => (
                      <span key={fidx} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  'features': {
    title: '核心特点',
    content: (
      <div className="space-y-8">
        <section>
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" />
            操作便捷性
          </h4>
          <div className="space-y-3 ml-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">1</div>
              <div>
                <span className="font-medium text-foreground">三步闭环流程：</span>
                <span className="text-muted-foreground">来货/发货均采用"选客户→选产品→录数据"三步完成，操作简单高效，新员工10分钟即可上手</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">2</div>
              <div>
                <span className="font-medium text-foreground">智能单号生成：</span>
                <span className="text-muted-foreground">入库单号（RK开头）、出库单号（CK开头）自动生成，规则统一，永不重复</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">3</div>
              <div>
                <span className="font-medium text-foreground">快捷导航：</span>
                <span className="text-muted-foreground">顶部栏搜索按钮可快速定位功能和页面，支持快捷键 Ctrl+K 呼出</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            数据准确性
          </h4>
          <div className="space-y-3 ml-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">实时库存联动：</span>
                <span className="text-muted-foreground">入库自动增加库存，出库自动扣减，数据实时同步，杜绝账实不符</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">库存校验：</span>
                <span className="text-muted-foreground">出库时自动校验库存是否充足，防止超发，库存不足时自动提示</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">自动计算金额：</span>
                <span className="text-muted-foreground">根据单价和数量自动计算金额，减少人工计算错误</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Sliders className="h-5 w-5 text-blue-500" />
            业务灵活性
          </h4>
          <div className="space-y-3 ml-6">
            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">灵活分批处理：</span>
                <span className="text-muted-foreground">支持部分发货，关单功能可平账处理尾数，适应各种业务场景</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">库存调整：</span>
                <span className="text-muted-foreground">支持盘点差异的手动调整，记录调整日志，调整原因可追溯</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">多维度筛选：</span>
                <span className="text-muted-foreground">支持按客户、产品、材质、状态、时间等多条件组合筛选</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-purple-500" />
            视觉体验
          </h4>
          <div className="space-y-3 ml-6">
            <div className="flex items-start gap-3">
              <Sun className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">三主题支持：</span>
                <span className="text-muted-foreground">浅色模式（默认）、深色模式（夜间）、护眼模式（暖色），适应不同使用环境</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <span className="font-medium text-foreground">流畅动效：</span>
                <span className="text-muted-foreground">精心设计的页面过渡、交互动效，提升操作体验</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">响应式布局：</span>
                <span className="text-muted-foreground">自适应不同屏幕尺寸，支持平板、手机访问</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    ),
  },
  'tech-specs': {
    title: '技术规格',
    content: (
      <div className="space-y-6">
        <h4 className="font-semibold text-lg">系统要求</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-3 text-left font-semibold">项目</th>
                <th className="border border-border p-3 text-left font-semibold">要求</th>
                <th className="border border-border p-3 text-left font-semibold">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-3">浏览器</td>
                <td className="border border-border p-3">Chrome 90+ / Edge 90+ / Firefox 88+ / Safari 14+</td>
                <td className="border border-border p-3 text-muted-foreground">推荐使用Chrome获得最佳体验</td>
              </tr>
              <tr>
                <td className="border border-border p-3">分辨率</td>
                <td className="border border-border p-3">推荐 1920×1080 及以上</td>
                <td className="border border-border p-3 text-muted-foreground">最低支持 1366×768</td>
              </tr>
              <tr>
                <td className="border border-border p-3">网络</td>
                <td className="border border-border p-3">宽带互联网连接</td>
                <td className="border border-border p-3 text-muted-foreground">建议带宽 10Mbps 以上</td>
              </tr>
              <tr>
                <td className="border border-border p-3">打印设备</td>
                <td className="border border-border p-3">支持A4/A5纸张的激光/喷墨打印机</td>
                <td className="border border-border p-3 text-muted-foreground">建议使用Chrome打印</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 className="font-semibold text-lg mt-6">数据规格</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-3 text-left font-semibold">数据项</th>
                <th className="border border-border p-3 text-left font-semibold">格式/限制</th>
                <th className="border border-border p-3 text-left font-semibold">示例</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-3">入库单号</td>
                <td className="border border-border p-3">RK + YYMMDD + 3位序号</td>
                <td className="border border-border p-3 font-mono">RK240115001</td>
              </tr>
              <tr>
                <td className="border border-border p-3">出库单号</td>
                <td className="border border-border p-3">CK + YYMMDD + 3位序号</td>
                <td className="border border-border p-3 font-mono">CK240115001</td>
              </tr>
              <tr>
                <td className="border border-border p-3">数量</td>
                <td className="border border-border p-3">整数，范围 1-999999</td>
                <td className="border border-border p-3">1000</td>
              </tr>
              <tr>
                <td className="border border-border p-3">重量</td>
                <td className="border border-border p-3">小数，最多3位小数，单位kg</td>
                <td className="border border-border p-3">1250.5</td>
              </tr>
              <tr>
                <td className="border border-border p-3">单价</td>
                <td className="border border-border p-3">小数，最多2位小数，单位元</td>
                <td className="border border-border p-3">15.5</td>
              </tr>
              <tr>
                <td className="border border-border p-3">日期</td>
                <td className="border border-border p-3">YYYY-MM-DD 格式</td>
                <td className="border border-border p-3">2024-01-15</td>
              </tr>
            </tbody>
          </table>
        </div>

        <InfoBox title="性能说明">
          系统采用现代Web技术构建，响应时间通常在200ms以内。单表支持最大10万条数据流畅浏览，大量数据建议使用筛选和分页功能。
        </InfoBox>
      </div>
    ),
  },
  'login': {
    title: '登录系统',
    content: (
      <div className="space-y-6">
        <h4 className="font-semibold text-lg">登录步骤</h4>
        
        <Step number={1} title="打开系统">
          <p>在浏览器地址栏输入系统网址，按回车键访问</p>
          <ScreenshotPlaceholder label="登录页面示意图" />
        </Step>
        
        <Step number={2} title="输入账号信息">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>在用户名输入框输入您的账号（通常为工号或邮箱）</li>
            <li>在密码输入框输入您的登录密码</li>
          </ul>
        </Step>
        
        <Step number={3} title="点击登录">
          <p>点击"登录"按钮，系统会验证您的身份信息</p>
          <SuccessBox>登录成功后，系统会根据您的角色权限自动跳转到对应的首页</SuccessBox>
        </Step>

        <WarningBox title="安全提示">
          <ul className="list-disc list-inside space-y-1">
            <li>首次登录后请及时修改默认密码</li>
            <li>密码应包含字母、数字，长度不少于8位</li>
            <li>离开电脑时请点击头像选择"退出登录"</li>
            <li>如连续5次输入错误密码，账号将被锁定15分钟</li>
          </ul>
        </WarningBox>

        <h4 className="font-semibold text-lg mt-8">常见问题</h4>
        <div className="space-y-4">
          <div className="border-l-4 border-amber-400 pl-4">
            <p className="font-medium text-foreground">忘记密码怎么办？</p>
            <p className="text-sm text-muted-foreground">请联系系统管理员重置密码，重置后的默认密码通常为工号后6位。</p>
          </div>
          <div className="border-l-4 border-amber-400 pl-4">
            <p className="font-medium text-foreground">提示"账号已锁定"？</p>
            <p className="text-sm text-muted-foreground">由于连续输错密码，账号已被临时锁定。请等待15分钟后重试，或联系管理员解锁。</p>
          </div>
        </div>
      </div>
    ),
  },
  'theme-switching': {
    title: '主题切换指南',
    content: (
      <div className="space-y-6">
        <p className="text-muted-foreground">系统支持三种主题模式，您可以根据使用环境和个人偏好随时切换。</p>

        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          主题模式说明
        </h4>

        <div className="grid gap-4">
          <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Sun className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-lg text-foreground">浅色模式</h5>
                <p className="text-sm text-muted-foreground mb-2">系统默认主题，适合白天正常光线环境使用</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">高对比度</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">清晰锐利</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">默认</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-slate-900 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                <Moon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-lg">深色模式</h5>
                <p className="text-sm text-slate-400 mb-2">适合夜间或弱光环境，减少眼部疲劳</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">护眼舒适</span>
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">省电</span>
                  <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded text-xs">夜间推荐</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-[#f5f0e6]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#e8e0d0] flex items-center justify-center">
                <Eye className="h-6 w-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-lg text-amber-900">护眼模式</h5>
                <p className="text-sm text-amber-800/70 mb-2">暖色调，减少蓝光，适合长时间工作</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-[#e8e0d0] text-amber-800 rounded text-xs">暖色调</span>
                  <span className="px-2 py-1 bg-[#e8e0d0] text-amber-800 rounded text-xs">防蓝光</span>
                  <span className="px-2 py-1 bg-[#e8e0d0] text-amber-800 rounded text-xs">长时间推荐</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
          <MousePointer className="h-5 w-5 text-primary" />
          如何切换主题
        </h4>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h5 className="font-medium text-foreground mb-2">方法一：通过侧边栏切换（推荐）</h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>查看页面左侧（或顶部）的侧边栏</li>
              <li>找到底部的主题切换按钮（太阳/月亮图标）</li>
              <li>点击按钮，在弹出的菜单中选择想要的主题</li>
              <li>主题会立即生效，无需刷新页面</li>
            </ol>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h5 className="font-medium text-foreground mb-2">方法二：通过顶部栏切换</h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>查看页面顶部标题栏右侧</li>
              <li>点击主题图标（太阳/月亮/眼睛）</li>
              <li>在弹出的下拉菜单中选择主题</li>
            </ol>
          </div>
        </div>

        <InfoBox>
          您的主题偏好会自动保存在浏览器中，下次登录时会自动应用上次选择的主题。
        </InfoBox>

        <h4 className="font-semibold text-lg mt-6">各模块主题适配</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">模块</th>
                <th className="border border-border p-2 text-left">浅色模式</th>
                <th className="border border-border p-2 text-left">深色模式</th>
                <th className="border border-border p-2 text-left">护眼模式</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">工作台</td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
              </tr>
              <tr>
                <td className="border border-border p-2">表格组件</td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
              </tr>
              <tr>
                <td className="border border-border p-2">图表组件</td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
              </tr>
              <tr>
                <td className="border border-border p-2">表单组件</td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
              </tr>
              <tr>
                <td className="border border-border p-2">打印预览</td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                <td className="border border-border p-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
};

// 添加更多手册内容
manualContent['layout'] = {
  title: '界面布局详解',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">系统采用经典的"侧边导航 + 顶部标题栏 + 主内容区"三栏布局，简洁清晰，易于上手。</p>

      <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
        <pre className="whitespace-pre">{`┌──────────────────────────────────────────────────────────────────────┐
│  🔍 搜索    📋 标题/面包屑                    🔔 💬 👤 用户菜单      │  ← 顶部标题栏
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                           │
│  📊 工作台 │                                                           │
│  📥 来货   │                    主内容区域                              │
│  📤 发货   │                                                           │
│  📦 库存   │         • 筛选/搜索区                                       │
│  💰 对账   │         • 数据表格/卡片列表                                  │
│  📈 统计   │         • 分页控件                                          │
│  👥 客户   │         • 操作按钮                                          │
│  📋 产品   │                                                           │
│  ⚙️ 设置 ▼ │                                                           │
│          │                                                           │
│  ─────────│                                                           │
│  👤 用户   │                                                           │
└──────────┴───────────────────────────────────────────────────────────┘
     ↑                              ↑
  侧边栏导航                    主内容区`}</pre>
      </div>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        顶部标题栏
      </h4>
      <p className="text-muted-foreground">页面顶部的固定栏，高度约60px，包含以下功能区域：</p>

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Search className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">搜索按钮</h5>
            <p className="text-sm text-muted-foreground">点击打开快速搜索，支持查找功能和页面。快捷键：<Kbd>Ctrl</Kbd>+<Kbd>K</Kbd></p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">面包屑导航</h5>
            <p className="text-sm text-muted-foreground">显示当前页面路径，如"首页 &gt; 来货登记"，可点击返回上级</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Bell className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">通知按钮</h5>
            <p className="text-sm text-muted-foreground">显示待回款、库存预警等通知，红点表示有未读消息</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <HelpCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">帮助按钮</h5>
            <p className="text-sm text-muted-foreground">点击跳转至用户手册页面（就是当前页面）</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Palette className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">主题切换</h5>
            <p className="text-sm text-muted-foreground">切换浅色/深色/护眼主题</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <User className="h-5 w-5 text-indigo-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">用户菜单</h5>
            <p className="text-sm text-muted-foreground">显示当前用户名，点击展开个人资料、退出登录等选项</p>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Menu className="h-5 w-5 text-primary" />
        侧边栏导航
      </h4>
      
      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">左侧固定导航栏，宽度约240px，包含以下部分：</p>
        
        <div className="border-l-4 border-primary pl-4">
          <h5 className="font-medium text-foreground">主导航区</h5>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
            <li>点击导航项可切换功能页面</li>
            <li>带箭头的菜单可展开查看子菜单</li>
            <li>当前所在页面导航项会高亮显示（蓝色背景）</li>
            <li>鼠标悬停显示完整名称（收起状态下）</li>
          </ul>
        </div>

        <div className="border-l-4 border-primary pl-4">
          <h5 className="font-medium text-foreground">底部用户区</h5>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
            <li>显示当前用户头像和名称</li>
            <li>点击可展开个人菜单</li>
            <li>包含：个人资料、退出登录选项</li>
          </ul>
        </div>
      </div>

      <InfoBox>
        侧边栏支持收起/展开。点击侧边栏顶部的箭头按钮可以收起侧边栏，收起后主内容区会自动扩展，适合小屏幕使用。
      </InfoBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Monitor className="h-5 w-5 text-primary" />
        主内容区域
      </h4>

      <p className="text-muted-foreground">页面的核心工作区，根据功能不同显示不同的内容：</p>

      <div className="grid gap-3">
        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Filter className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">筛选/搜索区</h5>
            <p className="text-sm text-muted-foreground">位于页面顶部，包含搜索框、筛选条件下拉框、日期选择器等</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Table className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">数据展示区</h5>
            <p className="text-sm text-muted-foreground">以表格或卡片形式展示数据，支持排序、行选择等操作</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <MoreHorizontal className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">分页控件</h5>
            <p className="text-sm text-muted-foreground">表格底部，可切换页码、调整每页显示条数（10/20/50/100）</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <MousePointer className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-foreground">操作按钮区</h5>
            <p className="text-sm text-muted-foreground">新增、编辑、删除、导出、打印等功能按钮</p>
          </div>
        </div>
      </div>

      <WarningBox title="布局适应">
        系统采用响应式设计，在不同屏幕尺寸下会自动调整布局：
        <ul className="list-disc list-inside mt-2">
          <li><strong>大屏幕</strong>（≥1280px）：完整三栏布局</li>
          <li><strong>中屏幕</strong>（768px-1279px）：侧边栏可收起</li>
          <li><strong>小屏幕</strong>（&lt;768px）：侧边栏变为抽屉式，点击汉堡菜单展开</li>
        </ul>
      </WarningBox>
    </div>
  ),
};

// 表格图标组件
function Table({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="3" x2="21" y1="15" y2="15" />
      <line x1="12" x2="12" y1="3" y2="21" />
    </svg>
  );
}

manualContent['common-ops'] = {
  title: '通用操作说明',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">本章节介绍系统中通用的操作方式，掌握这些操作可以提高工作效率。</p>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Search className="h-5 w-5 text-blue-500" />
        搜索操作
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="输入关键词">
          <p>在搜索框中输入要查找的内容，支持客户名称、产品名称、编号等模糊查询</p>
        </Step>
        <Step number={2} title="自动筛选">
          <p>输入过程中系统会自动筛选匹配的数据，实时显示结果</p>
        </Step>
        <Step number={3} title="清除搜索">
          <p>点击搜索框右侧的×按钮或按<Kbd>Esc</Kbd>键清除搜索条件</p>
        </Step>
      </div>

      <InfoBox>
        <strong>搜索技巧：</strong>
        <ul className="list-disc list-inside mt-1">
          <li>支持拼音首字母搜索（如输入"hw"可匹配"华为"）</li>
          <li>支持关键词组合（多个关键词用空格分隔）</li>
          <li>支持编号模糊匹配（输入部分单号即可）</li>
        </ul>
      </InfoBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Filter className="h-5 w-5 text-green-500" />
        筛选操作
      </h4>

      <div className="space-y-3 ml-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">下拉筛选：</span>
            <span className="text-muted-foreground">点击筛选条件下的拉框，选择要筛选的值，可多选</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">日期筛选：</span>
            <span className="text-muted-foreground">点击日期选择器，选择起始日期和结束日期</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">组合筛选：</span>
            <span className="text-muted-foreground">多个筛选条件可以同时使用，条件之间是"与"的关系</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">重置筛选：</span>
            <span className="text-muted-foreground">点击"重置"按钮清除所有筛选条件</span>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <FilePlus className="h-5 w-5 text-amber-500" />
        新增操作
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="打开新增界面">
          <p>点击页面上的"新增"按钮，打开新增表单弹窗或跳转到新增页面</p>
        </Step>
        <Step number={2} title="填写信息">
          <p>根据表单要求填写各项信息，带红色*号的为必填项</p>
        </Step>
        <Step number={3} title="保存数据">
          <p>点击"保存"按钮提交数据，系统会进行数据校验</p>
        </Step>
      </div>

      <SuccessBox>保存成功后，系统会给出提示，并自动刷新列表显示新数据</SuccessBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Edit className="h-5 w-5 text-purple-500" />
        编辑操作
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="选择要编辑的数据">
          <p>在列表中找到要编辑的数据行</p>
        </Step>
        <Step number={2} title="打开编辑界面">
          <p>点击行末的"编辑"按钮，或点击行内可编辑区域</p>
        </Step>
        <Step number={3} title="修改信息">
          <p>修改需要更新的字段内容</p>
        </Step>
        <Step number={4} title="保存修改">
          <p>点击"保存"按钮提交修改，点击"取消"放弃修改</p>
        </Step>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-red-500" />
        删除操作
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="选择要删除的数据">
          <p>在列表中找到要删除的数据行</p>
        </Step>
        <Step number={2} title="点击删除">
          <p>点击行末的"删除"按钮</p>
        </Step>
        <Step number={3} title="确认删除">
          <p>系统会弹出确认对话框，点击"确定"确认删除，"取消"放弃</p>
        </Step>
      </div>

      <WarningBox title="删除警告">
        删除操作通常不可逆！删除前请确认数据已不再需要。部分有关联数据（如已有出入库记录的产品）可能无法删除。
      </WarningBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-green-500" />
        导出操作
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">各模块均支持导出Excel文件，方便二次处理：</p>
        <div className="flex items-start gap-3">
          <ArrowRight className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">当前页导出：</span>
            <span className="text-muted-foreground">仅导出当前页显示的数据</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ArrowRight className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">全部导出：</span>
            <span className="text-muted-foreground">导出所有符合条件的数据（可能包含多页）</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ArrowRight className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">选中项导出：</span>
            <span className="text-muted-foreground">仅导出勾选选中的数据行</span>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <PrinterIcon className="h-5 w-5 text-blue-500" />
        打印操作
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="点击打印按钮">
          <p>在单据详情页面或列表页面点击"打印"按钮</p>
        </Step>
        <Step number={2} title="预览检查">
          <p>在打印预览窗口检查内容是否完整、格式是否正确</p>
        </Step>
        <Step number={3} title="选择打印机">
          <p>选择要使用的打印机，设置纸张大小、方向等参数</p>
        </Step>
        <Step number={4} title="执行打印">
          <p>点击"打印"按钮输出到打印机</p>
        </Step>
      </div>

      <InfoBox>
        建议在正式打印前先用A4纸测试一张，确认格式正确后再批量打印。如打印异常，可尝试导出Excel后再打印。
      </InfoBox>
    </div>
  ),
};

manualContent['keyboard-shortcuts'] = {
  title: '快捷键大全',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">熟练使用快捷键可以大幅提升操作效率。以下是系统支持的所有快捷键。</p>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Globe className="h-5 w-5 text-blue-500" />
        全局快捷键
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-3 text-left font-semibold w-40">快捷键</th>
              <th className="border border-border p-3 text-left font-semibold">功能</th>
              <th className="border border-border p-3 text-left font-semibold">使用场景</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-3"><Kbd>Ctrl</Kbd>+<Kbd>K</Kbd></td>
              <td className="border border-border p-3">打开快速搜索</td>
              <td className="border border-border p-3 text-muted-foreground">任意页面快速定位功能</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Esc</Kbd></td>
              <td className="border border-border p-3">关闭弹窗/取消操作</td>
              <td className="border border-border p-3 text-muted-foreground">关闭对话框、下拉菜单</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Ctrl</Kbd>+<Kbd>S</Kbd></td>
              <td className="border border-border p-3">保存当前表单</td>
              <td className="border border-border p-3 text-muted-foreground">编辑/新增表单页面</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Ctrl</Kbd>+<Kbd>F</Kbd></td>
              <td className="border border-border p-3">聚焦搜索框</td>
              <td className="border border-border p-3 text-muted-foreground">快速开始搜索</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Ctrl</Kbd>+<Kbd>E</Kbd></td>
              <td className="border border-border p-3">导出当前列表</td>
              <td className="border border-border p-3 text-muted-foreground">列表页面快速导出</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Ctrl</Kbd>+<Kbd>P</Kbd></td>
              <td className="border border-border p-3">打印当前页面</td>
              <td className="border border-border p-3 text-muted-foreground">快速呼出打印对话框</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>F1</Kbd></td>
              <td className="border border-border p-3">打开帮助手册</td>
              <td className="border border-border p-3 text-muted-foreground">跳转到用户手册页面</td>
            </tr>
          </tbody>
        </table>
      </div>

      <InfoBox>
        <strong>Mac用户注意：</strong>请将上述快捷键中的 <Kbd>Ctrl</Kbd> 替换为 <Kbd>⌘ Command</Kbd> 键使用。
      </InfoBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Table className="h-5 w-5 text-green-500" />
        表格操作快捷键
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-3 text-left font-semibold w-40">快捷键</th>
              <th className="border border-border p-3 text-left font-semibold">功能</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-3"><Kbd>↑</Kbd> / <Kbd>↓</Kbd></td>
              <td className="border border-border p-3">上下移动选中行</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Enter</Kbd></td>
              <td className="border border-border p-3">打开选中行详情</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Space</Kbd></td>
              <td className="border border-border p-3">勾选/取消勾选当前行</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Ctrl</Kbd>+<Kbd>A</Kbd></td>
              <td className="border border-border p-3">全选当前页所有行</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Home</Kbd></td>
              <td className="border border-border p-3">跳转到第一行</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>End</Kbd></td>
              <td className="border border-border p-3">跳转到最后行</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>PageUp</Kbd></td>
              <td className="border border-border p-3">向上翻页</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>PageDown</Kbd></td>
              <td className="border border-border p-3">向下翻页</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Edit className="h-5 w-5 text-purple-500" />
        表单操作快捷键
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-3 text-left font-semibold w-40">快捷键</th>
              <th className="border border-border p-3 text-left font-semibold">功能</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-3"><Kbd>Tab</Kbd></td>
              <td className="border border-border p-3">切换到下一个输入框</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Shift</Kbd>+<Kbd>Tab</Kbd></td>
              <td className="border border-border p-3">切换到上一个输入框</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Enter</Kbd></td>
              <td className="border border-border p-3">提交表单（在最后一个字段时）</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd></td>
              <td className="border border-border p-3">强制提交表单</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Esc</Kbd></td>
              <td className="border border-border p-3">取消编辑，关闭弹窗</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Navigation className="h-5 w-5 text-amber-500" />
        导航快捷键
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-3 text-left font-semibold w-40">快捷键</th>
              <th className="border border-border p-3 text-left font-semibold">功能</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-3"><Kbd>Alt</Kbd>+<Kbd>1</Kbd></td>
              <td className="border border-border p-3">跳转到工作台</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Alt</Kbd>+<Kbd>2</Kbd></td>
              <td className="border border-border p-3">跳转到来货登记</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Alt</Kbd>+<Kbd>3</Kbd></td>
              <td className="border border-border p-3">跳转到快速发货</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Alt</Kbd>+<Kbd>4</Kbd></td>
              <td className="border border-border p-3">跳转到库存管理</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Alt</Kbd>+<Kbd>5</Kbd></td>
              <td className="border border-border p-3">跳转到智能对账</td>
            </tr>
            <tr>
              <td className="border border-border p-3"><Kbd>Alt</Kbd>+<Kbd>←</Kbd></td>
              <td className="border border-border p-3">返回上一页</td>
            </tr>
          </tbody>
        </table>
      </div>

      <SuccessBox title="快捷键提示">
        大部分按钮和菜单项都会显示对应的快捷键提示（如"保存 <Kbd>Ctrl+S</Kbd>"），平时注意查看可以逐渐记住常用快捷键。
      </SuccessBox>
    </div>
  ),
};

manualContent['dashboard'] = {
  title: '工作台',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">工作台是系统的首页，提供业务概览、快捷操作入口和个人业务完成度统计。</p>

      <ScreenshotPlaceholder label="工作台界面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-blue-500" />
        功能区域介绍
      </h4>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <h5 className="font-semibold text-foreground">欢迎区域</h5>
          </div>
          <p className="text-sm text-muted-foreground ml-13">显示当前日期时间和问候语（如"早上好，张三"），右上角提供消息通知入口</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h5 className="font-semibold text-foreground">KPI指标卡片</h5>
          </div>
          <p className="text-sm text-muted-foreground mb-2">展示四个关键业务指标：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li><strong>本月入库数量</strong>：本月累计入库的产品总数量</li>
            <li><strong>待对账出库单</strong>：尚未完成对账的出库单数量</li>
            <li><strong>本月回款金额</strong>：本月已收到的回款总金额</li>
            <li><strong>库存预警</strong>：库存低于预警值的产品数量</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h5 className="font-semibold text-foreground">快捷入口</h5>
          </div>
          <p className="text-sm text-muted-foreground">一键跳转常用功能页面：</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">来货登记</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">快速发货</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">数据统计</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">智能对账</span>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <History className="h-5 w-5 text-white" />
            </div>
            <h5 className="font-semibold text-foreground">最近动态</h5>
          </div>
          <p className="text-sm text-muted-foreground">展示最近的收发货操作记录流水，显示操作时间、操作人、操作内容</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h5 className="font-semibold text-foreground">风险预警</h5>
          </div>
          <p className="text-sm text-muted-foreground">显示需要关注的风险信息：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>超期待回款客户及金额</li>
            <li>库存低于预警值的产品</li>
            <li>超期未处理的在库产品</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h5 className="font-semibold text-foreground">业务完成度</h5>
          </div>
          <p className="text-sm text-muted-foreground mb-2">展示本月业务综合完成度，包括四项指标：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li><strong>入库完成度</strong>：实际入库数量 ÷ 入库目标 × 100%</li>
            <li><strong>出库完成度</strong>：实际出库数量 ÷ 出库目标 × 100%</li>
            <li><strong>对账完成度</strong>：100% - (待对账单数 × 5%)</li>
            <li><strong>库存健康度</strong>：100% - (预警产品数 × 10%)</li>
          </ul>
          <InfoBox>点击业务完成度卡片可查看详细分析，并设置入库和出库的目标值。</InfoBox>
        </div>
      </div>
    </div>
  ),
};

manualContent['inbound'] = {
  title: '来货登记',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">来货登记用于记录客户送来的热处理产品，生成入库记录并打印产品流程卡。采用"三步走"操作流程，简单高效。</p>

      <ScreenshotPlaceholder label="来货登记页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-500" />
        三步操作流程
      </h4>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-5 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">1</div>
            <h5 className="font-semibold text-lg text-foreground">选择客户</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">点击"选择客户"按钮，打开客户选择弹窗：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>可通过客户名称、编号搜索快速定位</li>
              <li>列表显示客户名称、编号、联系人信息</li>
              <li>点击客户行即可选中</li>
              <li>选择后系统自动加载该客户的产品列表</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-5 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">2</div>
            <h5 className="font-semibold text-lg text-foreground">选择产品</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">从产品列表中勾选需要入库的产品：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>表格显示该客户的所有产品信息</li>
              <li>勾选产品前面的复选框可多选</li>
              <li>支持按产品名称、材质、工艺筛选</li>
              <li>点击"全选"可快速选择当前页所有产品</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-5 border border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">3</div>
            <h5 className="font-semibold text-lg text-foreground">录入数据并保存</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">填写入库明细信息：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li><strong>数量</strong>：填写本次入库的产品数量（必填）</li>
              <li><strong>重量</strong>：填写总重量，单位kg（必填）</li>
              <li><strong>工艺要求</strong>：如有特殊要求可在此备注</li>
              <li><strong>备注</strong>：其他需要说明的信息</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">填写完成后点击"保存入库"按钮提交</p>
          </div>
        </div>
      </div>

      <SuccessBox title="入库成功">
        保存成功后，系统会自动：
        <ul className="list-disc list-inside mt-1">
          <li>生成入库单号（格式：RK + 年月日 + 3位序号）</li>
          <li>增加对应产品的库存数量</li>
          <li>记录入库流水日志</li>
          <li>提示是否立即打印流程卡</li>
        </ul>
      </SuccessBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <FileText className="h-5 w-5 text-purple-500" />
        入库单字段说明
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left font-semibold">字段</th>
              <th className="border border-border p-2 text-left font-semibold">必填</th>
              <th className="border border-border p-2 text-left font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">入库单号</td>
              <td className="border border-border p-2"><span className="text-green-600">系统自动</span></td>
              <td className="border border-border p-2">格式：RK + YYMMDD + 3位序号，如 RK240115001</td>
            </tr>
            <tr>
              <td className="border border-border p-2">来货日期</td>
              <td className="border border-border p-2"><span className="text-red-500">*</span></td>
              <td className="border border-border p-2">记录货物到达日期，默认当前日期</td>
            </tr>
            <tr>
              <td className="border border-border p-2">来货时间</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">记录具体到达时间，选填</td>
            </tr>
            <tr>
              <td className="border border-border p-2">内部码</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">企业内部使用的编号，用于内部管理</td>
            </tr>
            <tr>
              <td className="border border-border p-2">自编号</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">客户提供的编号，用于对账识别</td>
            </tr>
            <tr>
              <td className="border border-border p-2">收货人</td>
              <td className="border border-border p-2"><span className="text-red-500">*</span></td>
              <td className="border border-border p-2">本次收货的操作人员，默认当前登录用户</td>
            </tr>
            <tr>
              <td className="border border-border p-2">经手人</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">客户方经办人姓名</td>
            </tr>
            <tr>
              <td className="border border-border p-2">运输方式</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">送货方式，如自送、快递、物流等</td>
            </tr>
            <tr>
              <td className="border border-border p-2">车牌号</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">运输车辆的车牌号码</td>
            </tr>
            <tr>
              <td className="border border-border p-2">司机</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">司机姓名</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <PrinterIcon className="h-5 w-5 text-indigo-500" />
        流程卡打印
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="入库完成后">
          <p>保存入库后，系统会提示"是否立即打印流程卡"</p>
        </Step>
        <Step number={2} title="点击打印">
          <p>点击"打印"按钮打开打印预览窗口</p>
        </Step>
        <Step number={3} title="检查并打印">
          <p>检查流程卡内容是否正确，选择打印机后点击打印</p>
        </Step>
      </div>

      <InfoBox>
        流程卡格式可在"系统设置"-"打印模板配置"中自定义。支持设置纸张大小、页边距、显示字段等。
      </InfoBox>

      <WarningBox title="注意事项">
        <ul className="list-disc list-inside">
          <li>入库前请确认客户和产品已在系统中建档</li>
          <li>数量和重量必须如实填写，影响库存和后续对账</li>
          <li>保存后的入库单不支持直接修改，如有错误需联系管理员</li>
          <li>建议入库后立即打印流程卡，贴在货物上便于识别</li>
        </ul>
      </WarningBox>
    </div>
  ),
};

// 箭头向下图标
function ArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

manualContent['outbound'] = {
  title: '快速发货',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">快速发货用于处理客户产品的出库发货，支持智能筛选可发产品、灵活分批发货、关单平账等功能。</p>

      <ScreenshotPlaceholder label="快速发货页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Truck className="h-5 w-5 text-green-500" />
        三步操作流程
      </h4>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-5 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">1</div>
            <h5 className="font-semibold text-lg text-foreground">选择客户</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">点击"选择客户"按钮：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>打开客户选择弹窗</li>
              <li>可通过客户名称、编号搜索</li>
              <li>系统会显示该客户的待对账提醒</li>
              <li>选择后自动加载该客户的有库存产品</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-5 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">2</div>
            <h5 className="font-semibold text-lg text-foreground">选择产品</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">从可发产品列表中勾选：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>表格显示该客户<strong>有库存</strong>的所有产品</li>
              <li>显示当前可发库存数量（实时）</li>
              <li>支持按批次分别选择</li>
              <li>可勾选多个产品批量发货</li>
              <li>点击产品名称可查看详情</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-5 border border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">3</div>
            <h5 className="font-semibold text-lg text-foreground">录入出库信息</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">填写出库明细：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li><strong>出库数量</strong>：填写本次发货数量（不能超过库存）</li>
              <li><strong>出库重量</strong>：填写总重量，单位kg</li>
              <li><strong>单价</strong>：系统自动带出，可修改</li>
              <li><strong>金额</strong>：系统自动计算（数量×单价）</li>
              <li><strong>收货人/司机/车牌</strong>：运输相关信息</li>
            </ul>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="bg-green-500 hover:bg-green-600">保存发货</Button>
              <Button size="sm" variant="outline">关单平账</Button>
            </div>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-blue-500" />
        正常发货 vs 关单
      </h4>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            正常发货
          </h5>
          <p className="text-sm text-muted-foreground">按实际数量出库，库存相应扣减。适用于常规发货场景。</p>
          <div className="mt-2 text-sm">
            <span className="text-green-600 font-medium">示例：</span>
            <span className="text-muted-foreground">库存100件，发货60件，剩余40件可继续发货</span>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-amber-500" />
            关单平账
          </h5>
          <p className="text-sm text-muted-foreground">将该产品库存清零，用于处理尾数或结束批次。</p>
          <div className="mt-2 text-sm">
            <span className="text-amber-600 font-medium">示例：</span>
            <span className="text-muted-foreground">库存剩3件尾数不再发货，关单后库存变为0</span>
          </div>
        </div>
      </div>

      <WarningBox title="库存校验">
        系统会自动校验出库数量是否超过库存，超过时会提示错误。如确实需要超发，请先通过"库存管理"调整库存。
      </WarningBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <FileText className="h-5 w-5 text-purple-500" />
        出库单字段说明
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left font-semibold">字段</th>
              <th className="border border-border p-2 text-left font-semibold">必填</th>
              <th className="border border-border p-2 text-left font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">出库单号</td>
              <td className="border border-border p-2"><span className="text-green-600">系统自动</span></td>
              <td className="border border-border p-2">格式：CK + YYMMDD + 3位序号，如 CK240115001</td>
            </tr>
            <tr>
              <td className="border border-border p-2">出库日期</td>
              <td className="border border-border p-2"><span className="text-red-500">*</span></td>
              <td className="border border-border p-2">发货日期，默认当前日期</td>
            </tr>
            <tr>
              <td className="border border-border p-2">发货人</td>
              <td className="border border-border p-2"><span className="text-red-500">*</span></td>
              <td className="border border-border p-2">本次发货的操作人员</td>
            </tr>
            <tr>
              <td className="border border-border p-2">收货人</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">客户方收货人姓名</td>
            </tr>
            <tr>
              <td className="border border-border p-2">运输方式</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">发货方式，如自提、快递、物流等</td>
            </tr>
            <tr>
              <td className="border border-border p-2">车牌号</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">运输车辆车牌号码</td>
            </tr>
            <tr>
              <td className="border border-border p-2">司机</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">司机姓名</td>
            </tr>
            <tr>
              <td className="border border-border p-2">备注</td>
              <td className="border border-border p-2">-</td>
              <td className="border border-border p-2">其他需要说明的信息</td>
            </tr>
          </tbody>
        </table>
      </div>

      <SuccessBox title="出库成功">
        保存发货后，系统会自动：
        <ul className="list-disc list-inside mt-1">
          <li>生成出库单号</li>
          <li>扣减对应产品的库存数量</li>
          <li>计算并记录金额</li>
          <li>生成待对账记录</li>
          <li>提示是否打印送货单</li>
        </ul>
      </SuccessBox>
    </div>
  ),
};

manualContent['inventory'] = {
  title: '库存管理',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">库存管理用于实时查看和管理产品库存，支持库存查询、预警监控、手动调整等功能。</p>

      <ScreenshotPlaceholder label="库存管理页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Box className="h-5 w-5 text-blue-500" />
        主要功能
      </h4>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">库存查询</h5>
            <p className="text-sm text-muted-foreground mt-1">查看所有产品的实时库存状态，支持按客户、产品、材质、状态等条件筛选</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">预警监控</h5>
            <p className="text-sm text-muted-foreground mt-1">实时监控库存预警，库存低于设定阈值时高亮显示，支持设置不同客户的预警值</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Edit className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">库存调整</h5>
            <p className="text-sm text-muted-foreground mt-1">支持手动调整库存数量，记录调整原因和操作日志，便于盘点差异处理</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <History className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">库存流水</h5>
            <p className="text-sm text-muted-foreground mt-1">查看每个产品的详细库存变动记录，包括入库、出库、调整等操作</p>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <AlignLeft className="h-5 w-5 text-green-500" />
        库存列表字段说明
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left font-semibold">字段</th>
              <th className="border border-border p-2 text-left font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">产品编号</td>
              <td className="border border-border p-2">产品的唯一编号</td>
            </tr>
            <tr>
              <td className="border border-border p-2">产品名称</td>
              <td className="border border-border p-2">产品名称</td>
            </tr>
            <tr>
              <td className="border border-border p-2">材质</td>
              <td className="border border-border p-2">产品材质，如45#钢、不锈钢等</td>
            </tr>
            <tr>
              <td className="border border-border p-2">工艺</td>
              <td className="border border-border p-2">热处理工艺类型</td>
            </tr>
            <tr>
              <td className="border border-border p-2">所属客户</td>
              <td className="border border-border p-2">产品归属的客户</td>
            </tr>
            <tr>
              <td className="border border-border p-2">当前库存</td>
              <td className="border border-border p-2">实时库存数量</td>
            </tr>
            <tr>
              <td className="border border-border p-2">库存重量(kg)</td>
              <td className="border border-border p-2">库存总重量</td>
            </tr>
            <tr>
              <td className="border border-border p-2">预警阈值</td>
              <td className="border border-border p-2">设定的库存预警值，低于此值会预警</td>
            </tr>
            <tr>
              <td className="border border-border p-2">状态</td>
              <td className="border border-border p-2">正常、预警、超期等状态</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Edit className="h-5 w-5 text-amber-500" />
        如何调整库存
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="选择产品">
          <p>在库存列表中找到要调整的产品，点击"调整"按钮</p>
        </Step>
        <Step number={2} title="填写调整信息">
          <p>在弹出的调整窗口中填写：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li><strong>调整后数量</strong>：输入正确的库存数量</li>
            <li><strong>调整后重量</strong>：输入正确的库存重量</li>
            <li><strong>调整原因</strong>：说明调整的原因（必填）</li>
            <li><strong>备注</strong>：其他需要记录的信息</li>
          </ul>
        </Step>
        <Step number={3} title="确认调整">
          <p>点击"确认调整"按钮提交，系统会记录调整日志</p>
        </Step>
      </div>

      <WarningBox title="调整注意事项">
        <ul className="list-disc list-inside">
          <li>库存调整会直接影响系统库存数量，请谨慎操作</li>
          <li>调整原因必须填写，便于后续追溯</li>
          <li>建议在盘点后统一进行调整，保持账实一致</li>
          <li>所有调整操作都会记录日志，可随时查看</li>
        </ul>
      </WarningBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        库存预警说明
      </h4>

      <div className="space-y-3">
        <p className="text-muted-foreground">系统提供三级预警机制：</p>

        <div className="grid gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <div>
              <span className="font-medium text-green-800 dark:text-green-200">正常</span>
              <span className="text-sm text-green-700 dark:text-green-300 ml-2">库存高于预警阈值</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <div>
              <span className="font-medium text-amber-800 dark:text-amber-200">预警</span>
              <span className="text-sm text-amber-700 dark:text-amber-300 ml-2">库存低于预警阈值，但大于0</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <span className="font-medium text-red-800 dark:text-red-200">缺货</span>
              <span className="text-sm text-red-700 dark:text-red-300 ml-2">库存为0或负数（异常）</span>
            </div>
          </div>
        </div>
      </div>

      <InfoBox>
        预警阈值可在"产品管理"中设置，建议根据客户需求和周转速度设置合理的预警值。不同材质的产品可设置不同的预警阈值。
      </InfoBox>
    </div>
  ),
};

manualContent['reconciliation'] = {
  title: '智能对账',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">智能对账模块实现业财一体化，自动核对出库金额、开票状态、回款进度，支持生成对账单、追踪回款、统计分析。</p>

      <ScreenshotPlaceholder label="智能对账页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Calculator className="h-5 w-5 text-blue-500" />
        对账流程
      </h4>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-5 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">1</div>
            <h5 className="font-semibold text-lg text-foreground">筛选数据范围</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">设置对账条件：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>选择客户（可选择一个或多个客户）</li>
              <li>选择对账周期（如2024年1月）</li>
              <li>选择单据状态（待对账/已对账/全部）</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-5 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">2</div>
            <h5 className="font-semibold text-lg text-foreground">核对差异</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">系统自动生成对账明细：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>显示每笔出库单的详细信息</li>
              <li>自动计算金额合计</li>
              <li>红字标注异常数据（如金额不符）</li>
              <li>可添加备注说明差异原因</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-5 border border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">3</div>
            <h5 className="font-semibold text-lg text-foreground">生成对账单</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">核对无误后生成正式对账单：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>点击"生成对账单"按钮</li>
              <li>系统自动生成对账单号</li>
              <li>可选：电子签章、导出PDF/Excel</li>
              <li>标记相关出库单为"已对账"</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-5 border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg">4</div>
            <h5 className="font-semibold text-lg text-foreground">追踪回款</h5>
          </div>
          <div className="ml-13 space-y-2">
            <p className="text-muted-foreground">记录回款进度：</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>收到客户回款后在对账单中登记</li>
              <li>记录回款日期、金额、方式</li>
              <li>系统自动计算未回款金额</li>
              <li>支持多次回款记录</li>
            </ul>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <FileText className="h-5 w-5 text-green-500" />
        对账单字段说明
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left font-semibold">字段</th>
              <th className="border border-border p-2 text-left font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">对账单号</td>
              <td className="border border-border p-2">系统自动生成，格式：DZ + 年月 + 序号</td>
            </tr>
            <tr>
              <td className="border border-border p-2">客户名称</td>
              <td className="border border-border p-2">对账客户名称</td>
            </tr>
            <tr>
              <td className="border border-border p-2">对账周期</td>
              <td className="border border-border p-2">如"2024年1月"</td>
            </tr>
            <tr>
              <td className="border border-border p-2">出库单数</td>
              <td className="border border-border p-2">本次对账包含的出库单数量</td>
            </tr>
            <tr>
              <td className="border border-border p-2">总金额</td>
              <td className="border border-border p-2">所有出库单金额合计</td>
            </tr>
            <tr>
              <td className="border border-border p-2">扣减金额</td>
              <td className="border border-border p-2">客户要求扣减的金额（如质量问题）</td>
            </tr>
            <tr>
              <td className="border border-border p-2">其他金额</td>
              <td className="border border-border p-2">其他增减项金额</td>
            </tr>
            <tr>
              <td className="border border-border p-2">应付金额</td>
              <td className="border border-border p-2">客户应支付金额 = 总金额 - 扣减 + 其他</td>
            </tr>
            <tr>
              <td className="border border-border p-2">已开票金额</td>
              <td className="border border-border p-2">已开具发票的金额</td>
            </tr>
            <tr>
              <td className="border border-border p-2">未开票金额</td>
              <td className="border border-border p-2">应付金额 - 已开票金额</td>
            </tr>
            <tr>
              <td className="border border-border p-2">已回款金额</td>
              <td className="border border-border p-2">客户已支付的金额</td>
            </tr>
            <tr>
              <td className="border border-border p-2">未回款金额</td>
              <td className="border border-border p-2">应付金额 - 已回款金额（红色显示）</td>
            </tr>
            <tr>
              <td className="border border-border p-2">状态</td>
              <td className="border border-border p-2">待对账/已对账/部分回款/已结清</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-amber-500" />
        回款记录
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">在对账单详情页可以添加回款记录：</p>
        <Step number={1} title="进入对账单详情">
          <p>在列表中点击对账单号进入详情页</p>
        </Step>
        <Step number={2} title="点击「添加回款」">
          <p>在回款记录区域点击"添加回款"按钮</p>
        </Step>
        <Step number={3} title='填写回款信息'>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li><strong>回款日期</strong>：实际收到款项的日期</li>
            <li><strong>回款金额</strong>：本次回款金额</li>
            <li><strong>回款方式</strong>：银行转账、现金、支票等</li>
            <li><strong>备注</strong>：交易流水号等其他信息</li>
          </ul>
        </Step>
        <Step number={4} title="保存记录">
          <p>点击保存，系统自动更新未回款金额</p>
        </Step>
      </div>

      <InfoBox>
        支持分多次回款，系统自动累计已回款金额。当已回款金额等于应付金额时，对账单状态自动变为"已结清"。
      </InfoBox>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-purple-500" />
        导出对账单
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">对账单支持多种格式导出：</p>
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">Excel导出：</span>
            <span className="text-muted-foreground">导出为.xlsx文件，方便客户编辑和二次处理</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">PDF导出：</span>
            <span className="text-muted-foreground">导出为PDF文件，格式固定，适合正式对账</span>
          </div>
        </div>
      </div>

      <WarningBox title="对账注意事项">
        <ul className="list-disc list-inside">
          <li>对账前请确保所有出库单信息准确无误</li>
          <li>发现差异请及时与客户沟通确认</li>
          <li>已生成对账单的出库单不能重复对账</li>
          <li>建议每月定期对账，及时跟进回款</li>
          <li>超期未回款客户会在工作台预警区显示</li>
        </ul>
      </WarningBox>
    </div>
  ),
};

manualContent['statistics'] = {
  title: '数据统计',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">数据统计模块提供多维度的业务数据分析报表，帮助管理者掌握经营状况，辅助决策。</p>

      <ScreenshotPlaceholder label="数据统计页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <PieChart className="h-5 w-5 text-blue-500" />
        统计报表类型
      </h4>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            综合报表
          </h5>
          <p className="text-sm text-muted-foreground mb-2">展示整体业务数据趋势，包含以下维度：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>入库数量趋势（日/月/年）</li>
            <li>出库数量趋势（日/月/年）</li>
            <li>金额趋势（日/月/年）</li>
            <li>库存周转率</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            客户分析
          </h5>
          <p className="text-sm text-muted-foreground mb-2">从客户维度分析业务数据：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>客户发货量排行 TOP10</li>
            <li>客户回款率分析</li>
            <li>客户活跃度统计</li>
            <li>客户增长趋势</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Box className="h-5 w-5 text-amber-500" />
            产品运行统计
          </h5>
          <p className="text-sm text-muted-foreground mb-2">从产品维度分析业务数据：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>产品出库量热力图</li>
            <li>产品加工周期统计</li>
            <li>材质分布分析</li>
            <li>工艺类型占比</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-500" />
            延误分析
          </h5>
          <p className="text-sm text-muted-foreground mb-2">分析订单处理时效：</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>延误订单数量统计</li>
            <li>延误原因分布</li>
            <li>平均处理周期</li>
            <li>各环节耗时分析</li>
          </ul>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-purple-500" />
        时间维度切换
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">统计报表支持三种时间粒度查看：</p>
        <div className="flex gap-4">
          <div className="flex-1 border rounded-lg p-3 text-center">
            <div className="font-semibold text-foreground">年报</div>
            <div className="text-sm text-muted-foreground">查看年度数据汇总</div>
          </div>
          <div className="flex-1 border rounded-lg p-3 text-center">
            <div className="font-semibold text-foreground">月报</div>
            <div className="text-sm text-muted-foreground">查看月度数据趋势</div>
          </div>
          <div className="flex-1 border rounded-lg p-3 text-center">
            <div className="font-semibold text-foreground">日报</div>
            <div className="text-sm text-muted-foreground">查看每日数据明细</div>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Filter className="h-5 w-5 text-green-500" />
        数据筛选
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">支持多维度筛选数据：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li><strong>时间范围</strong>：选择起始日期和结束日期</li>
          <li><strong>客户</strong>：筛选特定客户的数据</li>
          <li><strong>产品</strong>：筛选特定产品的数据</li>
          <li><strong>材质</strong>：按材质类型筛选</li>
        </ul>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Download className="h-5 w-5 text-indigo-500" />
        报表导出
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">统计报表支持导出为Excel文件：</p>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">图表导出：</span>
            <span className="text-muted-foreground">将当前图表保存为图片</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">数据导出：</span>
            <span className="text-muted-foreground">导出原始数据到Excel</span>
          </div>
        </div>
      </div>

      <InfoBox>
        统计数据每天凌晨自动更新一次。如需查看最新数据，可点击"刷新"按钮手动更新。
      </InfoBox>
    </div>
  ),
};

manualContent['customers'] = {
  title: '客户管理',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">客户管理用于维护客户基础信息及个性化配置，包括客户档案、历史交易记录、特殊要求等。</p>

      <ScreenshotPlaceholder label="客户管理页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-500" />
        客户档案
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">每个客户档案包含以下信息：</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left font-semibold">字段</th>
                <th className="border border-border p-2 text-left font-semibold">必填</th>
                <th className="border border-border p-2 text-left font-semibold">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">客户编号</td>
                <td className="border border-border p-2"><span className="text-red-500">*</span></td>
                <td className="border border-border p-2">唯一编号，建议使用客户简称拼音首字母</td>
              </tr>
              <tr>
                <td className="border border-border p-2">客户名称</td>
                <td className="border border-border p-2"><span className="text-red-500">*</span></td>
                <td className="border border-border p-2">客户公司全称</td>
              </tr>
              <tr>
                <td className="border border-border p-2">联系人</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">主要联系人姓名</td>
              </tr>
              <tr>
                <td className="border border-border p-2">联系电话</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">联系电话，固话或手机</td>
              </tr>
              <tr>
                <td className="border border-border p-2">地址</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">客户公司地址</td>
              </tr>
              <tr>
                <td className="border border-border p-2">运输方式</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">默认运输方式</td>
              </tr>
              <tr>
                <td className="border border-border p-2">账期</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">回款账期天数，用于超期预警</td>
              </tr>
              <tr>
                <td className="border border-border p-2">送货方向</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">送货地址或方向说明</td>
              </tr>
              <tr>
                <td className="border border-border p-2">结算方式</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">月结、现结等结算方式</td>
              </tr>
              <tr>
                <td className="border border-border p-2">客户类别</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">VIP、普通等分类</td>
              </tr>
              <tr>
                <td className="border border-border p-2">备注</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">其他说明信息</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Plus className="h-5 w-5 text-green-500" />
        新增客户
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="打开新增页面">
          <p>点击"新增客户"按钮</p>
        </Step>
        <Step number={2} title="填写客户信息">
          <p>按照表单要求填写客户各项信息，带*号的为必填项</p>
        </Step>
        <Step number={3} title="保存客户">
          <p>点击"保存"按钮，系统自动生成客户编号（如未填写）</p>
        </Step>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <History className="h-5 w-5 text-purple-500" />
        客户历史记录
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">在客户详情页可查看该客户的完整交易历史：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li><strong>入库记录</strong>：所有来货登记记录</li>
          <li><strong>出库记录</strong>：所有发货记录</li>
          <li><strong>对账记录</strong>：历史对账单列表</li>
          <li><strong>回款记录</strong>：回款明细</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">支持按时间范围筛选，支持导出历史记录。</p>
      </div>

      <InfoBox>
        客户删除后将无法恢复，且会影响历史数据的显示。建议将不合作的客户状态设为"停用"而非删除。
      </InfoBox>
    </div>
  ),
};

// 添加缺失的图标组件
function Calculator({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="14" />
      <path d="M8 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M12 14h.01" />
    </svg>
  );
}

manualContent['products'] = {
  title: '产品管理',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">产品管理用于维护热处理产品的基础数据库，包括产品档案、材质工艺、价格信息、库存预警设置等。</p>

      <ScreenshotPlaceholder label="产品管理页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Box className="h-5 w-5 text-blue-500" />
        产品档案
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">每个产品档案包含以下信息：</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left font-semibold">字段</th>
                <th className="border border-border p-2 text-left font-semibold">必填</th>
                <th className="border border-border p-2 text-left font-semibold">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">产品编号</td>
                <td className="border border-border p-2"><span className="text-red-500">*</span></td>
                <td className="border border-border p-2">唯一编号，建议使用分类+序号格式</td>
              </tr>
              <tr>
                <td className="border border-border p-2">产品名称</td>
                <td className="border border-border p-2"><span className="text-red-500">*</span></td>
                <td className="border border-border p-2">产品名称，如"齿轮轴"</td>
              </tr>
              <tr>
                <td className="border border-border p-2">材质</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">材质，如45#钢、40Cr等</td>
              </tr>
              <tr>
                <td className="border border-border p-2">工艺</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">热处理工艺类型，如淬火、回火等</td>
              </tr>
              <tr>
                <td className="border border-border p-2">工件号</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">客户的工件编号，用于识别</td>
              </tr>
              <tr>
                <td className="border border-border p-2">计价单位</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">件、kg、吨等</td>
              </tr>
              <tr>
                <td className="border border-border p-2">单价</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">单价（元），用于计算金额</td>
              </tr>
              <tr>
                <td className="border border-border p-2">所属客户</td>
                <td className="border border-border p-2"><span className="text-red-500">*</span></td>
                <td className="border border-border p-2">产品归属的客户</td>
              </tr>
              <tr>
                <td className="border border-border p-2">预警阈值</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">库存预警值，默认50</td>
              </tr>
              <tr>
                <td className="border border-border p-2">最大存放天数</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">超过此天数会触发超期预警</td>
              </tr>
              <tr>
                <td className="border border-border p-2">技术要求</td>
                <td className="border border-border p-2">-</td>
                <td className="border border-border p-2">热处理工艺要求说明</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Plus className="h-5 w-5 text-green-500" />
        新增产品
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="打开新增页面">
          <p>点击"新增产品"按钮</p>
        </Step>
        <Step number={2} title="填写产品信息">
          <p>填写产品各项信息，选择所属客户</p>
        </Step>
        <Step number={3} title="保存产品">
          <p>点击"保存"按钮，产品即创建成功</p>
        </Step>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Tag className="h-5 w-5 text-amber-500" />
        产品分类
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">产品可按以下维度分类管理：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li><strong>按材质</strong>：碳钢、合金钢、不锈钢等</li>
          <li><strong>按工艺</strong>：淬火、回火、正火、退火等</li>
          <li><strong>按客户</strong>：每个客户的产品独立管理</li>
        </ul>
      </div>

      <WarningBox title="删除限制">
        已有出入库记录的产品不能直接删除，需要先删除关联的出入库记录。建议将不用的产品状态设为"停用"。
      </WarningBox>
    </div>
  ),
};

manualContent['templates'] = {
  title: '打印模板配置',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">打印模板配置用于自定义各类单据的打印格式，包括流程卡、送货单、对账单等，可设置纸张规格、字段显示、布局样式等。</p>

      <ScreenshotPlaceholder label="打印模板配置页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        模板类型
      </h4>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">流程卡模板</h5>
            <p className="text-sm text-muted-foreground mt-1">来货登记时打印的产品标识卡，包含产品信息、入库日期等</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Truck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">送货单模板</h5>
            <p className="text-sm text-muted-foreground mt-1">发货时随货同行的送货单据，包含发货明细、金额等</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Calculator className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">对账单模板</h5>
            <p className="text-sm text-muted-foreground mt-1">与客户对账时使用的对账单据，包含期间交易明细</p>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Settings className="h-5 w-5 text-green-500" />
        配置步骤
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="选择模板类型">
          <p>在模板列表中选择要配置的模板类型</p>
        </Step>
        <Step number={2} title="设置纸张规格">
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>纸张大小：A4、A5、自定义等</li>
            <li>纸张方向：纵向/横向</li>
            <li>页边距：上、下、左、右边距</li>
          </ul>
        </Step>
        <Step number={3} title="配置显示字段">
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>勾选需要在单据上显示的字段</li>
            <li>拖拽调整字段顺序</li>
            <li>设置字段宽度</li>
          </ul>
        </Step>
        <Step number={4} title="预览测试">
          <p>点击"预览"按钮查看效果，可使用测试数据验证</p>
        </Step>
        <Step number={5} title="保存配置">
          <p>确认无误后点击"保存"按钮保存模板配置</p>
        </Step>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Maximize2 className="h-5 w-5 text-amber-500" />
        常用纸张设置建议
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left font-semibold">单据类型</th>
              <th className="border border-border p-2 text-left font-semibold">建议纸张</th>
              <th className="border border-border p-2 text-left font-semibold">方向</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">流程卡</td>
              <td className="border border-border p-2">A5 或自定义(100x150mm)</td>
              <td className="border border-border p-2">纵向</td>
            </tr>
            <tr>
              <td className="border border-border p-2">送货单</td>
              <td className="border border-border p-2">A4</td>
              <td className="border border-border p-2">纵向</td>
            </tr>
            <tr>
              <td className="border border-border p-2">对账单</td>
              <td className="border border-border p-2">A4</td>
              <td className="border border-border p-2">横向/纵向均可</td>
            </tr>
          </tbody>
        </table>
      </div>

      <InfoBox>
        模板配置保存后即时生效，建议在正式使用前先用测试数据打印验证，确保格式正确。
      </InfoBox>
    </div>
  ),
};

manualContent['display'] = {
  title: '页面显示设置',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">页面显示设置用于自定义系统界面显示偏好，包括主题模式、字体大小、紧凑模式等，打造个性化的使用体验。</p>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Palette className="h-5 w-5 text-blue-500" />
        主题模式
      </h4>

      <div className="space-y-4 ml-4">
        <p className="text-muted-foreground">系统支持三种主题模式，可在页面右上角快速切换：</p>

        <div className="grid gap-3">
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 border rounded-lg">
            <div className="w-12 h-12 rounded-lg bg-white border shadow-sm flex items-center justify-center">
              <Sun className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-foreground">浅色模式</h5>
              <p className="text-sm text-muted-foreground">白色背景，深色文字，适合明亮环境</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 border rounded-lg">
            <div className="w-12 h-12 rounded-lg bg-slate-800 border shadow-sm flex items-center justify-center">
              <Moon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-foreground">深色模式</h5>
              <p className="text-sm text-muted-foreground">深色背景，浅色文字，适合暗光环境，减轻眼部疲劳</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 border rounded-lg">
            <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-center">
              <Eye className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-foreground">护眼模式</h5>
              <p className="text-sm text-muted-foreground">暖黄色调，减少蓝光，适合长时间使用</p>
            </div>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Type className="h-5 w-5 text-green-500" />
        字体大小
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">调整系统整体字体大小：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li><strong>小</strong>：适合大屏幕，显示更多内容</li>
          <li><strong>中</strong>：默认大小，平衡显示与可读性</li>
          <li><strong>大</strong>：适合小屏幕或视力需要</li>
        </ul>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Grid className="h-5 w-5 text-amber-500" />
        紧凑模式
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">开启紧凑模式后：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li>表格行高减小，显示更多行数据</li>
          <li>卡片间距减小，页面更紧凑</li>
          <li>适合数据密集型操作场景</li>
        </ul>
      </div>

      <SuccessBox title="设置保存">
        所有显示设置会自动保存到浏览器本地，下次登录时自动恢复。不同设备的设置相互独立。
      </SuccessBox>
    </div>
  ),
};

manualContent['permissions'] = {
  title: '权限管理',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">权限管理用于设置用户的访问权限和操作权限，确保数据安全和职责分离。只有管理员可以访问此功能。</p>

      <ScreenshotPlaceholder label="权限管理页面示意图" />

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-500" />
        角色管理
      </h4>

      <div className="space-y-4 ml-4">
        <p className="text-muted-foreground">系统预设以下角色，也可自定义新角色：</p>

        <div className="space-y-3">
          <div className="p-4 border rounded-lg">
            <h5 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              管理员
            </h5>
            <p className="text-sm text-muted-foreground mt-1">拥有系统所有权限，包括用户管理、权限设置、数据备份等</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">全部功能</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">系统设置</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">用户管理</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h5 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              操作员
            </h5>
            <p className="text-sm text-muted-foreground mt-1">日常业务操作人员，负责收发货、对账等业务</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">来货登记</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">快速发货</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">库存查询</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">对账</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h5 className="font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              财务人员
            </h5>
            <p className="text-sm text-muted-foreground mt-1">负责财务相关工作，侧重对账和回款管理</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">智能对账</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">回款管理</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">数据统计</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h5 className="font-semibold text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-500" />
              查看员
            </h5>
            <p className="text-sm text-muted-foreground mt-1">只能查看数据，不能进行任何修改操作</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">只读查看</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">导出报表</span>
            </div>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Key className="h-5 w-5 text-green-500" />
        权限粒度
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">权限控制粒度包括：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li><strong>菜单权限</strong>：控制可见的功能模块</li>
          <li><strong>操作权限</strong>：控制新增、编辑、删除等操作</li>
          <li><strong>数据权限</strong>：控制可查看的数据范围（如仅自己的数据）</li>
          <li><strong>字段权限</strong>：控制敏感字段的查看（如单价、金额）</li>
        </ul>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <User className="h-5 w-5 text-purple-500" />
        用户管理
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="添加用户">
          <p>点击"添加用户"，输入用户信息，选择所属角色</p>
        </Step>
        <Step number={2} title="分配权限">
          <p>可为用户单独调整权限，覆盖角色的默认设置</p>
        </Step>
        <Step number={3} title="启用账号">
          <p>设置初始密码，账号创建后即可使用</p>
        </Step>
      </div>

      <WarningBox title="权限安全">
        <ul className="list-disc list-inside">
          <li>请根据岗位职责合理分配权限，遵循最小权限原则</li>
          <li>敏感操作（如删除、价格修改）建议限制人员范围</li>
          <li>员工离职后及时禁用账号</li>
          <li>定期审查用户权限，清理不必要的授权</li>
        </ul>
      </WarningBox>
    </div>
  ),
};

manualContent['profile'] = {
  title: '个人中心',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">个人中心用于管理用户个人信息和账号设置，包括修改密码、查看操作记录等。</p>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <User className="h-5 w-5 text-blue-500" />
        个人信息
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">可查看和修改以下信息：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li><strong>用户名</strong>：登录账号</li>
          <li><strong>姓名</strong>：显示名称</li>
          <li><strong>联系电话</strong>：联系方式</li>
          <li><strong>邮箱</strong>：电子邮箱地址</li>
          <li><strong>头像</strong>：个人头像（可选）</li>
        </ul>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Key className="h-5 w-5 text-amber-500" />
        修改密码
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="进入密码修改">
          <p>在个人中心点击"修改密码"</p>
        </Step>
        <Step number={2} title="输入原密码">
          <p>输入当前密码验证身份</p>
        </Step>
        <Step number={3} title="设置新密码">
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
            <li>新密码长度至少8位</li>
            <li>建议包含字母和数字</li>
            <li>避免使用简单密码</li>
          </ul>
        </Step>
        <Step number={4} title="确认修改">
          <p>点击"确认修改"按钮完成密码更新</p>
        </Step>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <History className="h-5 w-5 text-purple-500" />
        操作记录
      </h4>

      <div className="space-y-3 ml-4">
        <p className="text-muted-foreground">查看个人的操作历史，包括：</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          <li>登录记录（时间、IP地址）</li>
          <li>数据操作记录（新增、修改、删除）</li>
          <li>导出记录</li>
          <li>打印记录</li>
        </ul>
        <InfoBox>操作记录保留最近90天的数据，可用于追溯和问题排查。</InfoBox>
      </div>
    </div>
  ),
};

manualContent['faq'] = {
  title: '常见问题解答',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">这里汇总了用户经常遇到的问题及其解决方案，建议先查阅此处再寻求技术支持。</p>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-blue-500" />
        登录相关问题
      </h4>

      <div className="space-y-4 ml-4">
        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 忘记密码怎么办？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 请联系系统管理员重置密码。管理员可在"权限管理"-"用户管理"中找到您的账号，点击"重置密码"。重置后请尽快登录修改为您自己的密码。
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 账号被锁定怎么办？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 连续输入错误密码5次后账号会被临时锁定30分钟。您也可以联系管理员立即解锁。
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 无法登录提示"权限不足"？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 请联系管理员检查您的账号角色和权限设置，确保已分配正确的角色。
          </p>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <Package className="h-5 w-5 text-green-500" />
        业务操作问题
      </h4>

      <div className="space-y-4 ml-4">
        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 入库时找不到客户/产品？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 请先确认客户或产品已在系统中建档。如未建档，请先在"客户管理"或"产品管理"中新增。
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 出库时提示库存不足？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 请先在"库存管理"中确认实际库存。如库存确实不足，需要等待客户来货补充库存后再发货。
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 如何修改已保存的入库单？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 已保存的入库单不支持直接修改。如需更正，请联系管理员通过库存调整功能处理。
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 对账金额不对怎么办？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 请核对出库单的单价和数量是否正确。如发现历史出库单数据有误，需要作废重开。
          </p>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <PrinterIcon className="h-5 w-5 text-purple-500" />
        打印相关问题
      </h4>

      <div className="space-y-4 ml-4">
        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 打印预览显示正常但打印出来错位？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 请检查打印机纸张设置是否与模板设置一致。建议在"打印模板配置"中调整页边距后重新测试。
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h5 className="font-medium text-foreground">Q: 打印机无响应？</h5>
          <p className="text-sm text-muted-foreground mt-2">
            A: 请检查：1）打印机是否开机并连接；2）纸张是否充足；3）打印队列是否有卡住的任务。
          </p>
        </div>
      </div>
    </div>
  ),
};

manualContent['troubleshooting'] = {
  title: '故障排除',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">遇到系统异常时，可参考以下步骤进行排查和处理。</p>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        常见错误及解决
      </h4>

      <div className="space-y-4 ml-4">
        <div className="border-l-4 border-red-500 pl-4 py-2">
          <h5 className="font-medium text-foreground">页面加载缓慢或卡顿</h5>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>可能原因：</strong>网络连接不稳定、数据量过大、浏览器缓存过多<br/>
            <strong>解决方法：</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
            <li>检查网络连接</li>
            <li>尝试刷新页面</li>
            <li>清除浏览器缓存（Ctrl+Shift+Delete）</li>
            <li>关闭不必要的浏览器标签页</li>
          </ul>
        </div>

        <div className="border-l-4 border-amber-500 pl-4 py-2">
          <h5 className="font-medium text-foreground">保存数据时提示错误</h5>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>可能原因：</strong>必填项未填、数据格式错误、网络中断<br/>
            <strong>解决方法：</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
            <li>检查所有必填项是否已填写</li>
            <li>检查数字字段是否输入了正确格式</li>
            <li>查看错误提示信息，按提示修正</li>
            <li>网络恢复后重试</li>
          </ul>
        </div>

        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <h5 className="font-medium text-foreground">数据不显示或显示不正确</h5>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>可能原因：</strong>筛选条件限制、缓存数据过期、权限不足<br/>
            <strong>解决方法：</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
            <li>清除所有筛选条件后重试</li>
            <li>点击刷新按钮更新数据</li>
            <li>检查是否有查看该数据的权限</li>
          </ul>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-green-500" />
        通用排查步骤
      </h4>

      <div className="space-y-3 ml-4">
        <Step number={1} title="刷新页面">
          <p>按 <Kbd>F5</Kbd> 或点击浏览器刷新按钮，重新加载页面</p>
        </Step>
        <Step number={2} title="清除缓存">
          <p>按 <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>Delete</Kbd> 清除浏览器缓存，选择"缓存的图像和文件"</p>
        </Step>
        <Step number={3} title="更换浏览器">
          <p>尝试使用其他浏览器（推荐Chrome、Edge最新版本）</p>
        </Step>
        <Step number={4} title="检查网络">
          <p>确认网络连接正常，可尝试访问其他网站验证</p>
        </Step>
        <Step number={5} title="联系支持">
          <p>如以上方法均无效，请记录错误信息并联系技术支持</p>
        </Step>
      </div>

      <InfoBox>
        遇到问题时，请尽量记录以下信息以便技术支持快速定位：
        <ul className="list-disc list-inside mt-1">
          <li>错误提示的完整内容</li>
          <li>操作步骤</li>
          <li>出现问题的时间</li>
          <li>使用的浏览器版本</li>
        </ul>
      </InfoBox>
    </div>
  ),
};

manualContent['support'] = {
  title: '技术支持',
  content: (
    <div className="space-y-6">
      <p className="text-muted-foreground">如在使用过程中遇到问题，可通过以下方式获得帮助。</p>

      <h4 className="font-semibold text-lg flex items-center gap-2">
        <Phone className="h-5 w-5 text-blue-500" />
        联系方式
      </h4>

      <div className="space-y-4 ml-4">
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Phone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">技术支持热线</h5>
            <p className="text-lg font-mono text-primary mt-1">400-XXX-XXXX</p>
            <p className="text-sm text-muted-foreground">服务时间：工作日 9:00-18:00</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">电子邮箱</h5>
            <p className="text-lg font-mono text-primary mt-1">support@example.com</p>
            <p className="text-sm text-muted-foreground">24小时内回复</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h5 className="font-semibold text-foreground">在线客服</h5>
            <p className="text-sm text-muted-foreground mt-1">点击页面右下角在线客服图标，与客服人员实时沟通</p>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-6 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-purple-500" />
        其他资源
      </h4>

      <div className="space-y-3 ml-4">
        <div className="flex items-start gap-3">
          <ArrowRight className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">视频教程：</span>
            <span className="text-muted-foreground">访问帮助中心观看操作视频</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ArrowRight className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">更新日志：</span>
            <span className="text-muted-foreground">查看系统版本更新内容</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ArrowRight className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">意见反馈：</span>
            <span className="text-muted-foreground">提交功能建议或问题反馈</span>
          </div>
        </div>
      </div>

      <SuccessBox title="反馈建议">
        如果您有好的功能建议或使用心得，欢迎随时反馈。您的建议是我们持续改进的动力！
      </SuccessBox>
    </div>
  ),
};

// 添加缺失的图标组件
function MessageSquare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// 现在更新目录结构，添加所有新章节
const sections = [
  {
    title: '入门指南',
    items: [
      { id: 'intro', title: '系统概述', icon: BookOpen },
      { id: 'audience', title: '适用对象', icon: Users },
      { id: 'features', title: '核心特点', icon: CheckCircle },
      { id: 'specs', title: '技术规格', icon: Monitor },
      { id: 'login', title: '登录系统', icon: Key },
      { id: 'themes', title: '主题切换指南', icon: Palette },
    ],
  },
  {
    title: '界面与操作',
    items: [
      { id: 'layout', title: '界面布局详解', icon: LayoutDashboard },
      { id: 'common-ops', title: '通用操作说明', icon: MousePointer },
      { id: 'keyboard-shortcuts', title: '快捷键大全', icon: Keyboard },
    ],
  },
  {
    title: '功能模块',
    items: [
      { id: 'dashboard', title: '工作台', icon: LayoutDashboard },
      { id: 'inbound', title: '来货登记', icon: Package },
      { id: 'outbound', title: '快速发货', icon: Truck },
      { id: 'inventory', title: '库存管理', icon: Box },
      { id: 'reconciliation', title: '智能对账', icon: Calculator },
      { id: 'statistics', title: '数据统计', icon: BarChart3 },
      { id: 'customers', title: '客户管理', icon: Users },
      { id: 'products', title: '产品管理', icon: Box },
    ],
  },
  {
    title: '系统设置',
    items: [
      { id: 'templates', title: '打印模板配置', icon: FileText },
      { id: 'display', title: '页面显示设置', icon: Monitor },
      { id: 'permissions', title: '权限管理', icon: Shield },
      { id: 'profile', title: '个人中心', icon: User },
    ],
  },
  {
    title: '帮助与支持',
    items: [
      { id: 'faq', title: '常见问题解答', icon: HelpCircle },
      { id: 'troubleshooting', title: '故障排除', icon: AlertTriangle },
      { id: 'support', title: '技术支持', icon: Phone },
    ],
  },
];

export default function UserManualPage() {
  const [activeSection, setActiveSection] = useState('intro');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const currentContent = manualContent[activeSection];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">用户手册</h1>
                <p className="text-sm text-muted-foreground">热处理收发货管理系统 V1.0</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 侧边栏目录 */}
          <aside className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0`}>
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <List className="h-5 w-5" />
                  目录
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <div key={section.title}>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                          {section.title}
                        </h3>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left ${
                                  activeSection === item.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted text-foreground'
                                }`}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{item.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </aside>

          {/* 主内容区 */}
          <main className="flex-1 min-w-0">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  {sections.find(s => s.items.some(i => i.id === activeSection))?.title}
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-foreground font-medium">{currentContent?.title}</span>
                </div>
                <CardTitle className="text-2xl">{currentContent?.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {currentContent?.content}
              </CardContent>
            </Card>

            {/* 导航按钮 */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  const allItems = sections.flatMap(s => s.items);
                  const currentIndex = allItems.findIndex(i => i.id === activeSection);
                  if (currentIndex > 0) {
                    scrollToSection(allItems[currentIndex - 1].id);
                  }
                }}
                disabled={activeSection === 'intro'}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                上一章
              </Button>
              <Button
                onClick={() => {
                  const allItems = sections.flatMap(s => s.items);
                  const currentIndex = allItems.findIndex(i => i.id === activeSection);
                  if (currentIndex < allItems.length - 1) {
                    scrollToSection(allItems[currentIndex + 1].id);
                  }
                }}
                disabled={activeSection === 'support'}
              >
                下一章
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
