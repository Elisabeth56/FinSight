import { describe, expect, it } from "vitest";

import { checkFile, MAX_UPLOAD_BYTES } from "@/lib/upload";

const file = (name: string, size: number) => new File([new Uint8Array(size)], name);

describe("checkFile", () => {
  it("accepts PDF and CSV statements up to 4 MB", () => {
    expect(checkFile(file("opay_march.pdf", 1000))).toBeNull();
    expect(checkFile(file("GTB.CSV", MAX_UPLOAD_BYTES))).toBeNull();
  });

  it("stops big files before they're sent", () => {
    expect(checkFile(file("year.pdf", MAX_UPLOAD_BYTES + 1))?.code).toBe("file_too_large");
  });

  it("names the formats it reads", () => {
    expect(checkFile(file("statement.xlsx", 10))?.code).toBe("unsupported_file");
    expect(checkFile(file("empty.csv", 0))?.code).toBe("empty_file");
  });
});
