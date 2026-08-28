'use client'

interface CsvPreviewTableProps {
  headers: string[]
  rows: Record<string, string>[]
  highlightColumns?: Record<string, { label: string; color: string }>
  maxRows?: number
}

export function CsvPreviewTable({
  headers,
  rows,
  highlightColumns = {},
  maxRows = 5,
}: CsvPreviewTableProps) {
  const displayRows = rows.slice(0, maxRows)

  return (
    <div className="overflow-x-auto rounded-[18px] border border-[#121316]/12 bg-white shadow-2xs">
      <table className="w-full border-collapse text-xs text-left">
        <thead>
          <tr className="bg-[#faf8f4] border-b border-[#121316]/15 text-[#121316]">
            <th className="px-4 py-3 text-center font-mono font-bold text-[11px] text-[#8a8780] w-12 border-r border-[#121316]/10">
              #
            </th>
            {headers.map((header, idx) => {
              const highlight = highlightColumns[header]
              const isLast = idx === headers.length - 1

              return (
                <th
                  key={header}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                    !isLast ? 'border-r border-[#121316]/10' : ''
                  }`}
                  style={{
                    color: highlight?.color || '#121316',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{header}</span>
                    {highlight ? (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: `${highlight.color}15`,
                          color: highlight.color,
                          border: `1px solid ${highlight.color}30`,
                        }}
                      >
                        {highlight.label}
                      </span>
                    ) : null}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#121316]/10 font-sans">
          {displayRows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-[#121316]/10 last:border-b-0 odd:bg-white even:bg-[#faf8f4]/40 hover:bg-[#ee382b]/05 transition-colors"
            >
              <td className="px-4 py-3 text-center font-mono font-bold text-[#8a8780] bg-[#faf8f4]/60 border-r border-[#121316]/10 whitespace-nowrap">
                {index + 1}
              </td>
              {headers.map((header, idx) => {
                const isLast = idx === headers.length - 1
                const val = row[header]

                return (
                  <td
                    key={header}
                    className={`px-4 py-3 text-xs text-[#121316] max-w-xs break-words align-top ${
                      !isLast ? 'border-r border-[#121316]/10' : ''
                    }`}
                  >
                    {val !== undefined && val !== null && String(val).trim() !== '' ? (
                      <span className="font-medium text-[#121316]">{val}</span>
                    ) : (
                      <span className="text-[#8a8780] font-normal italic">-</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length > maxRows ? (
        <div className="p-3 text-center text-xs font-medium text-[#62605c] bg-[#faf8f4] border-t border-[#121316]/10">
          Showing {maxRows} of {rows.length} rows
        </div>
      ) : null}
    </div>
  )
}
