import { expect, it } from "vitest";

import { splitFigures } from "@/lib/figures";

it("picks out naira and dollar figures", () => {
  expect(splitFigures("Food took ₦92,300, then $5.50.")).toEqual([
    { text: "Food took ", isFigure: false },
    { text: "₦92,300", isFigure: true },
    { text: ", then ", isFigure: false },
    { text: "$5.50", isFigure: true },
    { text: ".", isFigure: false },
  ]);
});
