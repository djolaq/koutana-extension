/**
 * Minimal Server-Sent Events reader.
 *
 * Deliberately dependency-free and framework-free so it can be unit tested in
 * isolation (see tests/sse.test.ts). It yields the raw `data:` payload of each
 * event; JSON parsing is the caller's job.
 */
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Events are separated by a blank line. Normalise CRLF first.
      buffer = buffer.replace(/\r\n/g, '\n');
      let separator: number;
      while ((separator = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        const data = rawEvent
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (data) yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
