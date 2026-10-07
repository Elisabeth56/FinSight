import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/landing/footer";

describe("footer wordmark", () => {
  it("gets the highlighter swipe on hover, like the nav links", () => {
    const html = renderToStaticMarkup(createElement(Footer));
    expect(html).toMatch(/<span class="[^"]*\bswipe\b[^"]*">FinSight<span/);
  });
});
