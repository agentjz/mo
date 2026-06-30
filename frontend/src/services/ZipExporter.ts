/**
 * ZIP导出/导入服务
 * 职责：将Story及其图片资源打包为ZIP，或从ZIP导入
 * 
 * 流程：
 * 导出 - 创建ZIP包含story.json和pictures文件夹
 * 导入 - 解压ZIP，上传图片到用户目录，保存Story
 */

import JSZip from 'jszip';
import type { Story } from '../types/index';
import config from '../config/index';
import api from './api';

export class ZipExporter {
  /**
   * 收集Story中所有引用的图片路径
   */
  private collectImagePaths(story: Story): Set<string> {
    const imagePaths = new Set<string>();
    
    for (const node of story.nodes) {
      const nodeData = node.data;
      
      // 背景图
      if (nodeData.image?.imagePath) {
        imagePaths.add(nodeData.image.imagePath);
      }
      
      // 角色立绘
      if (nodeData.characterImages) {
        if (nodeData.characterImages.left?.imagePath) {
          imagePaths.add(nodeData.characterImages.left.imagePath);
        }
        if (nodeData.characterImages.center?.imagePath) {
          imagePaths.add(nodeData.characterImages.center.imagePath);
        }
        if (nodeData.characterImages.right?.imagePath) {
          imagePaths.add(nodeData.characterImages.right.imagePath);
        }
      }
    }
    
    return imagePaths;
  }
  
  /**
   * 下载图片文件为Blob
   */
  private async downloadImageAsBlob(imagePath: string, username: string): Promise<Blob | null> {
    try {
      const baseUrl = config.api.baseURL.replace('/api', '');
      const imageUrl = `${baseUrl}/userdata/${username}/${imagePath}`;
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.warn(`图片下载失败: ${imagePath}`);
        return null;
      }
      
      return await response.blob();
    } catch (error) {
      console.error(`下载图片失败: ${imagePath}`, error);
      return null;
    }
  }
  
  /**
   * 导出Story为ZIP文件
   */
  async exportToZip(story: Story): Promise<void> {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername) {
      throw new Error('请先登录');
    }
    
    const zip = new JSZip();
    
    // 添加story.json
    const storyJson = JSON.stringify(story, null, 2);
    zip.file('story.json', storyJson);
    
    // 收集所有图片路径
    const imagePaths = this.collectImagePaths(story);
    
    // 下载并添加所有图片到ZIP
    const picturesFolder = zip.folder('pictures');
    if (!picturesFolder) {
      throw new Error('创建pictures文件夹失败');
    }
    
    for (const imagePath of imagePaths) {
      // imagePath格式: "pictures/abc123.webp"
      const filename = imagePath.replace('pictures/', '');
      const blob = await this.downloadImageAsBlob(imagePath, currentUsername);
      
      if (blob) {
        picturesFolder.file(filename, blob);
      }
    }
    
    // 生成ZIP并触发下载
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.meta.title}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * 从ZIP文件导入Story
   */
  async importFromZip(file: File): Promise<Story> {
    const zip = await JSZip.loadAsync(file);
    
    // 读取story.json
    const storyFile = zip.file('story.json');
    if (!storyFile) {
      throw new Error('ZIP中缺少story.json文件');
    }
    
    const storyContent = await storyFile.async('text');
    const story: Story = JSON.parse(storyContent);
    
    // 获取pictures文件夹
    const picturesFolder = zip.folder('pictures');
    if (!picturesFolder) {
      // 没有图片，直接返回story
      return story;
    }
    
    // 上传所有图片到当前用户的userdata
    const imageFiles = Object.keys(zip.files).filter(path => 
      path.startsWith('pictures/') && !path.endsWith('/') && path !== 'pictures/'
    );
    
    // 创建图片路径映射表（旧路径 -> 新路径）
    const imagePathMap = new Map<string, string>();
    
    for (const filePath of imageFiles) {
      const file = zip.file(filePath);
      if (!file) continue;
      
      const filename = filePath.replace('pictures/', '');
      const oldPath = `pictures/${filename}`;
      
      try {
        // 从文件名提取格式
        const ext = filename.split('.').pop()?.toLowerCase() || 'webp';
        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        
        // 读取图片为arraybuffer，然后创建带正确MIME类型的Blob
        const arrayBuffer = await file.async('arraybuffer');
        const blob = new Blob([arrayBuffer], { type: mimeType });
        
        // 获取图片尺寸
        const imageInfo = await this.getImageInfo(blob, filename);
        
        // 转为base64（data URL格式）
        const base64DataUrl = await this.blobToBase64(blob);
        
        // 上传图片到服务器
        const result = await api.images.upload(
          base64DataUrl,
          filename,
          imageInfo.width,
          imageInfo.height,
          imageInfo.format
        );
        
        // 记录新路径
        imagePathMap.set(oldPath, result.imagePath);
      } catch (error) {
        console.error(`上传图片失败: ${filename}`, error);
        // 继续处理其他图片，不中断整个导入过程
      }
    }
    
    // 更新Story中所有图片路径
    this.updateImagePaths(story, imagePathMap);
    
    return story;
  }
  
  /**
   * 更新Story中所有图片路径
   */
  private updateImagePaths(story: Story, pathMap: Map<string, string>): void {
    for (const node of story.nodes) {
      const nodeData = node.data;
      
      // 背景图
      if (nodeData.image?.imagePath) {
        const newPath = pathMap.get(nodeData.image.imagePath);
        if (newPath) {
          nodeData.image.imagePath = newPath;
        }
      }
      
      // 角色立绘
      if (nodeData.characterImages) {
        if (nodeData.characterImages.left?.imagePath) {
          const newPath = pathMap.get(nodeData.characterImages.left.imagePath);
          if (newPath) {
            nodeData.characterImages.left.imagePath = newPath;
          }
        }
        if (nodeData.characterImages.center?.imagePath) {
          const newPath = pathMap.get(nodeData.characterImages.center.imagePath);
          if (newPath) {
            nodeData.characterImages.center.imagePath = newPath;
          }
        }
        if (nodeData.characterImages.right?.imagePath) {
          const newPath = pathMap.get(nodeData.characterImages.right.imagePath);
          if (newPath) {
            nodeData.characterImages.right.imagePath = newPath;
          }
        }
      }
    }
  }
  
  /**
   * Blob转base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * 获取图片信息（宽高和格式）
   */
  private getImageInfo(blob: Blob, filename: string): Promise<{ width: number; height: number; format: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // 从mime类型获取格式，如果为空则从文件名提取
        let format = blob.type ? blob.type.replace('image/', '') : '';
        if (!format) {
          // 从文件名提取扩展名
          const ext = filename.split('.').pop()?.toLowerCase();
          format = ext || 'webp';
        }
        
        resolve({
          width: img.width,
          height: img.height,
          format: format
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法加载图片'));
      };
      
      img.src = url;
    });
  }
}

export const zipExporter = new ZipExporter();

