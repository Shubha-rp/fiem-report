import { generateMockDashboard } from './mockData'

// const SRV = '/sap/opu/odata/shiv/<SERVICE_NAME_TBD>'
// const authConfig = { loginId: '<your-id>', loginType: 'E' }

const SIMULATED_LATENCY = 600

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Go button — fetch the schedule table for a customer.
// Real version should look roughly like AsnReportApi.fetchReport():
// build an OData $filter from customerCode/materialDescription, fetch,
// then map the raw OData rows + the backend's dynamic column list into
// { dateColumns, rows } the same way mockData.js does here.
export async function fetchDashboard({ customerCode, materialDescription } = {}) {
  await delay(SIMULATED_LATENCY)

  if (!customerCode || !customerCode.trim()) {
    throw new Error('Customer code is required')
  }

  // TODO — replace with:
  // const f = buildFilter({ CustomerCode: customerCode }, { MaterialDescription: materialDescription })
  // const data = await odata(`/ScheduleSet?$filter=${f}`)
  // return mapDashboardResponse(data)

  return generateMockDashboard({ customerCode, materialDescription })
}

// Approve / Reject — POST a single row's decision back to the backend.
// action is 'approve' | 'reject'.
export async function postRowAction({ rowId, action, remarks = '' } = {}) {
  await delay(450)

  // TODO — replace with:
  // const res = await fetch(`${SRV}/ApprovalSet`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Loginid: authConfig.loginId,
  //     Logintype: authConfig.loginType,
  //   },
  //   credentials: 'include',
  //   body: JSON.stringify({ RowId: rowId, Action: action, Remarks: remarks }),
  // })
  // if (!res.ok) throw new Error(`OData ${res.status}`)
  // return res.json()

  // Mock occasionally fails so the UI's error handling has something
  // real to show — remove once the real endpoint exists.
  if (Math.random() < 0.05) {
    throw new Error('Backend rejected the update. Please retry.')
  }

  return { rowId, status: action === 'approve' ? 'Approved' : 'Rejected' }
}