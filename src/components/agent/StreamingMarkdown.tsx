"use client";

import { memo, type ReactNode } from "react";

type StreamingMarkdownProps = {
  readonly content: string;
  readonly isStreaming?: boolean;
};

/** Parse inline markdown (bold, italic, inline code) into React nodes. */
function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // match **bold**, *italic*, `code` — order matters (bold before italic)
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[4]) {
      nodes.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[6]) {
      nodes.push(
        <code
          key={match.index}
          className="bg-surface px-1 py-0.5 rounded text-[13px] font-mono"
        >
          {match[6]}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Lightweight markdown renderer that handles mid-stream content.
 * Supports paragraphs, code fences, inline code, bold, italic, and bullet lists.
 * When streaming, auto-closes unclosed code fences for display.
 */
function StreamingMarkdownInner({
  content,
  isStreaming = false,
}: StreamingMarkdownProps) {
  let processed = content;

  // auto-close unclosed code fences during streaming
  if (isStreaming) {
    const fenceCount = (processed.match(/^```/gm) ?? []).length;
    if (fenceCount % 2 !== 0) {
      processed += "\n```";
    }
  }

  const blocks = processed.split(/\n\n+/);
  const elements: ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // code fence block
    const fenceMatch = block.match(/^```(\w*)\n([\s\S]*?)```$/);
    if (fenceMatch) {
      elements.push(
        <pre key={i} className="bg-surface rounded p-3 overflow-x-auto">
          <code className="text-[13px] font-mono">{fenceMatch[2]}</code>
        </pre>,
      );
      continue;
    }

    // check if this block is a bullet list (all lines start with "- ")
    const lines = block.split("\n");
    const isList = lines.every((line) => line.startsWith("- "));
    if (isList) {
      elements.push(
        <ul key={i} className="list-disc pl-5 space-y-1">
          {lines.map((line, j) => (
            <li key={j}>{parseInline(line.slice(2))}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // paragraph with inline formatting
    elements.push(<p key={i}>{parseInline(block)}</p>);
  }

  return <div className="space-y-3">{elements}</div>;
}

export const StreamingMarkdown = memo(StreamingMarkdownInner);
