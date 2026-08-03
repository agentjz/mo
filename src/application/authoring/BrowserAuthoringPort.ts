import {
  AuthoringSession,
  type AuthoringBatch,
  type AuthoringCommand,
  type AuthoringDiffEntry,
  type AuthoringResult,
  type AuthoringSnapshot,
} from './AuthoringSession.ts';

export const BROWSER_AUTHORING_API_VERSION = 1 as const;

export interface AuthoringSchemaDescription {
  version: typeof BROWSER_AUTHORING_API_VERSION;
  commandTypes: AuthoringCommand['type'][];
  reviewRequired: true;
}

export interface AuthoringReview {
  id: string;
  committed: false;
  expectedRevision: number;
  commands: AuthoringCommand[];
  diff: AuthoringDiffEntry[];
  createdAt: string;
}

export interface ReviewSelection {
  commandIndexes?: number[];
}

const COMMAND_TYPES: AuthoringCommand['type'][] = [
  'update-meta',
  'add-scene',
  'update-scene',
  'delete-scene',
  'add-choice',
  'update-choice',
  'delete-choice',
  'set-choice-target',
  'set-entry-scene',
  'set-variables',
  'set-rules',
  'set-presentation',
  'replace-document',
  'replace-editor-state',
  'move-scene',
  'set-viewport',
  'select-editor',
];

function cloneReview(review: AuthoringReview): AuthoringReview {
  return structuredClone(review);
}

export class BrowserAuthoringPort {
  private readonly reviews = new Map<string, AuthoringReview>();

  constructor(private readonly session: AuthoringSession) {}

  query(): AuthoringSnapshot {
    return this.session.query();
  }

  schema(): AuthoringSchemaDescription {
    return {
      version: BROWSER_AUTHORING_API_VERSION,
      commandTypes: [...COMMAND_TYPES],
      reviewRequired: true,
    };
  }

  submit(batch: AuthoringBatch): AuthoringReview {
    const preview = this.session.submit({ ...structuredClone(batch), dryRun: true });
    const review: AuthoringReview = {
      id: `review_${crypto.randomUUID()}`,
      committed: false,
      expectedRevision: batch.expectedRevision,
      commands: structuredClone(batch.commands),
      diff: preview.diff,
      createdAt: new Date().toISOString(),
    };
    this.reviews.set(review.id, review);
    return cloneReview(review);
  }

  listReviews(): AuthoringReview[] {
    return [...this.reviews.values()].map(cloneReview);
  }

  accept(reviewId: string, selection: ReviewSelection = {}): AuthoringResult {
    const review = this.requireReview(reviewId);
    const current = this.session.query();
    if (current.revision !== review.expectedRevision) {
      this.reviews.delete(reviewId);
      throw new Error(`审阅已过期：expected revision ${review.expectedRevision}，当前 revision ${current.revision}`);
    }

    const indexes = selection.commandIndexes ?? review.commands.map((_, index) => index);
    if (new Set(indexes).size !== indexes.length) throw new Error('接受列表包含重复命令');
    if (indexes.some(index => !Number.isInteger(index) || index < 0 || index >= review.commands.length)) {
      throw new Error('接受列表包含无效命令索引');
    }
    const commands = indexes.map(index => review.commands[index]);
    const result = this.session.submit({ expectedRevision: review.expectedRevision, commands });
    this.reviews.delete(reviewId);
    return result;
  }

  reject(reviewId: string): void {
    this.requireReview(reviewId);
    this.reviews.delete(reviewId);
  }

  undo(): AuthoringResult {
    return this.session.undo();
  }

  redo(): AuthoringResult {
    return this.session.redo();
  }

  private requireReview(reviewId: string): AuthoringReview {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`审阅不存在: ${reviewId}`);
    return review;
  }
}
