type Attrs = Record<string, string | number | boolean | EventListener | undefined>;
type Child = Node | string | null | undefined | false;

/** Creates an element: `h('button', { class: 'x', onclick: fn }, 'Label')`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

export function progressBar(points: number, target: number): HTMLElement {
  const pct = target > 0 ? Math.min(100, Math.round((100 * points) / target)) : 0;
  return h(
    'div',
    {
      class: 'bar',
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': target,
      'aria-valuenow': points,
      'aria-label': `${points} of ${target} points`,
    },
    h('div', { class: 'bar-fill', style: `width: ${pct}%` }),
  );
}

export function download(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function dateStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
