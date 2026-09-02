"use client";

import { useMemo, useState } from "react";
import { clipReportText } from "@/lib/reportProse";

export function ReportProse({
  text,
  maxSentences = 5,
}: {
  text: string;
  maxSentences?: number;
}) {
  const clipped = useMemo(
    () => clipReportText(text, { maxSentences }),
    [text, maxSentences],
  );
  const full = useMemo(
    () => clipReportText(text, { maxSentences: 12, maxChars: 1600 }),
    [text],
  );
  const truncated = full.length > clipped.length + 8;
  const [expanded, setExpanded] = useState(false);
  const body = expanded ? full : clipped;
  const paragraphs = body.split(/(?<=\.)\s+(?=[A-Z])/).filter(Boolean);

  return (
    <div className="report-prose">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
      {truncated ? (
        <button
          type="button"
          className="report-prose__more"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
