const CONFIG = {
  '': { bg: 'bg-[#f5f6f7]', text: 'text-[#6a6d70]', label: 'Pending' },
  A: { bg: 'bg-[#e8f5ec]', text: 'text-[#107e3e]', label: 'Approved' },
  R: { bg: 'bg-[#fce8e6]', text: 'text-[#cc1c14]', label: 'Rejected' },
  X: { bg: 'bg-[#e8f0fb]', text: 'text-[#0854a0]', label: 'Posted' },
}

export default function StatusBadge({ status }) {
  const c = CONFIG[status] ?? CONFIG['']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}