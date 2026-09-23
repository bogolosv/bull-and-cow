export type TimerHandle = ReturnType<typeof setTimeout>;
export type Timers = {
  schedule: (callback: () => void, delay: number) => TimerHandle;
  cancel: (handle: TimerHandle) => void;
};
export const systemTimers: Timers = {
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: (handle) => clearTimeout(handle),
};
