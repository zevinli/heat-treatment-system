import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as echarts from 'echarts';
import {
  Apple,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  MoreHorizontal,
  Plus,
  Send,
} from 'lucide-react';
// 初始 Team Members 数据
const initialTeamMembers = [
  {
    id: 1,
    name: 'Toby Belhome',
    email: 'contact@bundui.io',
    role: 'Viewer',
    avatar: 'TB',
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'pre@example.com',
    role: 'Developer',
    avatar: 'JL',
  },
  {
    id: 3,
    name: 'Hally Gray',
    email: 'hally@site.com',
    role: 'Viewer',
    avatar: 'HG',
  },
];
// 角色选项
const roleOptions = ['Viewer', 'Developer', 'Admin', 'Owner'];
// 初始聊天消息
const initialChatMessages = [
  { id: 1, text: 'Hi, how can I help you today?', isUser: false },
  { id: 2, text: "Hey, I'm having trouble with my account.", isUser: true },
  { id: 3, text: 'What seems to be the problem?', isUser: false },
  { id: 4, text: "I can't log in.", isUser: true },
];
// 支付数据
const allPayments = [
  {
    id: 1,
    customer: 'Kenneth Thompson',
    email: 'ken99@yahoo.com',
    amount: '$316.00',
    status: 'Success',
  },
  {
    id: 2,
    customer: 'Abraham Lincoln',
    email: 'abe45@gmail.com',
    amount: '$242.00',
    status: 'Success',
  },
  {
    id: 3,
    customer: 'Monserrat Rodriguez',
    email: 'monserrat44@gmail.com',
    amount: '$837.00',
    status: 'Processing',
  },
  {
    id: 4,
    customer: 'Silas Johnson',
    email: 'silas22@gmail.com',
    amount: '$874.00',
    status: 'Success',
  },
  {
    id: 5,
    customer: 'Carmella DeVito',
    email: 'carmella@hotmail.com',
    amount: '$721.00',
    status: 'Failed',
  },
  {
    id: 6,
    customer: 'Maria Garcia',
    email: 'maria@gmail.com',
    amount: '$529.00',
    status: 'Success',
  },
  {
    id: 7,
    customer: 'James Wilson',
    email: 'james34@outlook.com',
    amount: '$438.00',
    status: 'Processing',
  },
  {
    id: 8,
    customer: 'Sarah Jones',
    email: 'sarah.j@yahoo.com',
    amount: '$692.00',
    status: 'Success',
  },
];
// 支付方式类型
type PaymentMethodType = 'card' | 'paypal' | 'apple';
// 柱状图组件
function SubscriptionsChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      grid: { top: 30, right: 10, bottom: 20, left: 30 },
      xAxis: {
        type: 'category',
        data: ['', '', '', '', '', '', ''],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          data: [240, 300, 200, 278, 189, 239, 278],
          type: 'bar',
          barWidth: 30,
          itemStyle: { color: '#18181b', borderRadius: [4, 4, 0, 0] },
          label: {
            position: 'top',
            color: '#71717a',
            fontSize: 11,
          },
        },
      ],
    });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []);
  return <div ref={chartRef} className="h-[120px] w-full" />;
}
// 折线图组件 - Total Revenue
function RevenueChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      grid: { top: 10, right: 10, bottom: 10, left: 10 },
      xAxis: {
        type: 'category',
        data: ['', '', '', '', '', '', '', '', ''],
        show: false,
      },
      yAxis: { type: 'value', show: false },
      series: [
        {
          data: [20, 35, 25, 45, 30, 55, 40, 50, 45],
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#18181b', width: 2 },
          itemStyle: { color: '#18181b', borderColor: '#fff', borderWidth: 2 },
        },
      ],
    });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []);
  return <div ref={chartRef} className="h-[80px] w-full" />;
}
// Exercise Minutes 双线图
function ExerciseChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      grid: { top: 20, right: 20, bottom: 20, left: 20 },
      xAxis: {
        type: 'category',
        data: ['', '', '', '', '', '', '', '', '', '', ''],
        show: false,
      },
      yAxis: { type: 'value', show: false },
      series: [
        {
          data: [80, 50, 120, 100, 90, 130, 110, 140, 100, 120, 150],
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#18181b', width: 2 },
          itemStyle: { color: '#18181b', borderColor: '#fff', borderWidth: 2 },
        },
        {
          data: [60, 80, 70, 90, 75, 100, 85, 95, 120, 100, 110],
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#d4d4d8', width: 2 },
          itemStyle: { color: '#d4d4d8', borderColor: '#fff', borderWidth: 2 },
        },
      ],
    });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []);
  return <div ref={chartRef} className="h-[200px] w-full" />;
}
// 状态徽章
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Processing: 'bg-slate-50 text-slate-700 border-slate-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <Badge variant="outline" className={`${variants[status]} font-medium`}>
      {status}
    </Badge>
  );
}
// PayPal 图标
function PaypalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.384a.77.77 0 0 1 .757-.645h6.96c2.307 0 4.106.588 5.343 1.748 1.237 1.16 1.724 2.78 1.447 4.812-.318 2.334-1.28 4.165-2.857 5.44-1.577 1.276-3.63 1.924-6.098 1.924H8.32a.77.77 0 0 0-.758.645l-1.073 4.029h.587z" />
    </svg>
  );
}
// 自定义 Checkbox 组件
function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary text-primary-foreground' : 'bg-background'
      }`}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}
// 角色选择下拉组件
function RoleDropdown({
  currentRole,
  onRoleChange,
}: {
  currentRole: string;
  onRoleChange: (role: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1"
        onClick={() => setOpen(!open)}
      >
        {currentRole}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute top-full right-0 z-10 mt-1 w-32 rounded-md border bg-white shadow-lg">
          {roleOptions.map((role) => (
            <button
              key={role}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-100"
              onClick={() => {
                onRoleChange(role);
                setOpen(false);
              }}
            >
              {role}
              {role === currentRole && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default function DashboardDemo() {
  // 团队成员状态
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  // 聊天消息状态
  const [messages, setMessages] = useState(initialChatMessages);
  const [messageInput, setMessageInput] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // 支付方式状态
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>('apple');
  // 表单状态
  const [cardName, setCardName] = useState('Essay');
  const [city, setCity] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('October');
  const [expYear, setExpYear] = useState('2032');
  const [cvc, setCvc] = useState('');
  // 表格筛选状态
  const [filterText, setFilterText] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  // 月份/年份下拉状态
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        monthRef.current &&
        !monthRef.current.contains(event.target as Node)
      ) {
        setMonthOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setYearOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // 滚动到最新消息
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);
  // 发送消息
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newMessage = {
      id: messages.length + 1,
      text: messageInput,
      isUser: true,
    };
    setMessages([...messages, newMessage]);
    setMessageInput('');
    // 模拟自动回复
    setTimeout(() => {
      const autoReply = {
        id: messages.length + 2,
        text: "Thanks for your message! I'll help you with that.",
        isUser: false,
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1000);
  };
  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  // 更新成员角色
  const handleRoleChange = (memberId: number, newRole: string) => {
    setTeamMembers((members) =>
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );
  };
  // 筛选支付数据
  const filteredPayments = allPayments.filter(
    (payment) =>
      payment.customer.toLowerCase().includes(filterText.toLowerCase()) ||
      payment.email.toLowerCase().includes(filterText.toLowerCase()) ||
      payment.status.toLowerCase().includes(filterText.toLowerCase()),
  );
  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedRows.length === filteredPayments.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredPayments.map((p) => p.id));
    }
  };
  // 选择单行
  const handleSelectRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const years = [
    '2024',
    '2025',
    '2026',
    '2027',
    '2028',
    '2029',
    '2030',
    '2031',
    '2032',
    '2033',
  ];
  return (
    <div className="space-y-6 p-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden gap-2 sm:inline-flex">
            <CalendarDays className="h-4 w-4" />
            01 Jan 2026 - 28 Jan 2026
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      {/* 第一行：三个卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Team Members */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Team Members
            </CardTitle>
            <CardDescription>
              Invite your team members to collaborate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-medium">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <RoleDropdown
                  currentRole={member.role}
                  onRoleChange={(role) => handleRoleChange(member.id, role)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Subscriptions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+4850</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600">+180.1%</span> from last month
            </p>
            <SubscriptionsChart />
          </CardContent>
        </Card>
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$15,231.89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600">+20.1%</span> from last month
            </p>
            <div className="mt-4">
              <RevenueChart />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 第二行：聊天 + Exercise */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 聊天卡片 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium">
                  SD
                </div>
                <div>
                  <p className="text-sm font-medium">Sofia Davis</p>
                  <p className="text-xs text-muted-foreground">m@example.com</p>
                </div>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              ref={messagesContainerRef}
              className="max-h-[200px] space-y-3 overflow-y-auto"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Type your message..."
                className="flex-1"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                size="icon"
                className="shrink-0"
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Exercise Minutes */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Exercise Minutes
                </CardTitle>
                <CardDescription>
                  Your exercise minutes are ahead of where you normally are.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 lg:inline-flex"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ExerciseChart />
          </CardContent>
        </Card>
      </div>
      {/* 第三行：表格 + 支付方式 */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Latest Payments */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Latest Payments
                </CardTitle>
                <CardDescription>
                  See recent payments from your customers here.
                </CardDescription>
              </div>
              <Input
                placeholder="Filter payments..."
                className="hidden w-48 sm:block"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={
                          selectedRows.length === filteredPayments.length &&
                          filteredPayments.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </div>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    data-state={
                      selectedRows.includes(payment.id) ? 'selected' : undefined
                    }
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={selectedRows.includes(payment.id)}
                          onChange={() => handleSelectRow(payment.id)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.customer}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {payment.email}
                    </TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {selectedRows.length} of {allPayments.length} row(s) selected.
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Payment Method */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Payment Method
            </CardTitle>
            <CardDescription>
              Add a new payment method to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 支付方式选择 */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className={`flex h-20 flex-col gap-2 ${paymentMethod === 'card' ? 'border-2 border-primary' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-xs">Card</span>
              </Button>
              <Button
                variant="outline"
                className={`flex h-20 flex-col gap-2 ${paymentMethod === 'paypal' ? 'border-2 border-primary' : ''}`}
                onClick={() => setPaymentMethod('paypal')}
              >
                <PaypalIcon />
                <span className="text-xs">Paypal</span>
              </Button>
              <Button
                variant="outline"
                className={`flex h-20 flex-col gap-2 ${paymentMethod === 'apple' ? 'border-2 border-primary' : ''}`}
                onClick={() => setPaymentMethod('apple')}
              >
                <Apple className="h-6 w-6" />
                <span className="text-xs">Apple</span>
              </Button>
            </div>
            {/* 表单字段 */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name on the card</label>
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Card number</label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative" ref={monthRef}>
                  <label className="text-sm font-medium">Expires</label>
                  <Button
                    variant="outline"
                    className="mt-1.5 w-full justify-between"
                    onClick={() => setMonthOpen(!monthOpen)}
                  >
                    <span className="truncate">{expMonth}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                  {monthOpen && (
                    <div className="absolute top-full left-0 z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                      {months.map((month) => (
                        <button
                          key={month}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-100"
                          onClick={() => {
                            setExpMonth(month);
                            setMonthOpen(false);
                          }}
                        >
                          {month}
                          {month === expMonth && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative" ref={yearRef}>
                  <label className="text-sm font-medium">Year</label>
                  <Button
                    variant="outline"
                    className="mt-1.5 w-full justify-between"
                    onClick={() => setYearOpen(!yearOpen)}
                  >
                    {expYear}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {yearOpen && (
                    <div className="absolute top-full left-0 z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                      {years.map((year) => (
                        <button
                          key={year}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-100"
                          onClick={() => {
                            setExpYear(year);
                            setYearOpen(false);
                          }}
                        >
                          {year}
                          {year === expYear && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">CVC</label>
                  <Input
                    placeholder="CVC"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
            <Button className="w-full">Continue</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
