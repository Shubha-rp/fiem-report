import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function FilterBar({
    customerCode,
    onCustomerCodeChange,
    materialDescription,
    onMaterialDescriptionChange,
    onGo,
    onClear,
    loading,

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
    const handleKeyDown = (e) => { if (e.key === 'Enter') onGo() }

    const countLabel = selectedCount ? ` (${selectedCount})` : ''

    return (
        <div className="px-4 sm:px-6 lg:px-10 py-4 border-b border-[#e5e5e5] flex-shrink-0">
            <div className="flex flex-wrap items-end gap-3">

                <div className="w-full sm:w-auto sm:min-w-[220px]">
                    <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                        Customer Code <span className="text-[#cc1c14]">*</span>
                    </label>
                    <Input
                        value={customerCode}
                        onChange={(e) => onCustomerCodeChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter customer code"
                        className="h-10 text-[13px]"
                    />
                </div>

                <div className="w-full sm:w-auto sm:min-w-[260px]">
                    <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                        Material Description
                    </label>
                    <Input
                        value={materialDescription}
                        onChange={(e) => onMaterialDescriptionChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter material description"
                        className="h-10 text-[13px]"
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto flex-wrap">

                    <Button
                        onClick={onGo}
                        disabled={loading || isActing || !customerCode.trim()}
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

                    {/* Edit */}
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

                    {/* Approve */}
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
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                                Approve{countLabel}
                              </>
                        }
                    </button>

                </div>
            </div>

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
    )
}