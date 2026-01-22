import axios from 'axios'
import { API_CONFIG } from './config'

// Global rate limiter
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests (increased)
const requestQueue: Array<() => void> = []
let isProcessingQueue = false

async function rateLimitDelay() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    console.log(`⏱️  Rate limiting: waiting ${delay}ms...`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  lastRequestTime = Date.now()
}

// API Client - Use local proxy to avoid CORS issues
export const apiClient = axios.create({
  baseURL: '/api/proxy',  // Use Next.js API route as proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout (increased for retries)
})

// Simple cache to reduce API calls
const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

// Helper to create cache key
function getCacheKey(url: string, data: any): string {
  return `${url}:${JSON.stringify(data)}`
}

// Helper to get from cache
function getFromCache(key: string): any | null {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached data for:', key)
    return cached.data
  }
  return null
}

// Helper to set cache
function setCache(key: string, data: any): void {
  apiCache.set(key, { data, timestamp: Date.now() })
}

// Add request interceptor for caching
apiClient.interceptors.request.use(
  (config) => {
    // Only cache GET-like queries
    if (config.data && !config.data.procedure) {
      const cacheKey = getCacheKey(config.url || '', config.data)
      const cached = getFromCache(cacheKey)
      if (cached) {
        // Return cached response
        return Promise.reject({ __cached: true, data: cached })
      }
    }
    return config
  }
)

