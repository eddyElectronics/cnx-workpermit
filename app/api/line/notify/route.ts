import { NextResponse } from 'next/server'
import axios from 'axios'
import { LINE_CONFIG } from '@/lib/config'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('LINE Notify - Received body:', body)
    
    const { 
      permitNumber, 
      ownerName, 
      companyName,
      area,
      workType,
      workShift,
      startDate,
      endDate
    } = body
    
    console.log('LINE Notify - Permit Number:', permitNumber)

    // Format dates from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-'
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    }

    const message = `🔔 มีคำขอเข้าปฏิบัติงานใหม่

📋 เลขที่: ${permitNumber || 'N/A'}
👤 เจ้าของงาน: ${ownerName}
🏢 บริษัท: ${companyName}
📍 พื้นที่: ${area || '-'}
🔧 ประเภทงาน: ${workType || '-'}
⏰ ช่วงเวลา: ${workShift}
📅 ระยะเวลา: ${formatDate(startDate)} ถึง ${formatDate(endDate)}
📌 สถานะ: รอตรวจสอบ

กรุณาอนุมัติ Work Permit
https://liff.line.me/1654076318-08gnXfNt`

    console.log('LINE Notify - Message:', message)

    // Send LINE Push Message
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: LINE_CONFIG.adminLineId,
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

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: response.data,
    })
  } catch (error) {
    console.error('LINE notification error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification'
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send notification',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
