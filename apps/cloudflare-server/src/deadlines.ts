import type {
  Timers,
  TimerHandle,
} from "../../websocket-server/src/time/timers";

// Callbacks are rebuilt from persisted deadlines after every cold start.
// Cloudflare alarms, not JS timers, wake the object from hibernation.
export class Deadlines implements Timers {
  private sequence = 0;
  private jobs = new Map<TimerHandle, { at: number; run: () => void }>();
  schedule = (run: () => void, delay: number) => {
    const id = ++this.sequence as unknown as TimerHandle;
    this.jobs.set(id, { at: Date.now() + Math.max(0, delay), run });
    return id;
  };
  cancel = (id: TimerHandle) => {
    this.jobs.delete(id);
  };
  next() {
    return this.jobs.size
      ? Math.min(...[...this.jobs.values()].map((job) => job.at))
      : null;
  }
  drain() {
    for (;;) {
      const due = [...this.jobs]
        .filter(([, job]) => job.at <= Date.now())
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) return;
      this.jobs.delete(due[0]);
      due[1].run();
    }
  }
}
