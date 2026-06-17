const SRV = '/sap/opu/odata/SAP/ZSALES_SCHEDULE_SRV'

function parseSapDate(dateStr) {
    if (!dateStr) return null
    const match = dateStr.match(/\/Date\((\d+)\)\//)
    if (!match) return null
    return new Date(parseInt(match[1]))
}

function formatDateLabel(date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatDateKey(date) {
    return date.toISOString().split('T')[0]
}

function mapSapResponse(results) {
    const rowMap = new Map()
    const dateKeySet = new Map()

    results.forEach((item) => {
        // Full composite key — all four fields form the unique key in SAP
        const rowKey = `${item.Kunnr}|${item.Vbeln}|${item.Posnr}|${item.Matnr}`

        if (!rowMap.has(rowKey)) {
            rowMap.set(rowKey, {
                id: rowKey,
                kunnr: item.Kunnr,   // store so PATCH can use correct Kunnr
                edatu: item.Edatu,
                so: item.Vbeln,
                li: item.Posnr,
                sap: item.Matnr,
                materialDescription: item.Postx,
                plt: item.Werks,
                cp: item.Ettyp,
                status: item.Status ?? '',
                approve: item.approve ?? '',
                values: {},
            })
        }

        const date = parseSapDate(item.Edatu)
        if (date) {
            const key = formatDateKey(date)
            const label = formatDateLabel(date)
            if (!dateKeySet.has(key)) dateKeySet.set(key, label)
            rowMap.get(rowKey).values[key] = parseFloat(item.Wmeng) || ''
        }
    })

    const sortedDateKeys = [...dateKeySet.keys()].sort()
    const dateColumns = sortedDateKeys.map((key) => ({ key, label: dateKeySet.get(key) }))

    // Only rows where bot posted but no action taken yet
    const rows = [...rowMap.values()].filter((r) => r.status === '' && r.approve === '')

    return { dateColumns, rows }
}

export async function fetchDashboard({ customerCode, materialDescription } = {}) {
    if (!customerCode || !customerCode.trim()) {
        throw new Error('Customer code is required')
    }

    // Build filter — using Kunnr eq for exact match
    const filters = [`Kunnr eq '${customerCode.trim()}'`]
    if (materialDescription && materialDescription.trim()) {
        filters.push(`substringof('${materialDescription.trim()}',Postx)`)
    }
    const filter = filters.join(' and ')

    const url = `${SRV}/itemSet?$filter=${encodeURIComponent(filter)}&$format=json`

    console.log('[fetchDashboard] GET', url)  // remove after testing

    const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
    })

    if (!res.ok) {
        throw new Error(`SAP returned ${res.status} — ${res.statusText}`)
    }

    const data = await res.json()
    const results = data?.d?.results ?? []

    console.log('[fetchDashboard] raw results count:', results.length)  // remove after testing
    console.log('[fetchDashboard] sample:', results[0])                 // remove after testing

    return mapSapResponse(results)
}

export async function postRowAction({ rowId, action, kunnr, vbeln, posnr, matnr, edatu } = {}) {
    const approve = action === 'approve' ? 'A' : 'R'

    // Step 1: fetch CSRF token
    const tokenRes = await fetch(`${SRV}/itemSet?$top=0`, {
        method: 'GET',
        headers: {
            'x-csrf-token': 'Fetch',
            Accept: 'application/json',
        },
        credentials: 'include',
    })
    const csrfToken = tokenRes.headers.get('x-csrf-token')

    if (!csrfToken) {
        throw new Error('Could not retrieve CSRF token from SAP')
    }

    // Step 2: PATCH using full composite key
    // Edatu needs to be passed in datetime format if present, blank if not
    const edatuPart = edatu ? `,Edatu=datetime'${edatu}'` : `,Edatu=`
    const entityKey = `itemSet(Kunnr='${kunnr}',Vbeln='${vbeln}',Posnr='${posnr}',Matnr='${matnr}'${edatuPart})`

    console.log('[postRowAction] PATCH', `${SRV}/${entityKey}`)  // remove after testing

    const res = await fetch(`${SRV}/${entityKey}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ approve }),
    })

    if (!res.ok) {
        throw new Error(`SAP update failed — ${res.status} ${res.statusText}`)
    }

    return { rowId, approve, status: approve === 'A' ? 'X' : '' }
}