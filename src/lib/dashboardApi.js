const SRV = '/sap/opu/odata/SAP/ZSALES_SCHEDULE_SRV'

function parseSapDate(dateStr) {
    if (!dateStr) return null
    const yyyymmdd = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/)
    if (yyyymmdd) {
        const [, year, month, day] = yyyymmdd
        if (dateStr === '00000000') return null
        return new Date(Number(year), Number(month) - 1, Number(day))
    }
    const epochMatch = dateStr.match(/\/Date\((\d+)\)\//)
    if (epochMatch) return new Date(parseInt(epochMatch[1]))
    return null
}

function formatDateLabel(date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatDateKey(date) {
    return date.toISOString().split('T')[0]
}

function mapSapResponse(results) {
    const rowMap     = new Map()
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
                values:    {},
                dateLines: {},
            })
        }

        const date = parseSapDate(item.Edatu)
        // Skip lines with invalid/zero dates entirely
        if (!date) return

        const key   = formatDateKey(date)
        const label = formatDateLabel(date)
        if (!dateKeySet.has(key)) dateKeySet.set(key, label)

        const wmengNum = parseFloat(item.Wmeng)
        rowMap.get(rowKey).values[key]    = isNaN(wmengNum) ? null : wmengNum
        rowMap.get(rowKey).dateLines[key] = {
            edatu: item.Edatu,
            wmeng: String(item.Wmeng ?? '0'),
        }
    })

    const sortedDateKeys = [...dateKeySet.keys()].sort()
    const dateColumns    = sortedDateKeys.map((key) => ({ key, label: dateKeySet.get(key) }))

    // Exclude rows with no valid date lines at all
    const rows = [...rowMap.values()].filter(r => Object.keys(r.dateLines).length > 0)

    return { dateColumns, rows }
}

export async function fetchDashboard({ customerCode, materialDescription, vbeln, matnr, werks } = {}) {
    if (!customerCode?.trim()) throw new Error('Customer code is required')

    const filters = [`Kunnr eq '${customerCode.trim()}'`]
    if (materialDescription?.trim()) filters.push(`substringof('${materialDescription.trim()}',Postx)`)
    if (vbeln?.trim())               filters.push(`Vbeln eq '${vbeln.trim()}'`)
    if (matnr?.trim())               filters.push(`Matnr eq '${matnr.trim()}'`)
    if (werks?.trim())               filters.push(`Werks eq '${werks.trim()}'`)
    filters.push(`type eq 'B'`)

    const url = `${SRV}/itemSet?$filter=${encodeURIComponent(filters.join(' and '))}&$format=json`
    console.log('[fetchDashboard] GET', url)

    const res = await fetch(url, {
        method:      'GET',
        headers:     { Accept: 'application/json' },
        credentials: 'include',
    })

    if (!res.ok) throw new Error(`SAP returned ${res.status} — ${res.statusText}`)

    const data    = await res.json()
    const results = data?.d?.results ?? []

    console.log('[fetchDashboard] raw count:', results.length)
    console.log('[fetchDashboard] sample:',    results[0])

    return mapSapResponse(results)
}

async function getCsrfToken() {
    const res = await fetch(`${SRV}/itemSet?$top=0`, {
        method:  'GET',
        headers: { 'x-csrf-token': 'Fetch', Accept: 'application/json' },
        credentials: 'include',
    })
    const token = res.headers.get('x-csrf-token')
    if (!token) throw new Error('Could not retrieve CSRF token from SAP')
    return token
}

export async function postBulkAction({ rows, action, editValues = {} }) {
    const csrfToken = await getCsrfToken()
    const itemSet   = []

    rows.forEach((row) => {
        const edited = editValues[row.id]
        Object.entries(row.dateLines).forEach(([dateKey, line]) => {
            const wmeng = (edited && edited[dateKey] !== undefined && edited[dateKey] !== '')
                ? String(edited[dateKey])
                : line.wmeng
            itemSet.push({
                Vbeln:   row.vbeln,
                Posnr:   row.posnr,
                Matnr:   row.matnr,
                Postx:   row.postx,
                Werks:   row.werks,
                Ettyp:   row.ettyp,
                Kunnr:   row.kunnr,
                Edatu:   line.edatu,
                Wmeng:   wmeng,
                Status:  '',
                approve: action,
            })
        })
    })

    const payload = { Vbeln: '', itemSet }
    console.log('[postBulkAction] POST to headerSet:', JSON.stringify(payload, null, 2))

    const res = await fetch(`${SRV}/headerSet`, {
        method:  'POST',
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

// ── F4 Value Help fetchers ────────────────────────────────────

export async function fetchCustomerF4() {
    const url = `${SRV}/CustomerF4Set?$format=json`
    const res = await fetch(url, {
        method:      'GET',
        headers:     { Accept: 'application/json' },
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`CustomerF4 failed: ${res.status}`)
    const data = await res.json()
    return (data?.d?.results ?? []).map(r => ({
        code:  String(r.KUNNR ?? ''),
        label: String(r.NAME  ?? ''),
    }))
}

export async function fetchSalesDocumentF4() {
    const url = `${SRV}/SalesDocumentF4Set?$format=json`
    const res = await fetch(url, {
        method:      'GET',
        headers:     { Accept: 'application/json' },
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`SalesDocumentF4 failed: ${res.status}`)
    const data = await res.json()
    return (data?.d?.results ?? []).map(r => ({
        code:  String(r.VBELN ?? ''),
        label: '',
    }))
}

export async function fetchMaterialF4() {
    const url = `${SRV}/MaterialF4Set?$format=json`
    const res = await fetch(url, {
        method:      'GET',
        headers:     { Accept: 'application/json' },
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`MaterialF4 failed: ${res.status}`)
    const data = await res.json()
    return (data?.d?.results ?? []).map(r => ({
        code:  String(r.MATNR ?? ''),
        label: '',
    }))
}

export async function fetchPlantF4() {
    const url = `${SRV}/PlantF4Set?$format=json`
    const res = await fetch(url, {
        method:      'GET',
        headers:     { Accept: 'application/json' },
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`PlantF4 failed: ${res.status}`)
    const data = await res.json()
    return (data?.d?.results ?? []).map(r => ({
        code:  String(r.WERKS ?? ''),
        label: '',
    }))
}