// Add response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful responses
    if (response.config.data && !JSON.parse(response.config.data).procedure) {
      const cacheKey = getCacheKey(response.config.url || '', JSON.parse(response.config.data))
      setCache(cacheKey, response.data)
    }
    return response
  },
  async (error) => {
    // Handle cached response
    if (error.__cached) {
      return Promise.resolve({ data: error.data })
    }
    
    const config = error.config
    
    if (error.response) {
      const status = error.response.status
      
      // Handle 429 (Too Many Requests) with retry
      if (status === 429 && (!config.__retryCount || config.__retryCount < 5)) {
        config.__retryCount = (config.__retryCount || 0) + 1
        const delay = Math.min(2000 * Math.pow(2, config.__retryCount), 10000) // Max 10s
        
        console.warn(`⏳ Rate limit hit (429), retrying in ${delay}ms... (attempt ${config.__retryCount}/5)`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return apiClient.request(config)
      }
      
      console.error('API Error Response:', status, error.response.data)
    } else if (error.request) {
      console.error('API Network Error - No response received')
      console.error('Request URL:', error.config?.url)
      console.error('Request Method:', error.config?.method)
    } else {
      console.error('API Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Query Database
export async function queryDatabase<T = unknown>(
  query: string,
  parameters: Record<string, unknown> = {}
): Promise<T> {
  try {
    await rateLimitDelay() // Apply rate limiting
    
    const response = await apiClient.post('', {
      database: API_CONFIG.database,
      query,
      parameters,
    })
    return response.data
  } catch (error: unknown) {
    console.error('Query Error:', error)
    const message = error instanceof Error ? error.message : 'Database query failed'
    throw new Error(message)
  }
}

// Execute Stored Procedure
export async function executeProcedure<T = unknown>(
  procedure: string,
  parameters: Record<string, unknown> = {}
): Promise<T> {
  try {
    await rateLimitDelay() // Apply rate limiting
    
    console.log('=== executeProcedure ===')
    console.log('Procedure:', procedure)
    console.log('Parameters:', JSON.stringify(parameters, null, 2))
    
    const requestBody = {
      database: API_CONFIG.database,
      procedure,
      parameters,
    }
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const response = await apiClient.post('', requestBody)
    
    console.log('=== Response received ===')
    console.log('Status:', response.status)
    console.log('Data:', JSON.stringify(response.data, null, 2))
    
    return response.data
  } catch (error: unknown) {
    console.error('=== Procedure Error ===')
    console.error('Procedure:', procedure)
    console.error('Full error:', error)
    
    // Extract detailed error message
    let errorMessage = 'Procedure execution failed'
    
    if (error && typeof error === 'object') {
      const err = error as any
      
      if (err.response?.data) {
        console.error('Error response data:', err.response.data)
        
        // Try to extract meaningful error message
        const data = err.response.data
        if (data.error) {
          errorMessage = data.error
        } else if (data.details) {
          errorMessage = data.details
        } else if (data.message) {
          errorMessage = data.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
    }
    
    console.error('Final error message:', errorMessage)
    throw new Error(errorMessage)
  }
}

// Type Definitions
export interface User {
  UserId: number
  LineUserId: string
  CompanyName: string
  Department?: string
  FullName: string
  PhoneNumber: string
  Email?: string
  IsAdmin: boolean
  IsActive: boolean
}

export interface Area {
  AreaId: number
  AreaCode: string
  AreaName: string
  Description?: string
}

export interface WorkType {
  WorkTypeId: number
  WorkTypeCode: string
  WorkTypeName: string
  Description?: string
}

export interface WorkPermit {
  PermitId: number
  PermitNumber: string
  UserId: number
  LineUserId?: string
  OwnerName: string
  CompanyName: string
  AreaId: number
  AreaName?: string
  WorkTypeId: number
  WorkTypeName?: string
  WorkShift: string
  StartDate: string
  EndDate: string
  Status: string
  Remarks?: string
  CreatedDate: string
  UpdatedDate: string
  DocumentCount?: number
}

// API Functions
export const apiService = {
  // User Registration
  registerUser: async (data: {
    LineUserId: string
    CompanyName: string
    Department?: string
    FullName: string
    PhoneNumber: string
    Email?: string
  }) => {
    try {
      console.log('=== registerUser called ===')
      console.log('Input data:', JSON.stringify(data, null, 2))
      
      // Build parameters object, only including fields with actual values
      // The backend API cannot handle null values properly
      const parameters: Record<string, string> = {
        LineUserId: data.LineUserId,
        CompanyName: data.CompanyName,
        FullName: data.FullName,
        PhoneNumber: data.PhoneNumber,
      }
      
      // Only add optional fields if they have values
      if (data.Department && data.Department.trim()) {
        parameters.Department = data.Department.trim()
      }
      
      if (data.Email && data.Email.trim()) {
        parameters.Email = data.Email.trim()
      }
      
      console.log('Cleaned parameters (nulls omitted):', JSON.stringify(parameters, null, 2))
      
      const result = await executeProcedure('usp_RegisterUser', parameters)
      
      console.log('=== registerUser result ===')
      console.log('Result type:', typeof result)
      console.log('Result:', JSON.stringify(result, null, 2))
      
      // Handle different response structures
      if (!result) {
        console.warn('Result is null or undefined, returning empty data')
        return { data: [] }
      }
      
      if (Array.isArray(result)) {
        console.log('Result is array, wrapping in data property')
        return { data: result }
      }
      
      if (typeof result === 'object') {
        // If it's already an object with data property
        if ('data' in result) {
          console.log('Result already has data property')
          return result
        }
        // If it's a recordset structure
        if ('recordset' in result) {
          console.log('Result has recordset property')
          return { data: (result as any).recordset }
        }
        // If it's a single record, wrap it
        console.log('Result is object, wrapping as single record')
        return { data: [result] }
      }
      
      console.warn('Unexpected result type, returning empty data')
      return { data: [] }
    } catch (error) {
      console.error('=== registerUser error ===')
      console.error('Error type:', typeof error)
      console.error('Error:', error)
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Axios error response:', axiosError.response?.data)
        console.error('Axios error status:', axiosError.response?.status)
      }
      
      throw error
    }
  },

  // Get Active Areas
  getAreas: async (): Promise<Area[]> => {
    return queryDatabase('SELECT * FROM vw_ActiveAreas ORDER BY AreaName')
  },

  // Get Active Work Types
  getWorkTypes: async (): Promise<WorkType[]> => {
    return queryDatabase('SELECT * FROM vw_ActiveWorkTypes ORDER BY WorkTypeName')
  },

  // Create Work Permit
  createWorkPermit: async (data: {
    UserId: number
    OwnerName: string
    CompanyName: string
    AreaId: number
    WorkTypeId: number
    WorkShift: string
    StartDate: string
    EndDate: string
    Remarks?: string
  }) => {
    // Build parameters object, only including fields with actual values
    const parameters: Record<string, any> = {
      UserId: data.UserId,
      OwnerName: data.OwnerName,
      CompanyName: data.CompanyName,
      AreaId: data.AreaId,
      WorkTypeId: data.WorkTypeId,
      WorkShift: data.WorkShift,
      StartDate: data.StartDate,
      EndDate: data.EndDate,
    }
    
    // Only add Remarks if it has a value
    if (data.Remarks && data.Remarks.trim()) {
      parameters.Remarks = data.Remarks.trim()
    }
    
    return executeProcedure('usp_CreateWorkPermit', parameters)
  },

  // Get User's Work Permits
  getUserWorkPermits: async (userId: number): Promise<WorkPermit[]> => {
    return queryDatabase(
      'SELECT * FROM vw_WorkPermits WHERE UserId = @UserId ORDER BY CreatedDate DESC',
      { UserId: userId }
    )
  },

  // Get User by LINE ID
  getUserByLineId: async (lineUserId: string): Promise<User[]> => {
    return queryDatabase<User[]>(
      'SELECT * FROM Users WHERE LineUserId = @LineUserId',
      { LineUserId: lineUserId }
    )
  },

  // Get Pending Work Permits (Admin)
  getPendingWorkPermits: async (): Promise<WorkPermit[]> => {
    return queryDatabase('SELECT * FROM vw_WorkPermits ORDER BY CASE WHEN Status = N\'รอตรวจสอบ\' THEN 0 ELSE 1 END, CreatedDate DESC')
  },

  // Get All Work Permits (Admin)
  getAllWorkPermits: async (): Promise<WorkPermit[]> => {
    return queryDatabase(`
      SELECT * FROM vw_WorkPermits 
      ORDER BY 
        CASE 
          WHEN Status = N'รอตรวจสอบ' THEN 1 
          WHEN Status = N'อนุมัติ' THEN 2 
          WHEN Status = N'ไม่อนุมัติ' THEN 3 
          ELSE 4 
        END,
        CreatedDate DESC
    `)
  },

  // Get Permit Documents
  getPermitDocuments: async (permitId: number) => {
    return queryDatabase(
      'SELECT * FROM WorkPermitDocuments WHERE PermitId = @PermitId ORDER BY UploadedDate DESC',
      { PermitId: permitId }
    )
  },

  // Update Work Permit Status (Admin)
  updateWorkPermitStatus: async (permitId: number, status: string, reviewedBy: number) => {
    return executeProcedure('usp_UpdateWorkPermitStatus', {
      PermitId: permitId,
      Status: status,
      ReviewedBy: reviewedBy,
    })
  },

  // Add Permit Document
  addPermitDocument: async (
    permitId: number, 
    documentName: string, 
    documentPath: string, 
    documentType: string, 
    fileSize: number
  ) => {
    return executeProcedure('usp_AddPermitDocument', {
      PermitId: permitId,
      DocumentName: documentName,
      DocumentPath: documentPath,
      DocumentType: documentType,
      FileSize: fileSize,
    })
  },
}
