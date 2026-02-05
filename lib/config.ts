// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
  database: process.env.NEXT_PUBLIC_DATABASE_NAME || 'CNXWorkPermit',
}

// LINE Configuration
export const LINE_CONFIG = {
  channelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  adminLineId: process.env.NEXT_PUBLIC_ADMIN_LINE_ID || '',
}

// Work Shift Options
export const WORK_SHIFTS = [
  { value: '08:00-17:00', label: '08:00-17:00 (กลางวัน)' },
  { value: '17:00-00:00', label: '17:00-00:00 (กลางคืน)' },
  { value: '17:00-08:00', label: '17:00-08:00 (ดึก)' },
]

// Status Options
export const PERMIT_STATUS = {
  PENDING: 'รอตรวจสอบ',
  APPROVED: 'อนุมัติ',
  REJECTED: 'ไม่อนุมัติ',
  CANCELLED: 'ยกเลิก',
}
