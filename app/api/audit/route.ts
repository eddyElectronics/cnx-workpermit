import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      permitId,
      auditedBy,
      helmet,
      earPlugs,
      glasses,
      mask,
      chemicalSuit,
      gloves,
      safetyShoes,
      belt,
      safetyRope,
      reflectiveVest,
      areaBarrier,
      equipmentStrength,
      standardInstallation,
      toolReadiness,
      fireExtinguisher,
      electricalCutoff,
      alarmSystemOff,
      undergroundCheck,
      chemicalCheck,
      pressureCheck,
      authorizer,
      assistant,
      supervisor,
      worker,
      remarks
    } = body

    // Validate required fields
    if (!permitId || !auditedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: permitId and auditedBy' },
        { status: 400 }
      )
    }

    console.log('Creating audit for permit:', permitId, 'by user:', auditedBy)

    // Forward to proxy endpoint
    const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.airportthai.co.th/proxy/api'}/query`
    console.log('Calling proxy API:', proxyUrl)
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        database: 'CNXWorkPermit',
        procedure: 'usp_CreateWorkPermitAudit',
        parameters: {
          PermitId: permitId,
          AuditedBy: auditedBy,
          Helmet: helmet ? 1 : 0,
          EarPlugs: earPlugs ? 1 : 0,
          Glasses: glasses ? 1 : 0,
          Mask: mask ? 1 : 0,
          ChemicalSuit: chemicalSuit ? 1 : 0,
          Gloves: gloves ? 1 : 0,
          SafetyShoes: safetyShoes ? 1 : 0,
          Belt: belt ? 1 : 0,
          SafetyRope: safetyRope ? 1 : 0,
          ReflectiveVest: reflectiveVest ? 1 : 0,
          AreaBarrier: areaBarrier ? 1 : 0,
          EquipmentStrength: equipmentStrength ? 1 : 0,
          StandardInstallation: standardInstallation ? 1 : 0,
          ToolReadiness: toolReadiness ? 1 : 0,
          FireExtinguisher: fireExtinguisher ? 1 : 0,
          ElectricalCutoff: electricalCutoff ? 1 : 0,
          AlarmSystemOff: alarmSystemOff ? 1 : 0,
          UndergroundCheck: undergroundCheck ? 1 : 0,
          ChemicalCheck: chemicalCheck ? 1 : 0,
          PressureCheck: pressureCheck ? 1 : 0,
          Authorizer: authorizer ? 1 : 0,
          Assistant: assistant ? 1 : 0,
          Supervisor: supervisor ? 1 : 0,
          Worker: worker ? 1 : 0,
          Remarks: remarks || null
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Proxy API error:', errorText)
      throw new Error(`Failed to create audit: ${errorText}`)
    }

    const data = await response.json()
    console.log('Audit created successfully')
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Audit creation error:', error.message)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create audit' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const permitId = searchParams.get('permitId')

    if (!permitId) {
      return NextResponse.json(
        { error: 'Missing permitId parameter' },
        { status: 400 }
      )
    }

    console.log('Getting audits for permit:', permitId)

    // Forward to proxy endpoint
    const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.airportthai.co.th/proxy/api'}/query`
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        database: 'CNXWorkPermit',
        procedure: 'usp_GetWorkPermitAudits',
        parameters: {
          PermitId: parseInt(permitId)
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Proxy API error:', errorText)
      throw new Error(`Failed to get audits: ${errorText}`)
    }

    const data = await response.json()
    console.log('Audits retrieved successfully')
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Get audits error:', error.message)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get audits' },
      { status: 500 }
    )
  }
}
