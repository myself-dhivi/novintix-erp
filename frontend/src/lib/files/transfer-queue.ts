const MAX_CONCURRENT = 3;
let active = 0;
const queue: Array<{ id: string; run: () => Promise<void> }> = [];
function next() {
  while (active < MAX_CONCURRENT && queue.length) {
    const item = queue.shift()!;
    active++;
    void item.run().finally(() => {
      active--;
      next();
    });
  }
}
export function enqueueTransfer(id: string, run: () => Promise<void>) {
  queue.push({ id, run });
  next();
}
export function removeQueuedTransfer(id: string) {
  const index = queue.findIndex((item) => item.id === id);
  if (index >= 0) queue.splice(index, 1);
}
