import { useState } from 'react'
import FilterBar from '@/components/FilterBar'
import DynamicTable from '@/components/DynamicTable'
import { fetchDashboard, postRowAction } from '@/lib/dashboardApi'

export default function DashboardPage() {
    const [customerCode, setCustomerCode] = useState('')
    const [materialDescription, setMaterialDescription] = useState('')

    const [dateColumns, setDateColumns] = useState([])
    const [rows, setRows] = useState([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasSearched, setHasSearched] = useState(false)

    const [selectedRowIds, setSelectedRowIds] = useState(new Set())
    const [isActing, setIsActing] = useState(false)
    const [pendingAction, setPendingAction] = useState(null)
    const [actionError, setActionError] = useState(null)

    // Edit state
    const [editingRowIds, setEditingRowIds] = useState(new Set())
    const [editValues, setEditValues] = useState({})

    const selectedCount = selectedRowIds.size
    const canAct = selectedCount > 0 && !isActing && editingRowIds.size === 0
    const canEdit = selectedCount > 0 && !isActing && editingRowIds.size === 0

    const handleGo = async () => {
        setLoading(true)
        setError(null)
        setSelectedRowIds(new Set())
        setActionError(null)
        setEditingRowIds(new Set())
        setEditValues({})
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
        setEditingRowIds(new Set())
        setEditValues({})
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

    const handleEdit = () => {
        const newEditingIds = new Set(editingRowIds)
        const newEditValues = { ...editValues }
        rows.forEach((r) => {
            if (selectedRowIds.has(r.id) && r.status === 'Pending') {
                newEditingIds.add(r.id)
                if (!newEditValues[r.id]) {
                    newEditValues[r.id] = { ...r.values }
                }
            }
        })
        setEditingRowIds(newEditingIds)
        setEditValues(newEditValues)
    }

    const handleEditCellChange = (rowId, colKey, value) => {
        setEditValues((prev) => ({
            ...prev,
            [rowId]: { ...prev[rowId], [colKey]: value },
        }))
    }

    const handleSaveRow = (rowId) => {
        setRows((current) =>
            current.map((r) =>
                r.id === rowId ? { ...r, values: { ...r.values, ...editValues[rowId] } } : r,
            ),
        )
        setEditingRowIds((prev) => {
            const next = new Set(prev)
            next.delete(rowId)
            return next
        })
        setEditValues((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
        })
    }

    const handleCancelRow = (rowId) => {
        setEditingRowIds((prev) => {
            const next = new Set(prev)
            next.delete(rowId)
            return next
        })
        setEditValues((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
        })
    }

    const handleBulkAction = async (action) => {
        const targetRows = rows.filter((r) => selectedRowIds.has(r.id) && r.status === '' && r.approve === '')
        if (!targetRows.length) return

        setActionError(null)
        setIsActing(true)
        setPendingAction(action)

        const results = await Promise.allSettled(
            targetRows.map((row) => postRowAction({
                rowId: row.id,
                action,
                kunnr: row.kunnr,
                vbeln: row.so,
                posnr: row.li,
                matnr: row.sap,
                edatu: row.edatu ?? '',   // pass raw edatu stored on row
            })),
        )

        const updatesById = {}
        let failureCount = 0

        results.forEach((result, idx) => {
            const rowId = targetRows[idx].id
            if (result.status === 'fulfilled') {
                updatesById[rowId] = {
                    approve: result.value.approve,
                    status: result.value.status,
                }
            } else {
                failureCount += 1
                console.error('[handleBulkAction] row failed:', targetRows[idx].id, result.reason)
            }
        })

        if (Object.keys(updatesById).length) {
            setRows((current) => current.filter((r) => !updatesById[r.id]))
        }

        setSelectedRowIds((current) => {
            const next = new Set(current)
            Object.keys(updatesById).forEach((id) => next.delete(id))
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
                    canEdit={canEdit}
                    onEdit={handleEdit}
                    editingCount={editingRowIds.size}
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
                                editingRowIds={editingRowIds}
                                editValues={editValues}
                                onEditCellChange={handleEditCellChange}
                                onSaveRow={handleSaveRow}
                                onCancelRow={handleCancelRow}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}