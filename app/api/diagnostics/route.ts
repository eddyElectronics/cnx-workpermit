import { NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/config'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      apiBaseUrl: API_CONFIG.baseURL,
      database: API_CONFIG.database,
      apiKeyConfigured: !!API_CONFIG.apiKey,
      apiKeyLength: API_CONFIG.apiKey?.length || 0,
    },
    nextPublicVars: {
      API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      DATABASE_NAME: process.env.NEXT_PUBLIC_DATABASE_NAME,
      API_KEY_SET: !!process.env.NEXT_PUBLIC_API_KEY,
    }
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
