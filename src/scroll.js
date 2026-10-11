export const MOUSE_ON = '\x1b[?1000h\x1b[?1006h';
export const MOUSE_OFF = '\x1b[?1006l\x1b[?1000l';

// Positive amounts move toward older messages; panels count from the top.
export function scrollView(app, amount) {
  if (app.panel) app.panel.offset = Math.max(0, (app.panel.offset || 0) - amount);
  else if (app.view === 'activity') app.activityScroll = Math.max(0, app.activityScroll + amount);
  else app.scroll = Math.max(0, app.scroll + amount);
}

// Strip SGR mouse reports before readline can interpret them as prompt text.
export function terminalInput(write, scroll, click = () => {}) {
  let pending = '';
  let flush;
  return chunk => {
    clearTimeout(flush);
    pending += chunk;
    while (pending) {
      const start = pending.indexOf('\x1b[<');
      if (start < 0) {
        const keep = pending.endsWith('\x1b[') ? 2 : pending.endsWith('\x1b') ? 1 : 0;
        if (pending.length > keep) write(pending.slice(0, pending.length - keep));
        pending = keep ? pending.slice(-keep) : '';
        if (pending)
          flush = setTimeout(() => {
            const text = pending;
            pending = '';
            write(text);
          }, 30);
        return;
      }
      if (start) {
        write(pending.slice(0, start));
        pending = pending.slice(start);
      }
      const report = pending.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
      if (!report) {
        if (/^\x1b\[<[\d;]*$/.test(pending)) return;
        write(pending[0]);
        pending = pending.slice(1);
        continue;
      }
      const button = Number(report[1]);
      if (report[4] === 'M' && button & 64 && !(button & 2)) scroll(button & 1 ? -3 : 3);
      else if (report[4] === 'M' && button === 0) click(Number(report[2]), Number(report[3]));
      pending = pending.slice(report[0].length);
    }
  };
}
