import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function exportAsMarkdown(
  messages: Array<{ role: string; content: string; model: string }>,
  personas: Record<string, { name: string }>,
  conclusion: string | null,
): void {
  const lines: string[] = ['# AI Debate Export\n'];

  for (const m of messages) {
    const name = personas[m.role]?.name ?? m.role;
    lines.push(`## ${name} (${m.model})\n\n${m.content}\n`);
  }

  if (conclusion) {
    lines.push('---\n\n## Strategic Conclusion\n\n' + conclusion);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debate-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}