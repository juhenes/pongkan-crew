// Keep terminal traffic proportional to the visible changes, not screen size.
export class TerminalRenderer {
  lines = [];
  size = null;
  cursor = '';
  constructor(output) { this.output = output; }
  draw(content, row, column, size) {
    const lines = content.split('\n');
    const reset = size !== this.size;
    let patch = reset ? '\x1b[H\x1b[2J' : '';
    for (let i = 0; i < Math.max(lines.length, reset ? 0 : this.lines.length); i++) {
      if (reset || lines[i] !== this.lines[i]) patch += `\x1b[${i + 1};1H\x1b[2K${lines[i] || ''}`;
    }
    const cursor = `\x1b[${row};${column}H`;
    if (!patch && cursor === this.cursor) return;
    this.lines = lines; this.size = size; this.cursor = cursor;
    return this.output.write(`\x1b[?25l${patch}${cursor}\x1b[?25h`);
  }
}

export function scheduleRender(draw, { schedule = setTimeout, cancel = clearTimeout, delay = 16 } = {}) {
  let pending = null;
  const request = () => {
    if (pending !== null) return;
    pending = schedule(() => { pending = null; draw(); }, delay);
  };
  request.cancel = () => { if (pending !== null) cancel(pending); pending = null; };
  return request;
}
