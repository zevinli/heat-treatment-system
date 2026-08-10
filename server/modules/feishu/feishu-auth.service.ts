import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  FEISHU_AUTH_URL,
  SYNC_CONFIG,
} from './constants';

interface TokenCache {
  token: string;
  expiresAt: number; // 毫秒时间戳
}

@Injectable()
export class FeishuAuthService {
  private readonly logger = new Logger(FeishuAuthService.name);
  private tokenCache: TokenCache | null = null;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: SYNC_CONFIG.REQUEST_TIMEOUT_MS,
    });
  }

  /**
   * 获取 tenant_access_token（含缓存）
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.tokenCache!.token;
    }
    return this.refreshToken();
  }

  /**
   * 检查 Token 是否有效（提前 60 秒刷新）
   */
  private isTokenValid(): boolean {
    if (!this.tokenCache) return false;
    const bufferMs = SYNC_CONFIG.TOKEN_REFRESH_BUFFER_MS;
    return Date.now() < this.tokenCache.expiresAt - bufferMs;
  }

  /**
   * 从飞书 API 刷新 Token
   */
  private async refreshToken(): Promise<string> {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('缺少飞书应用配置：FEISHU_APP_ID 或 FEISHU_APP_SECRET 未设置');
    }

    try {
      const resp = await this.axiosInstance.post(FEISHU_AUTH_URL, {
        app_id: appId,
        app_secret: appSecret,
      });

      const data = resp.data;
      if (data.code !== 0) {
        throw new Error(`飞书 Token 获取失败：${data.msg} (code: ${data.code})`);
      }

      this.tokenCache = {
        token: data.tenant_access_token,
        expiresAt: Date.now() + data.expire * 1000,
      };

      this.logger.log('飞书 tenant_access_token 刷新成功');
      return this.tokenCache.token;
    } catch (error: any) {
      this.logger.error(`飞书 Token 刷新失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 获取已配置 Authorization 头的 axios 实例（调用飞书 API 时使用）
   */
  async getAuthorizedClient(): Promise<AxiosInstance> {
    const token = await this.getAccessToken();
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return this.axiosInstance;
  }

  /**
   * 检查飞书配置是否完整
   */
  isConfigured(): boolean {
    return Boolean(
      process.env.FEISHU_APP_ID &&
      process.env.FEISHU_APP_SECRET,
    );
  }
}
