const CONFIG = {
  Pending: { bg: 'bg-[#f5f6f7]', text: 'text-[#6a6d70]' },
  Approved: { bg: 'bg-[#e8f5ec]', text: 'text-[#107e3e]' },
  Rejected: { bg: 'bg-[#fce8e6]', text: 'text-[#cc1c14]' },
}

export default function StatusBadge({ status }) {
  const c = CONFIG[status] || CONFIG.Pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      {status}
    </span>
  )
}