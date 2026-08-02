/**
 * 统一通知系统
 * 职责：替代alert()，提供更好的用户体验
 */

import config from '../config/index.ts';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

class NotificationService {
  private container: HTMLElement | null;
  private config: typeof config.notification;

  constructor() {
    this.container = null;
    this.config = config.notification;
    this.init();
  }

  init(): void {
    if (typeof document === 'undefined') return;
    
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: ${this.config.position.top};
      right: ${this.config.position.right};
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * 显示通知
   * @param message - 消息内容
   * @param type - 类型
   * @param duration - 持续时间（毫秒）
   */
  show(message: string, type: NotificationType = 'info', duration: number = this.config.defaultDuration): void {
    if (!this.container) return;

    const notification = document.createElement('div');
    notification.style.cssText = `
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      font-weight: 500;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
      ${this.getTypeStyle(type)}
    `;
    notification.textContent = message;

    this.container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (this.container && notification.parentNode === this.container) {
          this.container.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  getTypeStyle(type: NotificationType): string {
    return this.config.styles[type] || this.config.styles.info;
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  /**
   * 确认对话框
   * @param message - 消息
   * @returns 用户是否确认
   */
  async confirm(message: string): Promise<boolean> {
    // 这里简化处理，仍使用原生confirm
    // 在真实项目中可以创建自定义的Modal组件
    return window.confirm(message);
  }

  /**
   * 显示分享链接通知（常驻，点击复制）
   * @param title - 游戏标题
   * @param author - 作者
   * @param shareUrl - 分享链接
   */
  showShareLink(_title: string, _author: string, shareUrl: string): void {
    if (!this.container) return;

    const notification = document.createElement('div');
    notification.style.cssText = `
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
      ${this.config.styles.success}
      cursor: pointer;
      transition: all 0.2s;
    `;

    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">发布成功</div>
      <div style="font-size: 12px; word-break: break-all; background: rgba(0,0,0,0.05); padding: 6px 8px; border-radius: 4px; margin-bottom: 8px;">${shareUrl}</div>
      <div style="font-size: 12px; text-align: center; opacity: 0.8;">点击复制分享链接</div>
    `;


    // 点击复制
    notification.addEventListener('click', () => {
      // 只复制链接
      const input = document.createElement('input');
      input.value = shareUrl;
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(input);
        
        // 显示复制成功，然后移除
        notification.innerHTML = `
          <div style="font-weight: 600; text-align: center;">已复制分享链接</div>
        `;
        notification.style.cursor = 'default';
        
        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-out';
          setTimeout(() => {
            if (this.container && notification.parentNode === this.container) {
              this.container.removeChild(notification);
            }
          }, 300);
        }, 1500);
      } catch (err) {
        document.body.removeChild(input);
        this.error('复制失败，请手动复制');
      }
    });

    this.container.appendChild(notification);
  }
}

// 添加CSS动画
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export default new NotificationService();

