/** Clip remote-provider markdown dumps into console-readable prose. */

const HEADING_FRAGMENT =
  /^(executive summary|business impact|status|next steps|uncertainty|most likely root cause|supporting contextual clues|conclusion|engineering handoff|facts\b|alternative explanations).*$/i;

const COT_PREFIXES = [
  "we need to",
  "provide that",
  "provide summary",
  "output guidance",
  "task:",
  "write only",
  "plain sentences",
];

export function clipReportText(
  text: string,
  options?: { maxSentences?: number; maxChars?: number },
): string {
  const maxSentences = options?.maxSentences ?? 5;
  const maxChars = options?.maxChars ?? 880;
  const cleaned = prepare(text);
  const sentences = splitSentences(cleaned).filter(
    (item) => !isInstructionEcho(item) && !isHeadingFragment(item),
  );
  const usable = sentences.length > 0 ? sentences : splitSentences(cleaned);
  let clipped = usable.slice(0, maxSentences).join(" ").trim();
  if (clipped.length > maxChars) {
    clipped = `${clipped.slice(0, maxChars - 1).replace(/\s+\S*$/, "").replace(/[.,;:]+$/, "")}.`;
  }
  return clipped;
}

export function clipRemediationItems(items: string[], limit = 5): string[] {
  const prepared = prepare(items.join("\n"));
  return splitSentences(prepared)
    .filter((item) => !isInstructionEcho(item) && !isHeadingFragment(item))
    .slice(0, limit)
    .map((item) => `${item.slice(0, 180).replace(/[.,;:]+$/, "")}.`);
}

function prepare(text: string): string {
  let value = text.replace(/<think>[\s\S]*?<\/think>/gi, " ").trim();
  value = value.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  const kept: string[] = [];
  for (const raw of value.split("\n")) {
    const line = raw.trim();
    if (!line || /^[-|:\s]+$/.test(line)) continue;
    if (isTableRow(line)) {
      kept.push(...usefulTableCells(line));
      continue;
    }
    kept.push(line);
  }
  value = kept.join(" ");
  value = value.replace(/\*\*(.+?)\*\*/g, "$1");
  value = value.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1");
  value = value.replace(/`([^`]+)`/g, "$1");
  value = value.replace(/\|/g, " ");
  value = value.replace(/\s+-\s+/g, ". ");
  value = value.replace(/[:;]\s*\./g, ".");
  value = value.replace(/\.{2,}/g, ".");
  return value.replace(/\s+/g, " ").trim();
}

function usefulTableCells(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.replace(/[*]/g, "").trim())
    .filter(
      (cell) =>
        cell.length > 28 &&
        !/^[-:]+$/.test(cell) &&
        !["evidence", "what it shows"].includes(cell.toLowerCase()),
    );
}

function isTableRow(line: string): boolean {
  return (line.match(/\|/g) ?? []).length >= 2;
}

function isHeadingFragment(sentence: string): boolean {
  const lowered = sentence.trim().toLowerCase();
  if (/^\d+\.?$/.test(lowered)) return true;
  if (HEADING_FRAGMENT.test(lowered) && lowered.split(/\s+/).length <= 6) return true;
  return lowered.length < 40 && !/[.0-9]/.test(lowered);
}

function isInstructionEcho(sentence: string): boolean {
  const lowered = sentence.toLowerCase().replace(/^[-*]\s+/, "");
  return COT_PREFIXES.some((prefix) => lowered.startsWith(prefix));
}

function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [])
    .map((item) => stripLeadingHeading(item.trim()))
    .filter(Boolean);
}

function stripLeadingHeading(sentence: string): string {
  return sentence
    .replace(
      /^(executive summary|business impact|status|next steps|uncertainty|most likely root cause|supporting contextual clues|conclusion|engineering handoff|facts)\b.{0,48}?(?=[A-Z])/i,
      "",
    )
    .replace(/^[\s\-–:]+/, "")
    .trim();
}
