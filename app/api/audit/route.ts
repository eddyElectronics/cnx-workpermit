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

    // Call external API with procedure endpoint
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.airportthai.co.th/proxy/api'}/procedure`
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        database: 'CNXWorkPermit',
        procedure: 'usp_CreateWorkPermitAudit',
        parameters: {
          PermitId: permitId,
          AuditedBy: auditedBy,
          Helmet: helmet ? true : false,
          EarPlugs: earPlugs ? true : false,
          Glasses: glasses ? true : false,
          Mask: mask ? true : false,
          ChemicalSuit: chemicalSuit ? true : false,
          Gloves: gloves ? true : false,
          SafetyShoes: safetyShoes ? true : false,
          Belt: belt ? true : false,
          SafetyRope: safetyRope ? true : false,
          ReflectiveVest: reflectiveVest ? true : false,
          AreaBarrier: areaBarrier ? true : false,
          EquipmentStrength: equipmentStrength ? true : false,
          StandardInstallation: standardInstallation ? true : false,
          ToolReadiness: toolReadiness ? true : false,
          FireExtinguisher: fireExtinguisher ? true : false,
          ElectricalCutoff: electricalCutoff ? true : false,
          AlarmSystemOff: alarmSystemOff ? true : false,
          UndergroundCheck: undergroundCheck ? true : false,
          ChemicalCheck: chemicalCheck ? true : false,
          PressureCheck: pressureCheck ? true : false,
          Authorizer: authorizer ? true : false,
          Assistant: assistant ? true : false,
          Supervisor: supervisor ? true : false,
          Worker: worker ? true : false,
          ...(remarks && { Remarks: remarks })
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', errorText)
      throw new Error(`Failed to create audit: ${errorText}`)
    }

    const data = await response.json()
    console.log('Audit created successfully:', data)
    return NextResponse.json({ success: true, data: data.data || data })
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

    // Call external API with procedure endpoint
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.airportthai.co.th/proxy/api'}/procedure`
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
      console.error('API error:', errorText)
      throw new Error(`Failed to get audits: ${errorText}`)
    }

    const data = await response.json()
    console.log('Audits retrieved successfully:', data)
    return NextResponse.json({ success: true, data: data.data || data })
  } catch (error: any) {
    console.error('Get audits error:', error.message)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get audits' },
      { status: 500 }
    )
  }
}
