export function findFirstVisibleSourceLine(container: HTMLDivElement): number | null {
  const elements = container.querySelectorAll<HTMLElement>('[data-source-line]');
  const containerTop = container.getBoundingClientRect().top;

  for (const el of elements) {
    const elTop = el.getBoundingClientRect().top;
    if (elTop >= containerTop - 10) {
      const line = parseInt(el.dataset.sourceLine ?? '', 10);
      return isNaN(line) ? null : line;
    }
  }

  return null;
}

export function scrollTextareaToLine(
  textarea: HTMLTextAreaElement,
  content: string,
  line: number,
): void {
  const lines = content.split('\n');
  const targetIndex = Math.min(line - 1, lines.length - 1);
  let charOffset = 0;
  for (let i = 0; i < targetIndex; i++) {
    charOffset += lines[i].length + 1;
  }

  textarea.selectionStart = textarea.selectionEnd = charOffset;

  const style = getComputedStyle(textarea);
  let lineHeight = parseFloat(style.lineHeight);
  if (isNaN(lineHeight)) {
    lineHeight = parseFloat(style.fontSize) * 1.5;
  }

  textarea.scrollTop = targetIndex * lineHeight;
  textarea.focus();
}

export function getLineFromCursor(textarea: HTMLTextAreaElement): number {
  const pos = textarea.selectionStart;
  const textBeforeCursor = textarea.value.slice(0, pos);
  return textBeforeCursor.split('\n').length;
}

export function scrollPreviewToSourceLine(
  container: HTMLDivElement,
  line: number,
): void {
  let target = container.querySelector<HTMLElement>(`[data-source-line="${line}"]`);

  if (!target) {
    const elements = container.querySelectorAll<HTMLElement>('[data-source-line]');
    let closestDist = Infinity;
    for (const el of elements) {
      const elLine = parseInt(el.dataset.sourceLine ?? '', 10);
      if (isNaN(elLine)) continue;
      const dist = Math.abs(elLine - line);
      if (dist < closestDist) {
        closestDist = dist;
        target = el;
      }
    }
  }

  if (target) {
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    container.scrollTop += targetRect.top - containerRect.top;
  }
}
