import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onResult,
  onError,
  disabled = false,
  className,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      onError?.('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setInterimText('');
        logger.debug('语音识别已开始');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
        }

        if (finalTranscript) {
          setIsProcessing(true);
          recognition.stop();
          onResult(finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logger.error('语音识别错误:', event.error);
        let errorMessage = '语音识别失败';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '未检测到语音，请重试';
            break;
          case 'audio-capture':
            errorMessage = '无法访问麦克风，请检查设备';
            break;
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问';
            break;
          case 'network':
            errorMessage = '网络错误，请检查网络连接';
            break;
          case 'aborted':
            errorMessage = '识别已取消';
            break;
          default:
            errorMessage = `识别错误: ${event.error}`;
        }
        
        onError?.(errorMessage);
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
        setInterimText('');
        logger.debug('语音识别已结束');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      logger.error('启动语音识别失败:', error);
      onError?.('启动语音识别失败，请重试');
    }
  }, [onResult, onError]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        disabled={disabled || isProcessing}
        onClick={handleClick}
        className={cn(
          "relative transition-all duration-300",
          isRecording && "animate-pulse ring-2 ring-destructive ring-offset-2"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* 录音中波纹动画 */}
      {isRecording && (
        <>
          <span className="absolute -inset-1 rounded-full animate-ping bg-destructive/20" />
          <span className="absolute -inset-2 rounded-full animate-ping bg-destructive/10 animation-delay-200" />
        </>
      )}

      {/* 实时转写提示 */}
      {isRecording && interimText && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap">
          <div className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm shadow-md border">
            {interimText}
            <span className="animate-pulse">|</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;
