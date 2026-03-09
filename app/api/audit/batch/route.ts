import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `audit_batch_${crypto.randomUUID()}`
  const requestAttempt = request.headers.get('x-request-attempt') || '1'

  try {
    const body = await request.json()
    const { permitIds } = body

    if (!Array.isArray(permitIds) || permitIds.length === 0) {
      return NextResponse.json(
        { error: 'permitIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Sanitize: only allow numeric IDs
    const safeIds = permitIds.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0)

    if (safeIds.length === 0) {
      return NextResponse.json(
        { success: true, data: [], requestId },
        { headers: { 'x-request-id': requestId } }
      )
    }

    console.log(`[${requestId}] Batch audit check for ${safeIds.length} permits`)

    // Build a single query to get audit existence for all permit IDs
    const idList = safeIds.join(',')
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.airportthai.co.th/proxy/api'}/query`
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-request-id': requestId,
        'x-request-attempt': requestAttempt,
      },
      body: JSON.stringify({
        database: 'CNXWorkPermit',
        query: `SELECT DISTINCT PermitId FROM WorkPermitAudits WHERE PermitId IN (${idList})`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[${requestId}] API error:`, errorText)
      throw new Error(`Failed to batch check audits: ${errorText}`)
    }

    const data = await response.json()
    const rows = data.data || data || []

    // Extract permit IDs that have audits
    const auditedPermitIds: number[] = Array.isArray(rows)
      ? rows.map((r: Record<string, unknown>) => r.PermitId as number).filter(Boolean)
      : []

    console.log(`[${requestId}] Found ${auditedPermitIds.length} audited permits out of ${safeIds.length}`)

    return NextResponse.json(
      { success: true, auditedPermitIds, requestId },
      { headers: { 'x-request-id': requestId } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to batch check audits'
    console.error(`[${requestId}] Batch audit error:`, message)
    return NextResponse.json(
      { error: message, requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    )
  }
}
