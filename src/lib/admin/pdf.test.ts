import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES, pdfProblem } from "./pdf";

const PDF = new TextEncoder().encode("%PDF-1.7");

describe("pujada de PDF", () => {
  it("accepta un PDF dins del límit", () => {
    expect(pdfProblem({ size: MAX_PDF_BYTES }, PDF)).toBeNull();
  });

  it("no es fia de l'extensió: mira el contingut del fitxer", () => {
    expect(pdfProblem({ size: 100 }, new TextEncoder().encode("<html>"))).toMatch(/no és un PDF/);
    expect(pdfProblem({ size: 0 }, new Uint8Array())).toMatch(/no és un PDF/);
  });

  it("rebutja el que passa del límit del bucket", () => {
    expect(pdfProblem({ size: MAX_PDF_BYTES + 1 }, PDF)).toMatch(/20 MB/);
  });
});
