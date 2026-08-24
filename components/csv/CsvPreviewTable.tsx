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
    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, width: '40px' }}>
              #
            </th>
            {headers.map((header) => {
              const highlight = highlightColumns[header]
              return (
                <th
                  key={header}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    color: highlight?.color || 'var(--text-secondary)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    borderLeft: highlight ? `2px solid ${highlight.color}` : undefined,
                  }}
                >
                  {header}
                  {highlight ? (
                    <span
                      style={{
                        marginLeft: '6px',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: `${highlight.color}20`,
                        color: highlight.color,
                      }}
                    >
                      {highlight.label}
                    </span>
                  ) : null}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => (
            <tr
              key={index}
              style={{
                borderBottom: index < displayRows.length - 1 ? '1px solid var(--border)' : 'none',
                background: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
              }}
            >
              <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{index + 1}</td>
              {headers.map((header) => (
                <td
                  key={header}
                  style={{
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row[header] || (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length > maxRows ? (
        <div
          style={{
            padding: '10px 14px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border)',
          }}
        >
          Showing {maxRows} of {rows.length} rows
        </div>
      ) : null}
    </div>
  )
}
