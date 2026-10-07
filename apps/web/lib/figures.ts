// Finds money figures in chat answers so the UI can pick them out.

const FIGURE = /([₦$£€]\d(?:[\d,]*\d)?(?:\.\d+)?)/;

/** Splits text into plain parts and figures: "Food took ₦92,300." → ["Food took ", "₦92,300", "."] */
export function splitFigures(text: string): { text: string; isFigure: boolean }[] {
  return text
    .split(FIGURE)
    .filter(Boolean)
    .map((part) => ({ text: part, isFigure: FIGURE.test(part) }));
}
