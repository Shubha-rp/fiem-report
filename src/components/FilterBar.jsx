import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'

// ── Value Help Modal ──────────────────────────────────────────
function ValueHelpModal({ title, options, onSelect, onCancel }) {
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        if (!search) return options
        const q = search.toLowerCase()
        return options.filter(o =>
            o.code.toLowerCase().includes(q) ||
            (o.label && o.label.toLowerCase().includes(q))
        )
    }, [options, search])

    useEffect(() => {
        const h = e => { if (e.key === 'Escape') onCancel() }
        document.addEventListener('keydown', h)
        return () => document.removeEventListener('keydown', h)
    }, [onCancel])

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] flex flex-col overflow-hidden"
                style={{ maxHeight: '70vh', animation: 'modalIn 0.2s ease-out both' }}>

                <div className="px-5 py-4 border-b border-[#e5e5e5]">
                    <h3 className="text-[16px] font-semibold text-[#32363a]">{title}</h3>
                </div>

                <div className="px-4 py-3 border-b border-[#e5e5e5]">
                    <div className="relative">
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search"
                            className="w-full h-9 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                        />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            className="absolute right-3 top-2.5 text-[#6a6d70]">
                            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {filtered.length === 0
                        ? <div className="py-10 text-center text-[13px] text-[#6a6d70]">No results found</div>
                        : filtered.map(opt => (
                            <button key={opt.code} onClick={() => onSelect(opt)}
                                className="w-full text-left px-5 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] transition-colors">
                                <div className="text-[14px] font-semibold text-[#0a6ed1]">{opt.code}</div>
                                {opt.label && <div className="text-[12px] text-[#6a6d70] mt-0.5">{opt.label}</div>}
                            </button>
                        ))
                    }
                </div>

                <div className="px-5 py-3 border-t border-[#e5e5e5] flex justify-end">
                    <button onClick={onCancel}
                        className="px-5 h-9 text-[14px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── VhInput ───────────────────────────────────────────────────
function VhInput({ placeholder, value, onOpen }) {
    return (
        <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
            <div className="flex-1 flex items-center pl-3 text-[13px] truncate min-w-0 select-none">
                {value
                    ? <span className="font-medium text-[#32363a] truncate">{value}</span>
                    : <span className="text-[#94a3b8]">{placeholder}</span>
                }
            </div>
            <button type="button" onClick={onOpen} title="Open value help"
                className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
            </button>
        </div>
    )
}

// ── FilterBar ─────────────────────────────────────────────────
export default function FilterBar({
    // F4 filter values
    customerCode,
    onCustomerCodeChange,
    vbeln,
    onVbelnChange,
    matnr,
    onMatnrChange,
    werks,
    onWerksChange,
    // Date range (client-side only)
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    // Go / Clear
    onGo,
    onClear,
    loading,
    // VH options + open handler (owned by DashboardPage)
    vhModal,
    vhOptions,
    onOpenVh,
    onVhSelect,
    onVhCancel,
    // Action bar
    selectedCount,
    canAct,
    isActing,
    pendingAction,
    onEdit,
    onApprove,
    editingCount,
    actionError,
    actionSuccess,
}) {
    const countLabel = selectedCount ? ` (${selectedCount})` : ''

    const dateError = useMemo(() => {
        if (!dateFrom || !dateTo) return null
        return new Date(dateFrom) > new Date(dateTo) ? 'From date must be before To date' : null
    }, [dateFrom, dateTo])

    const VH_TITLES = {
        customer:    'Customer',
        salesDoc:    'Sales Document',
        material:    'Material',
        plant:       'Plant',
    }

    return (
        <>
            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.94); }
                    to   { opacity: 1; transform: scale(1);    }
                }
            `}</style>

            {vhModal && (
                <ValueHelpModal
                    title={VH_TITLES[vhModal]}
                    options={vhOptions}
                    onSelect={onVhSelect}
                    onCancel={onVhCancel}
                />
            )}

            <div className="px-4 sm:px-6 lg:px-10 py-4 border-b border-[#e5e5e5] flex-shrink-0">

                {/* Row 1 — F4 filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">

                    <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                            Customer <span className="text-[#cc1c14]">*</span>
                        </label>
                        <VhInput
                            placeholder="Select Customer"
                            value={customerCode}
                            onOpen={() => onOpenVh('customer')}
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                            Sales Document
                        </label>
                        <VhInput
                            placeholder="Select Sales Doc."
                            value={vbeln}
                            onOpen={() => onOpenVh('salesDoc')}
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                            Material
                        </label>
                        <VhInput
                            placeholder="Select Material"
                            value={matnr}
                            onOpen={() => onOpenVh('material')}
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                            Plant
                        </label>
                        <VhInput
                            placeholder="Select Plant"
                            value={werks}
                            onOpen={() => onOpenVh('plant')}
                        />
                    </div>
                </div>

                {/* Row 2 — Date range + action buttons */}
                <div className="flex flex-wrap items-end gap-3">

                    <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                            Date From
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => onDateFromChange(e.target.value)}
                                max={dateTo || undefined}
                                className={`h-10 pl-3 pr-8 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${
                                    dateError
                                        ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20'
                                        : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                                }`}
                            />
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <path d="M16 2v4M8 2v4M3 10h18"/>
                            </svg>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                            Date To
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => onDateToChange(e.target.value)}
                                min={dateFrom || undefined}
                                className={`h-10 pl-3 pr-8 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${
                                    dateError
                                        ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20'
                                        : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                                }`}
                            />
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <path d="M16 2v4M8 2v4M3 10h18"/>
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto flex-wrap">

                        <Button
                            onClick={onGo}
                            disabled={loading || isActing || !customerCode.trim() || !!dateError}
                            className="h-10 bg-[#0a6ed1] hover:bg-[#085caf] text-white"
                        >
                            {loading ? 'Loading…' : 'Go'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClear}
                            disabled={loading || isActing}
                            className="h-10"
                        >
                            Clear
                        </Button>

                        <div className="w-px h-9 bg-[#e5e5e5] mx-1" />

                        <button
                            type="button"
                            onClick={onEdit}
                            disabled={!canAct || isActing}
                            className={`flex items-center gap-1.5 px-4 h-10 text-[13px] font-semibold rounded-lg transition-all ${
                                canAct && !isActing
                                    ? 'text-white bg-[#e76500] hover:bg-[#c45400]'
                                    : 'text-[#a8aaac] bg-[#e5e5e5] cursor-not-allowed'
                            }`}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                            </svg>
                            {editingCount > 0 ? `Editing (${editingCount})` : `Edit${countLabel}`}
                        </button>

                        <button
                            type="button"
                            onClick={onApprove}
                            disabled={!canAct || isActing || editingCount > 0}
                            title={editingCount > 0 ? 'Save all edits before approving' : ''}
                            className={`flex items-center gap-1.5 px-4 h-10 text-[13px] font-semibold rounded-lg transition-all ${
                                canAct && !isActing && editingCount === 0
                                    ? 'text-white bg-[#107e3e] hover:bg-[#0c632f]'
                                    : 'text-[#a8aaac] bg-[#e5e5e5] cursor-not-allowed'
                            }`}
                        >
                            {isActing && pendingAction === 'A'
                                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Approving…</>
                                : <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 6 9 17l-5-5"/>
                                    </svg>
                                    Approve{countLabel}
                                  </>
                            }
                        </button>

                    </div>
                </div>

                {dateError && (
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#cc1c14]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                        </svg>
                        {dateError}
                    </div>
                )}
                {actionSuccess && !actionError && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#107e3e]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>
                        </svg>
                        {actionSuccess}
                    </div>
                )}
                {actionError && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#cc1c14]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                        </svg>
                        {actionError}
                    </div>
                )}
                {editingCount > 0 && !actionError && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#e76500]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                        </svg>
                        {editingCount} row{editingCount > 1 ? 's' : ''} in edit mode — save before approving
                    </div>
                )}
            </div>
        </>
    )
}