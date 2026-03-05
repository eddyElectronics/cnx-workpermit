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
      workShift,
      startDate,
      endDate,
      status,
      approvedBy
    } = body
    
    if (!lineUserId) {
      return NextResponse.json(
        { success: false, message: 'LINE User ID is required' },
        { status: 400 }
      )
    }

    // Helper function to format date as DD/MM/YYYY
    const formatDate = (dateString: string) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }
    
    // สร้างข้อความตามสถานะ
    const statusText = status === 'อนุมัติ' ? '✅ อนุมัติ' : '❌ ไม่อนุมัติ'
    const statusEmoji = status === 'อนุมัติ' ? '🎉' : '⚠️'
    
    const message = `${statusEmoji} แจ้งผลการพิจารณาคำขอเข้าปฏิบัติงาน

📋 เลขที่: ${permitNumber || 'N/A'}
👤 เจ้าของงาน: ${ownerName}
🏢 บริษัท: ${companyName}
📍 พื้นที่: ${area || '-'}
🔧 ประเภทงาน: ${workType || '-'}
⏰ ช่วงเวลา: ${workShift || '-'}
📅 ระยะเวลา: ${formatDate(startDate)} ถึง ${formatDate(endDate)}

📌 สถานะ: ${statusText}
✍️ ผู้อนุมัติ: ${approvedBy || '-'}

${status === 'อนุมัติ' 
  ? '✅ คุณสามารถเข้าปฏิบัติงานได้แล้ว กรุณาปฏิบัติตามกฎระเบียบความปลอดภัยอย่างเคร่งครัด\n\n📖 กฎ ระเบียบ ข้อบังคับ และวิธีการปฏิบัติงาน:\nhttps://safetycnx.wixsite.com/safetycnx' 
  : '❌ คำขอของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามรายละเอียดเพิ่มเติม'
}`

    const approvalSummaryMessage = `📣 แจ้งผลอนุมัติคำขอเข้าปฏิบัติงาน

📋 เลขที่: ${permitNumber || 'N/A'}
👤 เจ้าของงาน: ${ownerName}
🏢 บริษัท: ${companyName}
📍 พื้นที่: ${area || '-'}
🔧 ประเภทงาน: ${workType || '-'}
⏰ ช่วงเวลา: ${workShift || '-'}
📅 ระยะเวลา: ${formatDate(startDate)} ถึง ${formatDate(endDate)}
📌 สถานะ: ${statusText}
✍️ ผู้อนุมัติ: ${approvedBy || '-'}
`

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

    if (status === 'อนุมัติ') {
      const approvalNotifyTo = process.env.LINE_APPROVAL_NOTIFY_TO || 'C9c89cfb5eaca4ef26380e97427fb85a4'
      const approvalAccessToken = process.env.LINE_APPROVAL_CHANNEL_ACCESS_TOKEN || LINE_CONFIG.channelAccessToken

      if (!approvalAccessToken) {
        throw new Error('LINE approval access token is not configured')
      }

      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: approvalNotifyTo,
          messages: [
            {
              type: 'text',
              text: approvalSummaryMessage,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${approvalAccessToken}`,
          },
        }
      )
    }

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
