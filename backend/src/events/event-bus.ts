import { EventEmitter } from 'node:events';

class AppEventBus extends EventEmitter {
  emitEvent<T>(event: string, payload: T) {
    this.emit(event, payload);
  }
}
export const eventBus = new AppEventBus();
