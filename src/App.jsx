import { useState } from 'react'
import FilterBar from '@/components/FilterBar'
import DynamicTable from '@/components/DynamicTable'
import { fetchDashboard, postRowAction } from '@/lib/dashboardApi'

function App() {
  const [customerCode, setCustomerCode] = useState('')
  const [materialDescription, setMaterialDescription] = useState('')

  const [dateColumns, setDateColumns] = useState([])
  const [rows, setRows] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Multi-select via checkboxes — a Set of row ids.
  const [selectedRowIds, setSelectedRowIds] = useState(new Set())
  const [isActing, setIsActing] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'approve' | 'reject' | null
  const [actionError, setActionError] = useState(null)

  const selectedCount = selectedRowIds.size
  const canAct = selectedCount > 0 && !isActing

  const handleGo = async () => {
    setLoading(true)
    setError(null)
    setSelectedRowIds(new Set())
    setActionError(null)
    try {
      const data = await fetchDashboard({ customerCode, materialDescription })
      setDateColumns(data.dateColumns)
      setRows(data.rows)
      setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setCustomerCode('')
    setMaterialDescription('')
    setDateColumns([])
    setRows([])
    setHasSearched(false)
    setError(null)
    setSelectedRowIds(new Set())
    setActionError(null)
  }

  const handleToggleRow = (rowId, isPending) => {
    if (!isPending) return
    setActionError(null)
    setSelectedRowIds((current) => {
      const next = new Set(current)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }

  const handleToggleAll = (pendingRowIds, allSelected) => {
    setActionError(null)
    setSelectedRowIds(allSelected ? new Set() : new Set(pendingRowIds))
  }

  const handleBulkAction = async (action) => {
    const targetRows = rows.filter((r) => selectedRowIds.has(r.id) && r.status === 'Pending')
    if (!targetRows.length) return

    setActionError(null)
    setIsActing(true)
    setPendingAction(action)

    const results = await Promise.allSettled(
      targetRows.map((row) => postRowAction({ rowId: row.id, action })),
    )

    const newStatusById = {}
    let failureCount = 0

    results.forEach((result, idx) => {
      const rowId = targetRows[idx].id
      if (result.status === 'fulfilled') {
        newStatusById[rowId] = result.value.status
      } else {
        failureCount += 1
      }
    })

    if (Object.keys(newStatusById).length) {
      setRows((current) =>
        current.map((r) => (newStatusById[r.id] ? { ...r, status: newStatusById[r.id] } : r)),
      )
    }

    // Drop succeeded rows from selection; keep failed ones selected so the user can retry.
    setSelectedRowIds((current) => {
      const next = new Set(current)
      Object.keys(newStatusById).forEach((id) => next.delete(id))
      return next
    })

    if (failureCount) {
      setActionError(
        `${failureCount} row${failureCount > 1 ? 's' : ''} failed to update — still selected, try again.`,
      )
    }

    setIsActing(false)
    setPendingAction(null)
  }

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      <header className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-4">
        <h1 className="text-[18px] font-bold text-[#32363a]">Customer Schedule Dashboard</h1>
      </header>

      <main className="flex flex-col bg-white flex-1">
        <FilterBar
          customerCode={customerCode}
          onCustomerCodeChange={setCustomerCode}
          materialDescription={materialDescription}
          onMaterialDescriptionChange={setMaterialDescription}
          onGo={handleGo}
          onClear={handleClear}
          loading={loading}
          selectedCount={selectedCount}
          canAct={canAct}
          isActing={isActing}
          pendingAction={pendingAction}
          onApprove={() => handleBulkAction('approve')}
          onReject={() => handleBulkAction('reject')}
          actionError={actionError}
        />

        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-10 pt-3 pb-6 min-h-0">
          {!hasSearched && !loading ? (
            <div className="flex-1 flex items-center justify-center text-center text-[#6a6d70]">
              <div>
                <div className="text-[15px] font-semibold mb-1">No data loaded</div>
                <div className="text-[13px]">
                  Enter a customer code and click <strong>Go</strong>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-[#6a6d70]">
              <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
              <span className="text-[14px]">Fetching data…</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">{error}</div>
            </div>
          ) : (
            // flex-1 + overflow-hidden here, table itself scrolls internally — page never scrolls
            <div
              className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col flex-1"
              style={{ minHeight: 0 }}
            >
              <DynamicTable
                dateColumns={dateColumns}
                rows={rows}
                selectedRowIds={selectedRowIds}
                onToggleRow={handleToggleRow}
                onToggleAll={handleToggleAll}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App