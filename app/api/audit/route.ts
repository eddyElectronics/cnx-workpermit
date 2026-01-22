import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      permitId,
      auditedBy,
      auditedByName,
      auditDate,
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

    // Build parameters - all checkboxes default to false if not provided
    const parameters: any = {
      PermitId: permitId,
      AuditedBy: auditedBy,
      Helmet: helmet ?? false,
      EarPlugs: earPlugs ?? false,
      Glasses: glasses ?? false,
      Mask: mask ?? false,
      ChemicalSuit: chemicalSuit ?? false,
      Gloves: gloves ?? false,
      SafetyShoes: safetyShoes ?? false,
      Belt: belt ?? false,
      SafetyRope: safetyRope ?? false,
      ReflectiveVest: reflectiveVest ?? false,
      AreaBarrier: areaBarrier ?? false,
      EquipmentStrength: equipmentStrength ?? false,
      StandardInstallation: standardInstallation ?? false,
      ToolReadiness: toolReadiness ?? false,
      FireExtinguisher: fireExtinguisher ?? false,
      ElectricalCutoff: electricalCutoff ?? false,
      AlarmSystemOff: alarmSystemOff ?? false,
      UndergroundCheck: undergroundCheck ?? false,
      ChemicalCheck: chemicalCheck ?? false,
      PressureCheck: pressureCheck ?? false,
      Authorizer: authorizer ?? false,
      Assistant: assistant ?? false,
      Supervisor: supervisor ?? false,
      Worker: worker ?? false
    }

    // Add optional remarks field only
    if (remarks) parameters.Remarks = remarks

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
        parameters
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
