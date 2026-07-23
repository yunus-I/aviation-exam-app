"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathTextProps {
  text?: string | null;
  className?: string;
  style?: React.CSSProperties;
  as?: "span" | "div" | "p";
}

interface TextSegment {
  type: "text" | "math-inline" | "math-block";
  content: string;
}

function parseMathSegments(rawText: string): TextSegment[] {
  if (!rawText) return [];

  const segments: TextSegment[] = [];
  // Regex matches:
  // 1. Block math: $$ ... $$ or \[ ... \]
  // 2. Inline math: $ ... $ or \( ... \)
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+\$|\\\([\s\S]+?\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: rawText.slice(lastIndex, match.index),
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith("$$") && matchedStr.endsWith("$$")) {
      segments.push({
        type: "math-block",
        content: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith("\\[") && matchedStr.endsWith("\\]")) {
      segments.push({
        type: "math-block",
        content: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith("$") && matchedStr.endsWith("$")) {
      segments.push({
        type: "math-inline",
        content: matchedStr.slice(1, -1).trim(),
      });
    } else if (matchedStr.startsWith("\\(") && matchedStr.endsWith("\\)")) {
      segments.push({
        type: "math-inline",
        content: matchedStr.slice(2, -2).trim(),
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    segments.push({
      type: "text",
      content: rawText.slice(lastIndex),
    });
  }

  return segments;
}

export const MathText: React.FC<MathTextProps> = ({
  text,
  className,
  style,
  as: Component = "span",
}) => {
  const renderedElements = useMemo(() => {
    if (!text) return null;

    const segments = parseMathSegments(text);
    return segments.map((seg, idx) => {
      if (seg.type === "text") {
        return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
      }

      try {
        const html = katex.renderToString(seg.content, {
          displayMode: seg.type === "math-block",
          throwOnError: false,
          output: "html",
        });

        return (
          <span
            key={idx}
            className={seg.type === "math-block" ? "katex-block-wrap my-2 block" : "katex-inline-wrap inline-block px-0.5"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch (err) {
        console.error("KaTeX rendering error:", err);
        return <span key={idx}>{seg.content}</span>;
      }
    });
  }, [text]);

  if (!text) return null;

  return (
    <Component className={className} style={style}>
      {renderedElements}
    </Component>
  );
};
