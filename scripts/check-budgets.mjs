#!/usr/bin/env node
/**
 * Bundle budgets.
 *
 * The content script runs on every page the user visits, so its weight is a
 * user-experience decision, not an implementation detail. When this fails, the
 * fix is to move work out of the content script — not to raise the number.
 * Raising a budget requires an ADR.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2] ?? 'chrome';
const OUT = new URL(`../.output/${target}-mv3/`, import.meta.url).pathname;

const BUDGETS = [
  { label: 'content script', path: 'content-scripts/content.js', maxKb: 300 },
  { label: 'background', path: 'background.js', maxKb: 80 },
];

let failed = false;

for (const budget of BUDGETS) {
  const full = join(OUT, budget.path);
  let size;
  try {
    size = statSync(full).size / 1024;
  } catch {
    console.error(`✗ ${budget.label}: ${budget.path} not found in ${target}-mv3`);
    failed = true;
    continue;
  }
  const ok = size <= budget.maxKb;
  failed ||= !ok;
  console.log(`${ok ? '✓' : '✗'} ${budget.label}: ${size.toFixed(1)} kB / ${budget.maxKb} kB`);
}

const total =
  readdirSync(OUT, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .reduce((sum, entry) => sum + statSync(join(entry.parentPath, entry.name)).size, 0) / 1024;
console.log(`  total unpacked: ${total.toFixed(1)} kB`);

process.exit(failed ? 1 : 0);
