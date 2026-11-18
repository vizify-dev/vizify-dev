import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv-parser";

describe("parseCsv: basics", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("parses a header-only file", () => {
    expect(parseCsv("a,b")).toEqual([["a", "b"]]);
  });

  it("handles LF, CRLF and CR line endings", () => {
    const expected = [["a", "b"], ["1", "2"]];
    expect(parseCsv("a,b\n1,2")).toEqual(expected);
    expect(parseCsv("a,b\r\n1,2")).toEqual(expected);
    expect(parseCsv("a,b\r1,2")).toEqual(expected);
  });

  it("ignores a trailing newline", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("returns [] for empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("", "auto")).toEqual([]);
  });

  it("drops fully blank and whitespace-only lines", () => {
    expect(parseCsv("a,b\n\n1,2\n   \n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps empty fields", () => {
    expect(parseCsv("a,,c\n,,")).toEqual([["a", "", "c"], ["", "", ""]]);
  });

  it("strips a leading BOM", () => {
    expect(parseCsv("\uFEFFa,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("parseCsv: quoting", () => {
  it("keeps delimiters inside quotes", () => {
    expect(parseCsv('"a,b",c')).toEqual([["a,b", "c"]]);
  });

  it('unescapes "" inside quoted fields', () => {
    expect(parseCsv('"say ""hi""",x')).toEqual([['say "hi"', "x"]]);
  });

  it("keeps LF and CRLF inside quoted fields", () => {
    expect(parseCsv('"l1\nl2",x\n1,2')).toEqual([["l1\nl2", "x"], ["1", "2"]]);
    expect(parseCsv('"l1\r\nl2",x')).toEqual([["l1\r\nl2", "x"]]);
  });

  it("does not throw on an unterminated quote", () => {
    expect(parseCsv('a,"unterminated')).toEqual([["a", "unterminated"]]);
  });
});

describe("parseCsv: control characters", () => {
  it("strips invalid control characters", () => {
    expect(parseCsv("a\u0000,b\u0007\n1\u007F,2\u000B")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps tab characters inside fields", () => {
    expect(parseCsv('"a\tb",c')).toEqual([["a\tb", "c"]]);
  });
});

describe("parseCsv: explicit delimiter", () => {
  it("defaults to comma and does not split on others", () => {
    expect(parseCsv("a;b;c")).toEqual([["a;b;c"]]);
  });

  it.each([
    [";", "a;b\n1;2"],
    ["\t", "a\tb\n1\t2"],
    ["|", "a|b\n1|2"],
  ] as const)("splits on %j", (delimiter, input) => {
    expect(parseCsv(input, delimiter)).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("respects quotes with a non-comma delimiter", () => {
    expect(parseCsv('"a;b";c', ";")).toEqual([["a;b", "c"]]);
  });
});

describe("parseCsv: auto delimiter detection", () => {
  const expected = [["a", "b", "c"], ["1", "2", "3"]];

  it("detects comma", () => {
    expect(parseCsv("a,b,c\n1,2,3", "auto")).toEqual(expected);
  });

  it("detects semicolon", () => {
    expect(parseCsv("a;b;c\n1;2;3", "auto")).toEqual(expected);
  });

  it("detects tab", () => {
    expect(parseCsv("a\tb\tc\n1\t2\t3", "auto")).toEqual(expected);
  });

  it("detects pipe", () => {
    expect(parseCsv("a|b|c\n1|2|3", "auto")).toEqual(expected);
  });

  it("falls back to comma for single-column input", () => {
    expect(parseCsv("a\nb", "auto")).toEqual([["a"], ["b"]]);
  });

  it("ignores delimiters inside quotes when detecting", () => {
    expect(parseCsv('"a,b,c";d\n1;2', "auto")).toEqual([["a,b,c", "d"], ["1", "2"]]);
  });

  it("aligns a record that uses a different delimiter than the header", () => {
    expect(parseCsv("a,b,c\n1;2;3\n4,5,6", "auto")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("prefers the header delimiter on a tie", () => {
    expect(parseCsv("a;b\n1,5;2", "auto")).toEqual([["a", "b"], ["1,5", "2"]]);
  });

  it("keeps the header delimiter for short rows", () => {
    expect(parseCsv("a,b,c\n1,2", "auto")).toEqual([["a", "b", "c"], ["1", "2"]]);
  });
});