import { clean, cellWidth, fitText } from './markdown.js';
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function layoutInput(text, cursor, label, width, maxRows = 5) {
  text = clean(text);
  const chars = Array.from(text);
  cursor = Math.max(0, Math.min(cursor, chars.length));
  const prefix = fitText(`${label}> `, Math.min(cellWidth(`${label}> `), Math.max(2, width - 5)));
  const padding = ' '.repeat(cellWidth(prefix));
  const available = Math.max(2, width - cellWidth(prefix) - 1);
  const rows = [{ text: '', start: 0 }];
  let offset = 0;
  for (const { segment } of segmenter.segment(text)) {
    if (cellWidth(rows.at(-1).text) + cellWidth(segment) > available) rows.push({ text: '', start: offset });
    rows.at(-1).text += segment;
    offset += Array.from(segment).length;
  }
  if (cellWidth(rows.at(-1).text) >= available) rows.push({ text: '', start: offset });
  const cursorRow = rows.findLastIndex(row => row.start <= cursor);
  const cursorCells = cellWidth(chars.slice(rows[cursorRow].start, cursor).join(''));
  maxRows = Math.max(1, maxRows);
  const first = Math.max(0, cursorRow - maxRows + 1);
  const visible = rows.slice(first, first + maxRows);
  const move = delta => {
    const target = rows[cursorRow + delta];
    if (!target) return cursor;
    const next = rows[cursorRow + delta + 1];
    let count = target.start, cells = 0;
    for (const { segment } of segmenter.segment(target.text)) {
      if (cells + cellWidth(segment) > cursorCells) break;
      const end = count + Array.from(segment).length;
      if (next && end >= next.start) break;
      cells += cellWidth(segment); count = end;
    }
    return count;
  };
  return { lines: visible.map((row, index) => `${index ? padding : prefix}${row.text}`),
    cursorRow: cursorRow - first, cursorColumn: cellWidth(prefix) + cursorCells,
    hiddenBefore: first, hiddenAfter: rows.length - first - visible.length, totalRows: rows.length,
    up: move(-1), down: move(1) };
}
