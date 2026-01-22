import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('=== Proxy Request ===')
    console.log('Database:', body.database)
    console.log('Has Query:', !!body.query)
    console.log('Has Procedure:', !!body.procedure)
    console.log('Procedure:', body.procedure)
    console.log('Parameters:', JSON.stringify(body.parameters, null, 2))

    // Validate request body
    if (!body.database) {
      return NextResponse.json(
        { error: 'Database name is required' },
        { status: 400 }
      )
    }

    if (!body.query && !body.procedure) {
      return NextResponse.json(
        { error: 'Either query or procedure is required' },
        { status: 400 }
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.airportthai.co.th/proxy/api'
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
    
    console.log('API URL:', apiUrl)
    console.log('Has API Key:', !!apiKey)
    
    // Determine endpoint
    const endpoint = body.procedure ? '/procedure' : '/query'
    const fullUrl = `${apiUrl}${endpoint}`
    
    console.log('Calling API:', fullUrl)
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    console.log('=== API Response ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('OK:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== API Error ===')
      console.error('Status:', response.status)
      console.error('Status Text:', response.statusText)
      console.error('Error Text:', errorText)
      console.error('Request was:', JSON.stringify(body, null, 2))
      
      // Try to parse error as JSON
      let errorDetails = errorText
      let errorMessage = 'API request failed'
      
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = JSON.stringify(errorJson, null, 2)
        
        // Extract meaningful error message
        if (errorJson.error) {
          errorMessage = errorJson.error
        } else if (errorJson.message) {
          errorMessage = errorJson.message
        } else if (errorJson.details) {
          errorMessage = errorJson.details
        }
        
        console.error('Parsed error:', errorJson)
      } catch (e) {
        // Keep as text
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
      }
      
      console.error('Final error message:', errorMessage)
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails, 
          status: response.status,
          statusText: response.statusText,
          requestBody: body
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('=== API Success ===')
    console.log('Response data type:', typeof data)
    console.log('Has data:', !!data)
    console.log('Data keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A')
    console.log('Data:', JSON.stringify(data, null, 2))
    
    return NextResponse.json(data)
    
  } catch (error: unknown) {
    console.error('Proxy error:', error)
    const message = error instanceof Error ? error.message : 'Proxy request failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
