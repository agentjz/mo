import type { StoryDocument } from '../../domain/story/document.ts';
import type { StoryEditorState } from '../../domain/story/editorState.ts';

export interface StoredStory {
  id: string;
  document: StoryDocument;
  editorState: StoryEditorState;
  revision: number;
  updatedAt: string;
}

export interface AssetRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  size: number;
  hash: string;
  fileName: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface WorkspaceSnapshot {
  stories: StoredStory[];
  assets: AssetRecord[];
  settings: SettingRecord[];
}

export interface StorageEstimate {
  usage: number;
  quota: number;
  available: number;
}

export class RevisionConflictError extends Error {
  constructor(
    public readonly storyId: string,
    public readonly expectedRevision: number,
    public readonly actualRevision: number,
  ) {
    super(`作品 ${storyId} 已在其他标签页更新`);
    this.name = 'RevisionConflictError';
  }
}

export class StorageQuotaError extends Error {
  constructor(message = '浏览器存储空间不足') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}
