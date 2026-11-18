export type CsvDelimiter = "," | ";" | "\t" | "|";

const CSV_DELIMITERS: CsvDelimiter[] = [",", ";", "\t", "|"];
const INVALID_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function splitRecords(input: string): string[] {
  const records: string[] = [];
  let inQuotes = false;
  let start = 0;

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '"') {
      if (inQuotes && input[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && (input[i] === "\n" || input[i] === "\r")) {
      records.push(input.slice(start, i));
      if (input[i] === "\r" && input[i + 1] === "\n") i++;
      start = i + 1;
    }
  }

  if (start < input.length) records.push(input.slice(start));
  return records;
}

function parseRecord(record: string, delimiter: CsvDelimiter): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < record.length; i++) {
    const ch = record[i];

    if (inQuotes) {
      if (ch === '"') {
        if (record[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }

  fields.push(field);
  return fields;
}

function detectDelimiter(record: string): CsvDelimiter {
  return CSV_DELIMITERS.reduce((best, delimiter) =>
    parseRecord(record, delimiter).length > parseRecord(record, best).length ? delimiter : best,
  );
}

function detectRecordDelimiter(record: string, expectedColumns: number, preferred: CsvDelimiter) {
  return CSV_DELIMITERS.reduce((best, delimiter) => {
    const count = parseRecord(record, delimiter).length;
    const bestCount = parseRecord(record, best).length;
    const distance = Math.abs(count - expectedColumns);
    const bestDistance = Math.abs(bestCount - expectedColumns);
    if (distance < bestDistance || (distance === bestDistance && delimiter === preferred)) {
      return delimiter;
    }
    return best;
  }, preferred);
}

/**
 * Parses CSV records, preserving quoted newlines and escaped quotes.
 * Auto-detection chooses a delimiter per record so mixed-delimiter imports can be aligned.
 */
export function parseCsv(input: string, delimiter: CsvDelimiter | "auto" = ","): string[][] {
  const cleaned = input
    .replace(/^\uFEFF/, "")
    .replace(INVALID_CONTROL_CHARACTERS, "");
  const records = splitRecords(cleaned);
  if (records.length === 0) return [];

  const parsed =
    delimiter === "auto"
      ? (() => {
          const headerDelimiter = detectDelimiter(records[0]);
          const expectedColumns = parseRecord(records[0], headerDelimiter).length;
          return records.map((record, index) =>
            parseRecord(
              record,
              index === 0
                ? headerDelimiter
                : detectRecordDelimiter(record, expectedColumns, headerDelimiter),
            ),
          );
        })()
      : records.map((record) => parseRecord(record, delimiter));

  return parsed.filter((row) => row.length > 1 || row[0].trim() !== "");
}
