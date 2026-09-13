import { describe, expect, it } from 'vitest';
import { parseSseStream } from '../src/core/ai/sse';

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const out: string[] = [];
  for await (const event of parseSseStream(stream)) out.push(event);
  return out;
}

describe('parseSseStream', () => {
  it('yields one payload per event', async () => {
    const events = await collect(streamOf('data: {"a":1}\n\n', 'data: {"a":2}\n\n'));
    expect(events).toEqual(['{"a":1}', '{"a":2}']);
  });

  it('reassembles events split across chunk boundaries', async () => {
    const events = await collect(streamOf('data: {"a"', ':1}\n', '\ndata: {"b":2}\n\n'));
    expect(events).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('handles CRLF line endings', async () => {
    expect(await collect(streamOf('data: x\r\n\r\n'))).toEqual(['x']);
  });

  it('ignores comment and empty frames', async () => {
    expect(await collect(streamOf(': keep-alive\n\n', 'data: x\n\n'))).toEqual(['x']);
  });

  it('passes [DONE] through to the caller', async () => {
    expect(await collect(streamOf('data: [DONE]\n\n'))).toEqual(['[DONE]']);
  });
});
