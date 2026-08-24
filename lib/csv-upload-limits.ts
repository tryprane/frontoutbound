export const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_CSV_ROW_COUNT = 2_000

export const MAX_CSV_FILE_SIZE_LABEL = '5 MB'
export const MAX_CSV_ROW_COUNT_LABEL = MAX_CSV_ROW_COUNT.toLocaleString('en-US')

export function csvFileSizeLimitError(): string {
  return `CSV file must be ${MAX_CSV_FILE_SIZE_LABEL} or smaller`
}

export function csvRowLimitError(): string {
  return `CSV file can contain at most ${MAX_CSV_ROW_COUNT_LABEL} data rows`
}
