import { Input } from '@/components/ui/input'
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
  onApprove,
  onReject,
  actionError,
  canEdit,
  onEdit,
  editingCount,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onGo()
  }

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

        <div className="flex items-center gap-2 ml-auto">
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

          <button
            type="button"
            onClick={onEdit}
            disabled={!canEdit}
            className={`px-4 h-10 text-[13px] font-semibold rounded-lg transition-all ${
              canEdit
                ? 'text-white bg-[#e76500] hover:bg-[#c45400]'
                : 'text-[#a8aaac] bg-[#e5e5e5] cursor-not-allowed'
            }`}
          >
            {editingCount ? `Editing (${editingCount})` : `Edit${selectedCount ? ` (${selectedCount})` : ''}`}
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={!canAct}
            className={`px-4 h-10 text-[13px] font-semibold rounded-lg transition-all ${
              canAct
                ? 'text-white bg-[#107e3e] hover:bg-[#0c632f]'
                : 'text-[#a8aaac] bg-[#e5e5e5] cursor-not-allowed'
            }`}
          >
            {isActing && pendingAction === 'approve' ? 'Approving…' : `Approve${selectedCount ? ` (${selectedCount})` : ''}`}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={!canAct}
            className={`px-4 h-10 text-[13px] font-semibold rounded-lg transition-all ${
              canAct
                ? 'text-white bg-[#cc1c14] hover:bg-[#a8160f]'
                : 'text-[#a8aaac] bg-[#e5e5e5] cursor-not-allowed'
            }`}
          >
            {isActing && pendingAction === 'reject' ? 'Rejecting…' : `Reject${selectedCount ? ` (${selectedCount})` : ''}`}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mt-2 text-[12px] text-[#cc1c14]">{actionError}</div>
      )}
    </div>
  )
}