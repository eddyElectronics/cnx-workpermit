import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fullName } = body

    // Validate required fields
    if (!userId || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and fullName' },
        { status: 400 }
      )
    }

    console.log('Updating user name:', { userId, fullName })

    // Call external API with query endpoint
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.airportthai.co.th/proxy/api'}/query`
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        database: 'CNXWorkPermit',
        query: `
          UPDATE [dbo].[Users]
          SET [FullName] = @FullName,
              [UpdatedDate] = GETDATE()
          WHERE [UserId] = @UserId;
          
          SELECT [UserId], [FullName], [UpdatedDate]
          FROM [dbo].[Users]
          WHERE [UserId] = @UserId;
        `,
        parameters: {
          UserId: userId,
          FullName: fullName
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', errorText)
      throw new Error(`Failed to update name: ${errorText}`)
    }

    const data = await response.json()
    console.log('Name updated successfully:', data)
    return NextResponse.json({ success: true, data: data.data || data })
  } catch (error: any) {
    console.error('Update name error:', error.message)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update name' },
      { status: 500 }
    )
  }
}
