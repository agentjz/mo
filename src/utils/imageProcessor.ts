/**
 * 图片处理工具
 * 职责：图片压缩、格式转换、验证
 */

export interface ProcessedImage {
  imageData: string;     // base64 encoded
  fileName: string;      // 原始文件名
  fileSize: number;      // 压缩后大小（字节）
  originalFormat: string; // 原始格式
  width: number;         // 图片宽度
  height: number;        // 图片高度
}

export interface ImageProcessOptions {
  maxSizeBytes: number;  // 最大文件大小（字节）
  quality: number;       // 压缩质量 0-1
  maxWidth?: number;     // 最大宽度
  maxHeight?: number;    // 最大高度
}

const DEFAULT_OPTIONS: ImageProcessOptions = {
  maxSizeBytes: Infinity, // 不限制大小
  quality: 0.6,
  maxWidth: 800,
  maxHeight: 600
};

/**
 * 验证文件类型
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的文件格式，请使用 JPG、PNG、WebP 或 GIF 格式'
    };
  }

  return { valid: true };
}

/**
 * 获取图片原始格式
 */
function getOriginalFormat(file: File): string {
  const type = file.type.toLowerCase();
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  return 'unknown';
}

/**
 * 处理图片文件
 */
export async function processImageFile(
  file: File,
  options: Partial<ImageProcessOptions> = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // 验证文件
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const originalFormat = getOriginalFormat(file);

  // GIF文件特殊处理：保持原格式
  if (file.type === 'image/gif') {
    return processGifFile(file, originalFormat);
  }

  // 其他格式转换为WebP
  return processStaticImage(file, originalFormat, opts);
}

/**
 * 处理GIF文件（保持原格式）
 */
async function processGifFile(file: File, originalFormat: string): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('读取文件失败'));
        return;
      }

      // GIF保持原格式，不压缩
      const img = new Image();
      img.onload = () => {
        resolve({
          imageData: result,
          fileName: file.name,
          fileSize: file.size,
          originalFormat,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => reject(new Error('图片格式错误'));
      img.src = result;
    };
    
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 处理静态图片（转换为WebP）
 */
async function processStaticImage(
  file: File,
  originalFormat: string,
  options: ImageProcessOptions
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas不支持'));
          return;
        }

        // 计算压缩后的尺寸
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          options.maxWidth,
          options.maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve({
                imageData: result,
                fileName: file.name,
                fileSize: blob.size,
                originalFormat,
                width,
                height
              });
            };
            reader.onerror = () => reject(new Error('读取压缩后文件失败'));
            reader.readAsDataURL(blob);
          },
          'image/webp',
          options.quality
        );
      } catch (error) {
        reject(new Error('图片处理失败: ' + (error as Error).message));
      }
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    
    // 加载图片
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 计算压缩后的尺寸
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  if (maxWidth && width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
