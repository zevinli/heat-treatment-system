import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Package,
  Truck,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  Users,
  FileText,
  Menu,
  X,
  ChevronRight,
  Settings,
  LayoutDashboard,
  Box,
  TrendingUp,
} from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';
// ==================== 着色器背景组件 ====================
interface ShaderBackgroundProps {
  className?: string;
}
function ShaderBackground({ className }: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;
  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    const float overallSpeed = 0.2;
    const float gridSmoothWidth = 0.015;
    const float axisWidth = 0.05;
    const float majorLineWidth = 0.025;
    const float minorLineWidth = 0.0125;
    const float majorLineFrequency = 5.0;
    const float minorLineFrequency = 1.0;
    const vec4 gridColor = vec4(0.5);
    const float scale = 5.0;
    const vec4 lineColor = vec4(0.25, 0.45, 0.85, 1.0);
    const float minLineWidth = 0.01;
    const float maxLineWidth = 0.2;
    const float lineSpeed = 1.0 * overallSpeed;
    const float lineAmplitude = 1.0;
    const float lineFrequency = 0.2;
    const float warpSpeed = 0.2 * overallSpeed;
    const float warpFrequency = 0.5;
    const float warpAmplitude = 1.0;
    const float offsetFrequency = 0.5;
    const float offsetSpeed = 1.33 * overallSpeed;
    const float minOffsetSpread = 0.6;
    const float maxOffsetSpread = 2.0;
    const int linesPerGroup = 16;
    #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
    #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
    #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
    #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))
    float drawGridLines(float axis) {
      return drawCrispLine(0.0, axisWidth, axis)
        + drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
        + drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
    }
    float drawGrid(vec2 space) {
      return min(1.0, drawGridLines(space.x) + drawGridLines(space.y));
    }
    float random(float t) {
      return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
    }
    float getPlasmaY(float x, float horizontalFade, float offset) {
      return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
    }
    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec4 fragColor;
      vec2 uv = fragCoord.xy / iResolution.xy;
      vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;
      float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
      float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);
      space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
      space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;
      vec4 lines = vec4(0.0);
      vec4 bgColor1 = vec4(0.05, 0.08, 0.18, 1.0);
      vec4 bgColor2 = vec4(0.08, 0.15, 0.28, 1.0);
      for(int l = 0; l < linesPerGroup; l++) {
        float normalizedLineIndex = float(l) / float(linesPerGroup);
        float offsetTime = iTime * offsetSpeed;
        float offsetPosition = float(l) + space.x * offsetFrequency;
        float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
        float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
        float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
        float linePosition = getPlasmaY(space.x, horizontalFade, offset);
        float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);
        float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
        vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
        float circle = drawCircle(circlePosition, 0.01, space) * 4.0;
        line = line + circle;
        lines += line * lineColor * rand;
      }
      fragColor = mix(bgColor1, bgColor2, uv.x);
      fragColor *= verticalFade;
      fragColor.a = 1.0;
      fragColor += lines;
      gl_FragColor = fragColor;
    }
  `;
  const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return null;
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return null;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) return null;
    return shaderProgram;
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        time: gl.getUniformLocation(shaderProgram, 'iTime'),
      },
    };
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    resizeCanvas();
    let animationId: number;
    const startTime = Date.now();
    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000;
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(programInfo.program);
      gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
      gl.uniform1f(programInfo.uniformLocations.time, currentTime);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);
  return (
    <div ref={containerRef} className={cn('absolute inset-0 h-full w-full', className)}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
// ==================== 导航栏 ====================
const navigationItems = [
  { title: '功能特色', href: '#features' },
  { title: '核心模块', href: '#modules' },
  { title: '数据洞察', href: '#analytics' },
  { title: '关于我们', href: '#about' },
];
function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-background/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className={cn('transition-colors', isScrolled ? 'text-foreground' : 'text-white')}>
              <span className="text-lg font-bold">热处理管理</span>
              <span className="ml-2 text-xs opacity-70">智能收发货平台</span>
            </div>
          </Link>
          <nav className="hidden items-center space-x-8 md:flex">
            {navigationItems.map((item) => (
              <UniversalLink
                key={item.title}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-400',
                  isScrolled ? 'text-foreground/80' : 'text-white/90'
                )}
              >
                {item.title}
              </UniversalLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className={cn(
                'hidden md:flex',
                isScrolled ? 'text-foreground hover:text-foreground' : 'text-white hover:text-white hover:bg-white/10'
              )}
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
            <Button
              className="hidden rounded-lg bg-blue-500 hover:bg-blue-600 md:flex"
              onClick={() => navigate('/')}
            >
              进入系统 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className={cn('h-6 w-6', isScrolled ? 'text-foreground' : 'text-white')} />
              ) : (
                <Menu className={cn('h-6 w-6', isScrolled ? 'text-foreground' : 'text-white')} />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t bg-background/95 backdrop-blur-md md:hidden"
        >
          <div className="space-y-1 px-4 py-4">
            {navigationItems.map((item) => (
              <UniversalLink
                key={item.title}
                to={item.href}
                className="block rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.title}
              </UniversalLink>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button className="w-full" onClick={() => navigate('/')}>
                进入系统
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
// ==================== Hero 区域 ====================
function HeroSection() {
  const titleWords = ['智能', '热处理', '收发货', '管理', '系统'];
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen overflow-hidden">
      <ShaderBackground className="z-0" />
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-background" />
      <div className="relative z-20 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pt-20 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/90">系统运行正常 · 已处理 50,000+ 订单</span>
        </motion.div>
        <motion.h1
          initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto max-w-5xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {titleWords.map((text, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              className={cn(
                'mx-1 inline-block',
                index === 1 || index === 2 ? 'bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent' : ''
              )}
            >
              {text}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mx-auto mt-8 max-w-2xl text-lg text-white/80 sm:text-xl"
        >
          专为热处理行业打造的数字化管理平台，实现收发货、库存、对账全流程智能化，
          <span className="text-blue-300">提升效率 300%</span>，降低误差至 <span className="text-blue-300">0.01%</span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            className="h-12 rounded-xl bg-blue-500 px-8 text-base hover:bg-blue-600"
            onClick={() => navigate('/')}
          >
            免费开始使用 <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            className="h-12 rounded-xl border border-white/30 bg-white/10 px-8 text-base text-primary-foreground hover:bg-white/20"
            onClick={() => navigate('/admin')}
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            管理后台
          </Button>
        </motion.div>
        {/* 快速链接 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { icon: Package, label: '来货登记', href: '/inbound' },
            { icon: Truck, label: '快速发货', href: '/outbound' },
            { icon: Box, label: '库存管理', href: '/inventory' },
            { icon: FileText, label: '智能对账', href: '/reconciliation' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + index * 0.1, duration: 0.4 }}
            >
              <Link
                to={item.href}
                className="group flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <item.icon className="h-6 w-6 text-blue-300 transition-transform group-hover:scale-110" />
                <span className="text-sm text-white/80">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
      {/* 滚动提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center text-white/60"
        >
          <span className="mb-2 text-xs">向下滚动</span>
          <div className="h-8 w-5 rounded-full border-2 border-white/40 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
// ==================== 功能特色 ====================
const features = [
  {
    icon: Zap,
    title: '三步快速操作',
    description: '选客户 → 选产品 → 录数据，三步完成收发货，现场作业效率提升 3 倍',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: '数据安全可靠',
    description: '完善的权限管理体系，操作日志全程追溯，确保业务数据安全可控',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: '智能数据分析',
    description: '多维度业务报表，实时库存预警，客户分析、产品热力图一目了然',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: CheckCircle2,
    title: '业财一体化',
    description: '自动核对差异，一键生成对账单，开票回款全流程数字化管理',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: Truck,
    title: '移动端优先',
    description: '专为工厂现场设计，大触控区域，支持蓝牙打印，随时随地处理业务',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Users,
    title: '客户智能管理',
    description: '客户档案自动关联历史记录，个性化配置，提升客户服务质量',
    color: 'from-pink-500 to-rose-500',
  },
];
function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <section id="features" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            为什么选择我们的系统
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            专为热处理行业深度定制，解决传统管理痛点，实现数字化转型
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              ref={ref}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg"
            >
              <div className={cn('mb-4 inline-flex rounded-xl bg-gradient-to-br p-3', feature.color)}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-5" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
// ==================== 核心模块展示 ====================
const modules = [
  {
    title: '来货登记',
    description: '移动端快速收货录入，支持扫码、拍照、批量导入，现场打印流程卡',
    icon: Package,
    href: '/inbound',
    stats: '平均 2 分钟/单',
  },
  {
    title: '快速发货',
    description: '智能批次推荐，灵活分批发货，支持部分发货和关单平账',
    icon: Truck,
    href: '/outbound',
    stats: '效率提升 300%',
  },
  {
    title: '库存管理',
    description: '实时库存状态，超期预警提醒，批次追踪，库位管理',
    icon: Box,
    href: '/inventory',
    stats: '准确率达 99.9%',
  },
  {
    title: '智能对账',
    description: '自动核对差异，一键生成对账单，开票回款全流程跟踪',
    icon: FileText,
    href: '/reconciliation',
    stats: '对账时间缩短 80%',
  },
];
function ModulesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const navigate = useNavigate();
  return (
    <section id="modules" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            四大核心模块
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            覆盖收发货全流程，每个模块都经过深度优化
          </p>
        </motion.div>
        <div className="grid gap-6 lg:grid-cols-2">
          {modules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group cursor-pointer"
              onClick={() => navigate(module.href)}
            >
              <div className="flex items-start gap-6 rounded-2xl border bg-card p-6 transition-all hover:border-blue-500/50 hover:shadow-lg">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <module.icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">{module.title}</h3>
                    <span className="text-xs font-medium text-blue-500">{module.stats}</span>
                  </div>
                  <p className="text-muted-foreground">{module.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                    进入模块 <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
// ==================== 数据统计 ====================
function StatsSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const stats = [
    { value: '50,000+', label: '处理订单', suffix: '' },
    { value: '99.9', label: '数据准确率', suffix: '%' },
    { value: '300', label: '效率提升', suffix: '%' },
    { value: '500+', label: '合作企业', suffix: '' },
  ];
  return (
    <section id="analytics" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-16 text-center text-white sm:px-16"
        >
          {/* 装饰背景 */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-4 text-3xl font-bold sm:text-4xl"
            >
              数据驱动决策
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mx-auto mb-12 max-w-2xl text-lg text-white/80"
            >
              实时监控业务数据，多维度分析报表，助力企业精细化管理
            </motion.p>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold sm:text-5xl">
                    {stat.value}<span className="text-2xl">{stat.suffix}</span>
                  </div>
                  <div className="mt-2 text-sm text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12"
            >
              <Button
                size="lg"
                variant="secondary"
                className="rounded-xl bg-white text-blue-600 hover:bg-white/90"
                onClick={() => navigate('/statistics')}
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                查看数据报表
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
// ==================== CTA / 底部 ====================
function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const navigate = useNavigate();
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            准备好提升您的业务效率了吗？
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            立即开始使用，享受 30 天免费试用，无需信用卡
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-blue-500 px-8 text-base hover:bg-blue-600"
              onClick={() => navigate('/')}
            >
              免费开始使用 <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-8 text-base"
              onClick={() => navigate('/settings/manual')}
            >
              查看使用手册
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>30天免费试用</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>无需信用卡</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>7×24小时支持</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
// ==================== Footer ====================
function Footer() {
  const navigate = useNavigate();
  const footerLinks = {
    产品功能: [
      { label: '来货登记', href: '/inbound' },
      { label: '快速发货', href: '/outbound' },
      { label: '库存管理', href: '/inventory' },
      { label: '智能对账', href: '/reconciliation' },
    ],
    数据洞察: [
      { label: '数据概览', href: '/statistics' },
      { label: '客户分析', href: '/statistics/customer' },
      { label: '库存分析', href: '/statistics/inventory' },
      { label: '产品分析', href: '/statistics/product' },
    ],
    系统管理: [
      { label: '客户管理', href: '/customers' },
      { label: '产品管理', href: '/products' },
      { label: '权限管理', href: '/settings/permissions' },
      { label: '管理后台', href: '/admin' },
    ],
    支持: [
      { label: '使用手册', href: '/settings/manual' },
      { label: '操作日志', href: '/operation-logs' },
      { label: '联系我们', href: '#' },
    ],
  };
  return (
    <footer className="border-t bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">热处理管理</span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              智能收发货管理平台，助力热处理行业数字化转型
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.href)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            2024 热处理管理系统. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              隐私政策
            </button>
            <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              服务条款
            </button>
            <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              联系我们
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
// ==================== 主页面组件 ====================
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ModulesSection />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
