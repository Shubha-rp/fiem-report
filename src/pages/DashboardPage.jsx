import { useState, useMemo } from 'react'
import FilterBar    from '@/components/FilterBar'
import DynamicTable from '@/components/DynamicTable'
import {
    fetchDashboard,
    postBulkAction,
    fetchCustomerF4,
    fetchSalesDocumentF4,
    fetchMaterialF4,
    fetchPlantF4,
} from '@/lib/dashboardApi'

const todayIso = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const monthsAgoIso = (n) => {
    const d = new Date()
    d.setMonth(d.getMonth() - n)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DashboardPage() {
    // ── F4 filter state — arrays ──
    const [customerCode, setCustomerCode] = useState([])
    const [vbeln,        setVbeln]        = useState([])
    const [matnr,        setMatnr]        = useState([])
    const [werks,        setWerks]        = useState([])

    // ── Date range (client-side filter only) ──
    const [dateFrom, setDateFrom] = useState(monthsAgoIso(1))
    const [dateTo,   setDateTo]   = useState(todayIso())

    // ── Value help modal state ──
    const [vhModal,   setVhModal]   = useState(null)
    const [vhOptions, setVhOptions] = useState([])

    // ── Table data ──
    const [dateColumns, setDateColumns] = useState([])
    const [allRows,     setAllRows]     = useState([])

    const rows = useMemo(() => {
        const baseRows = allRows.filter(r => r.status === '' && r.approve === 'R')

        if (!dateFrom && !dateTo) return baseRows

        return baseRows.filter(r => {
            const rowDates = Object.keys(r.dateLines)
            if (!rowDates.length) return false
            return rowDates.some(dateKey => {
                if (dateFrom && dateKey < dateFrom) return false
                if (dateTo   && dateKey > dateTo)   return false
                return true
            })
        })
    }, [allRows, dateFrom, dateTo])

    const [loading,     setLoading]     = useState(false)
    const [error,       setError]       = useState(null)
    const [hasSearched, setHasSearched] = useState(false)

    const [selectedRowIds, setSelectedRowIds] = useState(new Set())
    const [isActing,       setIsActing]       = useState(false)
    const [pendingAction,  setPendingAction]  = useState(null)
    const [actionError,    setActionError]    = useState(null)
    const [actionSuccess,  setActionSuccess]  = useState(null)

    const [editingRowIds, setEditingRowIds] = useState(new Set())
    const [editValues,    setEditValues]    = useState({})

    const selectedCount = selectedRowIds.size
    const canAct        = selectedCount > 0 && !isActing

    // ── Open Value Help ──
    const openVh = async (field) => {
        setVhModal(field)
        setVhOptions([])
        try {
            let opts = []
            switch (field) {
                case 'customer': opts = await fetchCustomerF4();      break
                case 'salesDoc': opts = await fetchSalesDocumentF4(); break
                case 'material': opts = await fetchMaterialF4();       break
                case 'plant':    opts = await fetchPlantF4();          break
                default:         opts = []
            }
            setVhOptions(opts)
        } catch {
            setVhOptions([])
        }
    }

    const handleVhCancel = () => setVhModal(null)

    // ── Go ──
    const handleGo = async () => {
        setLoading(true)
        setError(null)
        setActionError(null)
        setActionSuccess(null)
        setSelectedRowIds(new Set())
        setEditingRowIds(new Set())
        setEditValues({})
        try {
            const data = await fetchDashboard({
                customerCode,
                vbeln,
                matnr,
                werks,
            })
            setDateColumns(data.dateColumns)
            setAllRows(data.rows)
            setHasSearched(true)
        } catch (err) {
            setError(err.message || 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    // ── Clear ──
    const handleClear = () => {
        setCustomerCode([]); setVbeln([]); setMatnr([]); setWerks([])
        setDateFrom(monthsAgoIso(1)); setDateTo(todayIso())
        setDateColumns([]); setAllRows([])
        setHasSearched(false); setError(null)
        setSelectedRowIds(new Set())
        setActionError(null); setActionSuccess(null)
        setEditingRowIds(new Set()); setEditValues({})
    }

    const handleToggleRow = (rowId) => {
        setActionError(null)
        setActionSuccess(null)
        setSelectedRowIds((prev) => {
            const next = new Set(prev)
            next.has(rowId) ? next.delete(rowId) : next.add(rowId)
            return next
        })
    }

    const handleToggleAll = () => {
        setActionError(null)
        setActionSuccess(null)
        const selectableIds = rows.filter(r => !editingRowIds.has(r.id)).map(r => r.id)
        const allSelected   = selectableIds.every(id => selectedRowIds.has(id))
        setSelectedRowIds(allSelected ? new Set() : new Set(selectableIds))
    }

    const handleEdit = () => {
        const newEditingIds = new Set(editingRowIds)
        const newEditValues = { ...editValues }
        rows.forEach((r) => {
            if (selectedRowIds.has(r.id)) {
                newEditingIds.add(r.id)
                if (!newEditValues[r.id]) newEditValues[r.id] = { ...r.values }
            }
        })
        setEditingRowIds(newEditingIds)
        setEditValues(newEditValues)
        setSelectedRowIds((prev) => {
            const next = new Set(prev)
            rows.forEach(r => { if (selectedRowIds.has(r.id)) next.delete(r.id) })
            return next
        })
    }

    const handleEditCellChange = (rowId, colKey, value) => {
        setEditValues((prev) => ({
            ...prev,
            [rowId]: { ...prev[rowId], [colKey]: value },
        }))
    }

    const handleSaveRow = (rowId) => {
        const edits = editValues[rowId] ?? {}
        setAllRows((current) =>
            current.map((r) => {
                if (r.id !== rowId) return r
                const newValues    = { ...r.values, ...edits }
                const newDateLines = { ...r.dateLines }
                Object.entries(edits).forEach(([dateKey, val]) => {
                    if (newDateLines[dateKey]) {
                        newDateLines[dateKey] = { ...newDateLines[dateKey], wmeng: String(val) }
                    }
                })
                return { ...r, values: newValues, dateLines: newDateLines }
            })
        )
        setEditingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next })
        setSelectedRowIds((prev) => new Set([...prev, rowId]))
    }

    const handleCancelRow = (rowId) => {
        setEditingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next })
        setEditValues((prev)    => { const next = { ...prev }; delete next[rowId]; return next })
    }

    const handleBulkAction = async (action) => {
        const targetRows = rows.filter(r => selectedRowIds.has(r.id))
        if (!targetRows.length) return

        if (targetRows.some(r => editingRowIds.has(r.id))) {
            setActionError('Save or cancel open edits before approving.')
            return
        }

        setActionError(null)
        setActionSuccess(null)
        setIsActing(true)
        setPendingAction(action)

        try {
            await postBulkAction({ rows: targetRows, action, editValues })

            const actedIds = new Set(targetRows.map(r => r.id))
            setAllRows(prev        => prev.filter(r => !actedIds.has(r.id)))
            setSelectedRowIds(prev => { const n = new Set(prev); actedIds.forEach(id => n.delete(id)); return n })
            setEditValues(prev     => { const n = { ...prev };   actedIds.forEach(id => delete n[id]); return n })
            setEditingRowIds(prev  => { const n = new Set(prev); actedIds.forEach(id => n.delete(id)); return n })

            setActionSuccess(
                `${targetRows.length} row${targetRows.length > 1 ? 's' : ''} approved successfully.`
            )
        } catch (err) {
            setActionError(err.message || 'Action failed — please try again.')
        } finally {
            setIsActing(false)
            setPendingAction(null)
        }
    }

    return (
        <main className="flex flex-col bg-white flex-1">
            <FilterBar
                customerCode={customerCode}
                onCustomerCodeChange={setCustomerCode}
                vbeln={vbeln}
                onVbelnChange={setVbeln}
                matnr={matnr}
                onMatnrChange={setMatnr}
                werks={werks}
                onWerksChange={setWerks}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                onGo={handleGo}
                onClear={handleClear}
                loading={loading}
                vhModal={vhModal}
                vhOptions={vhOptions}
                onOpenVh={openVh}
                onVhCancel={handleVhCancel}
                selectedCount={selectedCount}
                canAct={canAct}
                isActing={isActing}
                pendingAction={pendingAction}
                onEdit={handleEdit}
                onApprove={() => handleBulkAction('A')}
                editingCount={editingRowIds.size}
                actionError={actionError}
                actionSuccess={actionSuccess}
            />

            <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-10 pt-3 pb-6 min-h-0">
                {!hasSearched && !loading ? (
                    <div className="flex-1 flex items-center justify-center text-center text-[#6a6d70]">
                        <div>
                            <div className="text-[15px] font-semibold mb-1">No data loaded</div>
                            <div className="text-[13px]">Select a customer and click <strong>Go</strong></div>
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
                    <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col flex-1" style={{ minHeight: 0 }}>
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
    )
}