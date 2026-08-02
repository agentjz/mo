interface BrowserLock {
  readonly name: string;
}

interface BrowserLockManager {
  request<T>(
    name: string,
    options: { mode: 'exclusive'; ifAvailable: true },
    callback: (lock: BrowserLock | null) => Promise<T> | T,
  ): Promise<T>;
}

export interface StoryWriteLockHandle {
  readonly acquired: boolean;
  release(): void;
}

export async function acquireStoryWriteLock(storyId: string): Promise<StoryWriteLockHandle> {
  const locks = (navigator as Navigator & { locks?: BrowserLockManager }).locks;
  if (!locks) return { acquired: true, release() {} };

  let releaseHold: () => void = () => {};
  const hold = new Promise<void>(resolve => { releaseHold = resolve; });
  let reportAcquisition: (acquired: boolean) => void = () => {};
  const acquisition = new Promise<boolean>(resolve => { reportAcquisition = resolve; });

  void locks.request(`mo:story:${storyId}`, { mode: 'exclusive', ifAvailable: true }, async lock => {
    reportAcquisition(Boolean(lock));
    if (lock) await hold;
  });

  const acquired = await acquisition;
  let released = false;
  return {
    acquired,
    release() {
      if (released) return;
      released = true;
      releaseHold();
    },
  };
}
