'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { API_CONFIG } from '@/lib/config'

export default function ApiTestPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      console.log('Testing API connection...')
      console.log('API Base URL:', API_CONFIG.baseURL)
      console.log('API Key:', API_CONFIG.apiKey ? '***' + API_CONFIG.apiKey.slice(-4) : 'Not set')
      console.log('Database:', API_CONFIG.database)

      const response = await apiClient.post('/query', {
        database: API_CONFIG.database,
        query: 'SELECT 1 AS Test',
        parameters: {},
      })

      setResult({
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      })
    } catch (err: any) {
      console.error('API Test Error:', err)
      setError(err.message || 'Connection failed')
      setResult({
        success: false,
        error: err.response?.data || err.message,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
        }
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>Base URL:</strong> {API_CONFIG.baseURL}</div>
            <div><strong>Database:</strong> {API_CONFIG.database}</div>
            <div><strong>API Key:</strong> {API_CONFIG.apiKey ? '***' + API_CONFIG.apiKey.slice(-4) : 'Not set'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testConnection}
            disabled={testing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300"
          >
            {testing ? 'Testing...' : 'Test API Connection'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className={`${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <h3 className={`${result.success ? 'text-green-800' : 'text-red-800'} font-semibold mb-2`}>
              {result.success ? '✓ Success' : '✗ Failed'}
            </h3>
            <pre className="text-sm overflow-auto bg-white p-4 rounded border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Troubleshooting Tips:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Check if API endpoint is accessible from your network</li>
            <li>Verify API key is correct in .env.local</li>
            <li>Check browser console for CORS errors</li>
            <li>Ensure database name is correct (CNXWorkPermit)</li>
            <li>Try accessing API directly: {API_CONFIG.baseURL}</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}
