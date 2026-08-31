import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { BusinessException } from '../interfaces/exception.interface';
import { HTTP_STATUS_TO_RESPONSE_CODE_MAP, ResponseCode } from '../constants/api_response_code';
import { ApiErrorResponse } from '../interfaces/api_response.interface';

// 全局异常过滤器，用于捕获所有未处理的异常
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
     
    // 如果响应头已发送，则不处理
    if (response.headersSent) {
      return;
    }

    let errorResponse: Omit<ApiErrorResponse, 'httpStatus'>;
    let httpStatus: HttpStatus;

    if (exception instanceof BusinessException) {
      // 业务异常
      httpStatus = exception.httpStatus;
      errorResponse = {
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          fieldErrors: exception.fieldErrors,
          timestamp: Date.now(),
        },
      };
    } else if (exception instanceof HttpException) {
      // HTTP异常
      httpStatus = exception.getStatus() as HttpStatus;
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        error: {
          code: HTTP_STATUS_TO_RESPONSE_CODE_MAP[httpStatus] || ResponseCode.BAD_REQUEST,
          message: typeof exceptionResponse === 'string' ? exceptionResponse : exception.message,
          details: typeof exceptionResponse === 'object' ? JSON.stringify(exceptionResponse) : undefined,
          timestamp: Date.now(),
        },
      };
    } else if (typeof exception === 'object' && exception !== null
      && Number.isInteger(Number((exception as { status?: unknown; statusCode?: unknown }).status
        ?? (exception as { statusCode?: unknown }).statusCode))
      && Number((exception as { status?: unknown; statusCode?: unknown }).status
        ?? (exception as { statusCode?: unknown }).statusCode) >= 400
      && Number((exception as { status?: unknown; statusCode?: unknown }).status
        ?? (exception as { statusCode?: unknown }).statusCode) < 500) {
      httpStatus = Number((exception as { status?: unknown; statusCode?: unknown }).status
        ?? (exception as { statusCode?: unknown }).statusCode) as HttpStatus;
      errorResponse = {
        error: {
          code: HTTP_STATUS_TO_RESPONSE_CODE_MAP[httpStatus] || ResponseCode.BAD_REQUEST,
          message: httpStatus === HttpStatus.PAYLOAD_TOO_LARGE
            ? '上传内容过大，请减少图片数量或压缩图片后重试'
            : '请求内容无效',
          timestamp: Date.now(),
        },
      };
    } else {
      // 未知异常
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      // 生产环境绝不能把堆栈、数据库错误或底层 cause 返回给浏览器；
      // 这些信息可能包含 SQL、表名、文件路径以及凭据片段。
      const diagnostics = process.env.NODE_ENV === 'production'
        ? {}
        : {
            stack: exception instanceof Error ? exception.stack : undefined,
            cause: exception instanceof Error && exception.cause !== undefined
              ? String(exception.cause)
              : undefined,
          };
      errorResponse = {
        error: {
          code: ResponseCode.INTERNAL_ERROR,
          message: '服务器内部错误',
          ...diagnostics,
          timestamp: Date.now(),
        },
      };
      this.logger.error('Unhandled request exception', exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(httpStatus).json(errorResponse);
  }
}
