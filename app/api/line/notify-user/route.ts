import { NextResponse } from 'next/server'
import axios from 'axios'
import { LINE_CONFIG } from '@/lib/config'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('LINE Notify User - Received body:', body)
    
    const { 
      lineUserId,
      permitNumber, 
      ownerName, 
      companyName,
      area,
      workType,
      status,
      approvedBy
    } = body
    
    if (!lineUserId) {
      return NextResponse.json(
        { success: false, message: 'LINE User ID is required' },
        { status: 400 }
      )
    }

    // สร้างข้อความตามสถานะ
    const statusText = status === 'Approved' ? '✅ อนุมัติ' : '❌ ไม่อนุมัติ'
    const statusEmoji = status === 'Approved' ? '🎉' : '⚠️'
    
    const message = `${statusEmoji} แจ้งผลการพิจารณาคำขอเข้าปฏิบัติงาน

📋 เลขที่: ${permitNumber || 'N/A'}
👤 เจ้าของงาน: ${ownerName}
🏢 บริษัท: ${companyName}
📍 พื้นที่: ${area || '-'}
🔧 ประเภทงาน: ${workType || '-'}

📌 สถานะ: ${statusText}
✍️ ผู้อนุมัติ: ${approvedBy || '-'}

${status === 'Approved' 
  ? '✅ คุณสามารถเข้าปฏิบัติงานได้แล้ว กรุณาปฏิบัติตามกฎระเบียบความปลอดภัยอย่างเคร่งครัด' 
  : '❌ คำขอของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามรายละเอียดเพิ่มเติม'
}`

    console.log('LINE Notify User - Sending to:', lineUserId)
    console.log('LINE Notify User - Message:', message)

    // Send LINE Push Message
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LINE_CONFIG.channelAccessToken}`,
        },
      }
    )

    console.log('LINE Notify User - Response:', response.data)

    return NextResponse.json({
      success: true,
      message: 'User notification sent successfully',
      data: response.data,
    })
  } catch (error) {
    console.error('LINE user notification error:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send user notification',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send user notification'
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send user notification',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
