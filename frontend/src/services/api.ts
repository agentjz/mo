/**
 * API客户端
 * 职责：封装所有HTTP请求
 * 
 * 设计理念：
 * - 以作者为中心的API设计
 * - 草稿是创作核心，发布是草稿副本
 * - 每个作者独立管理自己的作品
 */

import config from '../config/index.ts'
import type { Story } from '../types/index.ts'

class APIService {
  private baseURL: string

  constructor() {
    this.baseURL = config.api.baseURL
  }

  /**
   * 获取认证token
   */
  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  /**
   * 通用请求方法（自动带上JWT token）
   */
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    const headers = new Headers(options.headers)

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    // 如果有token，添加Authorization头
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '请求失败')
    }

    return response.json()
  }

  /**
   * 作者认证（登录/注册）
   */
  login = {
    auth: (username: string, password: string) =>
      this.request<{ success: boolean; username: string; token: string; error?: string }>(
        '/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        }
      ),
  }

  /**
   * 草稿操作（需要认证，自动带token）
   */
  drafts = {
    getAll: () =>
      this.request<Story[]>('/drafts'),

    getById: (id: string) =>
      this.request<Story>(`/draft/${id}`),

    save: (story: Story) =>
      this.request<{ success: boolean }>('/draft', {
        method: 'POST',
        body: JSON.stringify({ story }),
      }),

    delete: (storyId: string) =>
      this.request<{ success: boolean }>('/story', {
        method: 'DELETE',
        body: JSON.stringify({ storyId }),
      }),
  }

  /**
   * 发布操作（需要认证）
   */
  publish = {
    publish: (storyId: string) =>
      this.request<{ success: boolean; shareUrl?: string }>('/publish', {
        method: 'POST',
        body: JSON.stringify({ storyId }),
      }),

    getAllPublished: () =>
      this.request<Story[]>('/published'),

    getPublished: (username: string, gameId: string) =>
      this.request<Story>(`/published/${username}/${gameId}`),
  }

  /**
   * 账户操作（需要认证）
   */
  account = {
    deleteAccount: () =>
      this.request<{ success: boolean }>('/account', {
        method: 'DELETE',
      }),
  }

  /**
   * 邮箱操作
   */
  email = {
    // 获取当前用户绑定的邮箱（需要认证）
    getMyEmail: () =>
      this.request<{ email: string | null }>('/my-email'),

    // 发送验证码到邮箱（绑定邮箱用，需要认证）
    sendVerificationCode: (email: string) =>
      this.request<{ success: boolean; message: string }>('/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    // 绑定邮箱（需要认证）
    bindEmail: (email: string, code: string) =>
      this.request<{ success: boolean; message: string }>('/bind-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),

    // 解绑邮箱（需要认证）
    unbindEmail: () =>
      this.request<{ success: boolean; message: string }>('/unbind-email', {
        method: 'DELETE',
      }),

    // 邮箱登录：发送验证码（无需认证）
    sendLoginCode: (email: string) =>
      this.request<{ success: boolean; message: string }>('/email-login/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    // 邮箱登录：验证验证码（无需认证）
    verifyLoginCode: (email: string, code: string) =>
      this.request<{ success: boolean; username: string; token: string }>('/email-login/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),
  }

  /**
   * 图片操作（需要认证）
   */
  images = {
    // 上传图片（自动去重）
    upload: (base64Data: string, fileName: string, width: number, height: number, originalFormat: string) =>
      this.request<{
        imagePath: string;
        fileName: string;
        fileSize: number;
        hash: string;
        width: number;
        height: number;
        originalFormat: string;
      }>('/upload-image', {
        method: 'POST',
        body: JSON.stringify({ base64Data, fileName, width, height, originalFormat }),
      }),
  }
}

const api = new APIService()
export default api
