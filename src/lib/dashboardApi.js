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
        const rowKey = `${item.Kunnr}|${item.Vbeln}|${item.Posnr}|${item.Matnr}`

        if (!rowMap.has(rowKey)) {
            rowMap.set(rowKey, {
                id:                  rowKey,
                kunnr:               item.Kunnr   ?? '',
                vbeln:               item.Vbeln   ?? '',
                posnr:               item.Posnr   ?? '',
                matnr:               item.Matnr   ?? '',
                postx:               item.Postx   ?? '',
                werks:               item.Werks   ?? '',
                ettyp:               item.Ettyp   ?? '',
                edatu:               item.Edatu   ?? '',
                so:                  item.Vbeln   ?? '',
                li:                  item.Posnr   ?? '',
                sap:                 item.Matnr   ?? '',
                materialDescription: item.Postx   ?? '',
                plt:                 item.Werks   ?? '',
                cp:                  item.Ettyp   ?? '',
                status:              item.Status  ?? '',
                approve:             item.approve ?? '',
                values: {},
                dateLines: {},  // date key → { edatu: rawSapString, wmeng: stringValue }
            })
        }

        const date = parseSapDate(item.Edatu)
        if (date) {
            const key   = formatDateKey(date)
            const label = formatDateLabel(date)
            if (!dateKeySet.has(key)) dateKeySet.set(key, label)
            rowMap.get(rowKey).values[key]    = parseFloat(item.Wmeng) || 0
            rowMap.get(rowKey).dateLines[key] = {
                edatu: item.Edatu,               // original SAP date string — sent back as-is
                wmeng: String(item.Wmeng ?? '0'), // always a non-empty string
            }
        }
    })

    const sortedDateKeys = [...dateKeySet.keys()].sort()
    const dateColumns    = sortedDateKeys.map((key) => ({ key, label: dateKeySet.get(key) }))
    const rows           = [...rowMap.values()]

    return { dateColumns, rows }
}

export async function fetchDashboard({ customerCode, materialDescription } = {}) {
    if (!customerCode?.trim()) throw new Error('Customer code is required')

    const filters = [`Kunnr eq '${customerCode.trim()}'`]
    if (materialDescription?.trim()) {
        filters.push(`substringof('${materialDescription.trim()}',Postx)`)
    }

    const url = `${SRV}/itemSet?$filter=${encodeURIComponent(filters.join(' and '))}&$format=json`
    console.log('[fetchDashboard] GET', url)

    const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
    })

    if (!res.ok) throw new Error(`SAP returned ${res.status} — ${res.statusText}`)

    const data    = await res.json()
    const results = data?.d?.results ?? []

    console.log('[fetchDashboard] raw count:', results.length)
    console.log('[fetchDashboard] sample:', results[0])

    return mapSapResponse(results)
}

// ── CSRF token ────────────────────────────────────────────────
async function getCsrfToken() {
    const res = await fetch(`${SRV}/itemSet?$top=0`, {
        method: 'GET',
        headers: { 'x-csrf-token': 'Fetch', Accept: 'application/json' },
        credentials: 'include',
    })
    const token = res.headers.get('x-csrf-token')
    if (!token) throw new Error('Could not retrieve CSRF token from SAP')
    return token
}

// ── Deep-entity POST to headerSet ─────────────────────────────
// rows      : array of full row objects from state
// action    : 'A' (approve) | 'R' (reject)
// editValues: { [rowId]: { [dateKey]: value } }  — User 2 staged edits
//
// Payload per backend spec:
// { "Vbeln": "", "itemSet": [{ Vbeln, Posnr, Matnr, Postx, Werks, Ettyp, Kunnr, Edatu, Wmeng, Status:"", approve }] }
// Status is NEVER set by the frontend — always sent as "".
// One itemSet entry per date line per row — mirrors original OData structure.
// Wmeng: edited value if User 2 changed it, otherwise original value from SAP. Never blank.

export async function postBulkAction({ rows, action, editValues = {} }) {
    const csrfToken = await getCsrfToken()

    const itemSet = []

    rows.forEach((row) => {
        const edited = editValues[row.id]  // { [dateKey]: newValue } or undefined

        Object.entries(row.dateLines).forEach(([dateKey, line]) => {
            // Use edited value if present and non-empty, otherwise use original from SAP
            const wmeng = (edited && edited[dateKey] !== undefined && edited[dateKey] !== '')
                ? String(edited[dateKey])
                : line.wmeng   // original — always a non-empty string

            itemSet.push({
                Vbeln:   row.vbeln,
                Posnr:   row.posnr,
                Matnr:   row.matnr,
                Postx:   row.postx,
                Werks:   row.werks,
                Ettyp:   row.ettyp,
                Kunnr:   row.kunnr,
                Edatu:   line.edatu,  // original SAP date string sent back as-is
                Wmeng:   wmeng,       // always non-empty
                Status:  '',         
                approve: action,
            })
        })
    })

    const payload = { Vbeln: '', itemSet }

    console.log('[postBulkAction] POST to headerSet:', JSON.stringify(payload, null, 2))

    const res = await fetch(`${SRV}/headerSet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept:         'application/json',
            'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
    })

    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`SAP POST failed — ${res.status} : ${text.slice(0, 400)}`)
    }

    if (res.status === 204) return { success: true }
    return res.json()
}