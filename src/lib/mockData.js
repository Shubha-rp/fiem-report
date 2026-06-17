const PLANTS = ['P101', 'P102', 'P103']

const MATERIALS = [
  'Steering Wheel Assy - Std',
  'Brake Caliper LH',
  'Wiring Harness - Front',
  'Fuel Tank Cap',
  'Door Hinge Set',
  'Headlamp Assembly',
]

function pad(n) {
  return String(n).padStart(2, '0')
}

// Builds a sample of date columns across `monthsToShow` months, similar
// to the 1/5/2026, 2/5/2026, 3/5/2026... columns in the Excel mockup.
function buildDateColumns(monthsToShow) {
  const columns = []
  const start = new Date()
  start.setDate(1)

  for (let m = 0; m < monthsToShow; m++) {
    const month = new Date(start.getFullYear(), start.getMonth() + m, 1)
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const sampleDays = [1, 2, 3, 10, 20, daysInMonth].filter((d) => d <= daysInMonth)

    sampleDays.forEach((day) => {
      const d = new Date(month.getFullYear(), month.getMonth(), day)
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      const label = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
      columns.push({ key, label })
    })
  }
  return columns
}

export function generateMockDashboard({ customerCode, materialDescription }) {
  // The real backend decides how many date columns exist for a given
  // customer/material combo. We vary the count here just to exercise
  // that "dynamic columns" behaviour in the UI.
  const monthsToShow = 2 + (customerCode.length % 2)
  const dateColumns = buildDateColumns(monthsToShow)

  const filteredMaterials = materialDescription
    ? MATERIALS.filter((m) => m.toLowerCase().includes(materialDescription.toLowerCase()))
    : MATERIALS

  const rows = filteredMaterials.map((material, idx) => {
    const values = {}
    dateColumns.forEach((col) => {
      // not every cell has a planned quantity, same as a real schedule
      values[col.key] = Math.random() < 0.35 ? '' : Math.round(Math.random() * 500)
    })

    return {
      id: `${customerCode}-${idx + 1}`,
  so: `45${1000 + idx}`,
  li: String(idx + 1),
  sap: `100${2000 + idx}`,
  materialDescription: material,
  plt: PLANTS[idx % PLANTS.length],
  cp: idx % 2 === 0 ? 'CP01' : 'CP02',
  status: '',    // '' until BAPI posts → 'X'
  approve: '',   // '' | 'A' | 'R'
  values,
    }
  })

  return { dateColumns, rows }
}