import StatusBadge from './StatusBadge'

const FIXED_COLUMNS = [
  { key: 'so', label: 'S/O', width: 90 },
  { key: 'li', label: 'L/I', width: 70 },
  { key: 'sap', label: 'SAP', width: 100 },
  { key: 'materialDescription', label: 'Material Description', width: 220 },
  { key: 'plt', label: 'PLT', width: 80 },
  { key: 'cp', label: 'CP', width: 80 },
]

const CHECKBOX_COL_WIDTH = 44
const DATE_COL_WIDTH = 90
const STATUS_COL_WIDTH = 130

export default function DynamicTable({
  dateColumns,
  rows,
  selectedRowIds,
  onToggleRow,
  onToggleAll,
  editingRowIds,
  editValues,
  onEditCellChange,
  onSaveRow,
  onCancelRow,
}) {
  const totalWidth =
    CHECKBOX_COL_WIDTH +
    FIXED_COLUMNS.reduce((s, c) => s + c.width, 0) +
    dateColumns.length * DATE_COL_WIDTH +
    STATUS_COL_WIDTH

  // Exclude rows currently in edit mode from "select all" and checkbox availability
  const pendingRowIds = rows
    .filter((r) => r.status === 'Pending' && !editingRowIds.has(r.id))
    .map((r) => r.id)
  const allPendingSelected = pendingRowIds.length > 0 && pendingRowIds.every((id) => selectedRowIds.has(id))

  if (!rows.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#6a6d70] text-[14px] py-16">
        No records found
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <table
        className="border-collapse text-[12px]"
        style={{ minWidth: `${totalWidth}px`, tableLayout: 'fixed', width: `${totalWidth}px` }}
      >
        <colgroup>
          <col style={{ width: `${CHECKBOX_COL_WIDTH}px` }} />
          {FIXED_COLUMNS.map((c) => (
            <col key={c.key} style={{ width: `${c.width}px` }} />
          ))}
          {dateColumns.map((c) => (
            <col key={c.key} style={{ width: `${DATE_COL_WIDTH}px` }} />
          ))}
          <col style={{ width: `${STATUS_COL_WIDTH}px` }} />
        </colgroup>

        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
            <th className="text-center border-b border-r border-[#e5e5e5] py-3.5">
              <input
                type="checkbox"
                checked={allPendingSelected}
                disabled={pendingRowIds.length === 0}
                onChange={() => onToggleAll(pendingRowIds, allPendingSelected)}
                className="w-4 h-4 accent-[#0a6ed1] cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
              />
            </th>
            {FIXED_COLUMNS.map((c) => (
              <th
                key={c.key}
                className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
            {dateColumns.map((c) => (
              <th
                key={c.key}
                className="text-right font-semibold py-3.5 px-3 text-[11px] border-b border-r border-[#e5e5e5] whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
            <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const isPending = row.status === 'Pending'
            const isChecked = selectedRowIds.has(row.id)
            const isEditing = editingRowIds.has(row.id)

            return (
              <tr
                key={row.id}
                onClick={() => !isEditing && onToggleRow(row.id, isPending)}
                className={`border-b border-[#f0f0f0] last:border-b-0 transition-colors duration-100 ${
                  isPending && !isEditing ? 'cursor-pointer' : 'cursor-default'
                } ${isEditing ? 'bg-[#fffbf5]' : isChecked ? 'bg-[#ebf5ff]' : 'hover:bg-[#fafbfc]'}`}
              >
                <td className="py-3 px-3 border-r border-[#f0f0f0] text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!isPending || isEditing}
                    onChange={() => onToggleRow(row.id, isPending)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-[#0a6ed1] cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  />
                </td>
                <td className="py-3 px-3 border-r border-[#f0f0f0] font-medium text-[#32363a]">{row.so}</td>
                <td className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a]">{row.li}</td>
                <td className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a]">{row.sap}</td>
                <td className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a]">{row.materialDescription}</td>
                <td className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a]">{row.plt}</td>
                <td className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a]">{row.cp}</td>

                {dateColumns.map((c) => {
                  const cellVal = isEditing
                    ? (editValues[row.id]?.[c.key] ?? '')
                    : row.values[c.key]

                  return (
                    <td
                      key={c.key}
                      className="py-3 px-3 border-r border-[#f0f0f0] text-right tabular-nums text-[#32363a]"
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={cellVal}
                          onChange={(e) => onEditCellChange(row.id, c.key, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-right text-[12px] border border-[#0a6ed1] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0a6ed1] bg-white tabular-nums"
                        />
                      ) : cellVal === '' || cellVal == null ? (
                        <span className="text-[#d9d9d9]">—</span>
                      ) : (
                        cellVal
                      )}
                    </td>
                  )
                })}

                <td className="py-3 px-3">
                  {isEditing ? (
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSaveRow(row.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#107e3e] text-white hover:bg-[#0c632f] transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => onCancelRow(row.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-white text-[#6a6d70] border border-[#e5e5e5] hover:border-[#0a6ed1] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <StatusBadge status={row.status} />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}