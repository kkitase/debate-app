import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn, copyToClipboard } from '../utils';

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copy to clipboard"
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase transition-all',
        'bg-white/5 hover:bg-white/10 border border-white/10',
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
