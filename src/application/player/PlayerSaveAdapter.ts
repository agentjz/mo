import type { PlayerSave } from './PlayerKernel.ts';

export interface PlayerSaveSlot {
  slotId: number;
  exists: boolean;
  saveTime?: string;
  sceneName?: string;
  save?: PlayerSave;
}

export interface PlayerSaveAdapter {
  list(): PlayerSaveSlot[];
  write(slotId: number, save: PlayerSave, sceneName: string): void;
  read(slotId: number): PlayerSave | null;
}

interface StoredSlot {
  savedAt: string;
  sceneName: string;
  save: PlayerSave;
}

export class LocalPlayerSaveAdapter implements PlayerSaveAdapter {
  constructor(private readonly keyPrefix: string) {}

  list(): PlayerSaveSlot[] {
    return [1, 2, 3].map(slotId => {
      const stored = this.readRecord(slotId);
      return stored
        ? { slotId, exists: true, saveTime: stored.savedAt, sceneName: stored.sceneName, save: stored.save }
        : { slotId, exists: false };
    });
  }

  write(slotId: number, save: PlayerSave, sceneName: string): void {
    this.assertSlot(slotId);
    const value: StoredSlot = { savedAt: new Date().toISOString(), sceneName, save };
    localStorage.setItem(`${this.keyPrefix}${slotId}`, JSON.stringify(value));
  }

  read(slotId: number): PlayerSave | null {
    return this.readRecord(slotId)?.save ?? null;
  }

  private readRecord(slotId: number): StoredSlot | null {
    this.assertSlot(slotId);
    const value = localStorage.getItem(`${this.keyPrefix}${slotId}`);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as StoredSlot;
      return parsed?.save?.version === 1 ? parsed : null;
    } catch {
      return null;
    }
  }

  private assertSlot(slotId: number): void {
    if (![1, 2, 3].includes(slotId)) throw new Error(`无效存档槽位: ${slotId}`);
  }
}

export class MemoryPlayerSaveAdapter implements PlayerSaveAdapter {
  private readonly slots = new Map<number, StoredSlot>();

  list(): PlayerSaveSlot[] {
    return [1, 2, 3].map(slotId => {
      const stored = this.slots.get(slotId);
      return stored ? { slotId, exists: true, saveTime: stored.savedAt, sceneName: stored.sceneName, save: stored.save } : { slotId, exists: false };
    });
  }

  write(slotId: number, save: PlayerSave, sceneName: string): void {
    this.slots.set(slotId, { savedAt: new Date().toISOString(), sceneName, save: structuredClone(save) });
  }

  read(slotId: number): PlayerSave | null {
    const save = this.slots.get(slotId)?.save;
    return save ? structuredClone(save) : null;
  }
}
