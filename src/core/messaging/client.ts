import { browser } from '#imports';
import {
  STREAM_PORT,
  type Request,
  type Response,
  type StreamEvent,
  type StreamRequest,
} from './protocol';

/** Typed one-shot call into the background script. */
export async function send<R extends Request>(request: R): Promise<Response> {
  return (await browser.runtime.sendMessage(request)) as Response;
}

export interface StreamHandle {
  cancel(): void;
}

/**
 * Opens a streaming generation. `onEvent` receives deltas as they arrive.
 * Always keep the returned handle: dropping a stream without cancelling it
 * keeps the service worker alive and keeps burning credits.
 */
export function stream(
  request: StreamRequest,
  onEvent: (event: StreamEvent) => void,
): StreamHandle {
  const port = browser.runtime.connect({ name: STREAM_PORT });
  port.onMessage.addListener((message) => onEvent(message as StreamEvent));
  port.onDisconnect.addListener(() => onEvent({ kind: 'done' }));
  port.postMessage(request);
  return {
    cancel() {
      try {
        port.disconnect();
      } catch {
        /* already closed */
      }
    },
  };
}
