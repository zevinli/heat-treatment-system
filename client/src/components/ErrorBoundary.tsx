import React, { Component, ReactNode } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 过滤掉 SDK 内部的 JSONP 错误
    if (error.message?.includes('_jp.') || error.message?.includes('jsonp')) {
      logger.warn('SDK JSONP error caught:', error.message);
      // 不显示错误 UI，继续渲染子组件
      this.setState({ hasError: false });
      return;
    }
    logger.error('Error caught by boundary:', { error: error, errorInfo: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">页面出错了</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                页面加载过程中发生错误，请刷新页面重试
              </p>
              {this.state.error && (
                <div className="text-xs text-red-500 bg-red-50 p-3 rounded break-words">
                  {this.state.error.message}
                </div>
              )}
              <Button 
                onClick={this.handleRetry} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新页面
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
