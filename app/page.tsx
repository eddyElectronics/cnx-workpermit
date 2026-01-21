'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { liffService } from '@/lib/liff'
import { useUserStore } from '@/lib/store'
import { apiService } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const { liffProfile, user, setLiffProfile, setUser } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeLiff()
  }, [])

  const initializeLiff = async () => {
    try {
      await liffService.init()

      if (liffService.isLoggedIn()) {
        const profile = await liffService.getProfile()
        setLiffProfile(profile)

        // Check if we already have user data in store or localStorage
        const cachedUserStr = localStorage.getItem('user-storage')
        if (cachedUserStr) {
          try {
            const cachedData = JSON.parse(cachedUserStr)
            if (cachedData.state?.user && cachedData.state.user.LineUserId === profile.userId) {
              console.log('✅ Using cached user data, skipping API call')
              setUser(cachedData.state.user)
              
              // Redirect based on cached data
              router.push('/permit/list')
              return
            }
          } catch (e) {
            console.warn('Failed to parse cached user data:', e)
          }
        }

        // Add delay to prevent rapid API calls
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Check if user is registered
        try {
          console.log('🔍 Fetching user data from API...')
          const users = (await apiService.getUserByLineId(profile.userId)) as unknown as { data: Array<{ UserId: number; IsAdmin: boolean }> }
          
          // Handle API response structure
          const userData = Array.isArray(users) ? users : users?.data || []
          
          if (userData.length > 0) {
            setUser(userData[0] as any)
            
            // Always go to permit list (admin can access admin page from menu)
            router.push('/permit/list')
          } else {
            // Not registered, go to registration
            router.push('/register')
          }
        } catch (apiError: any) {
          console.error('API connection error:', apiError)
          
          // If rate limited (429), show friendly message and allow registration
          if (apiError?.response?.status === 429) {
            console.warn('⚠️  Rate limit reached, proceeding to registration page')
            setError('กรุณารอสักครู่ ระบบกำลังประมวลผล...')
            
            // Wait 3 seconds then go to registration
            setTimeout(() => {
              router.push('/register')
            }, 3000)
            return
          }
          
          // If API is not accessible, still allow user to proceed to registration
          // This allows development/testing without backend connectivity
          console.warn('Proceeding without API verification - development mode')
          router.push('/register')
        }
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      console.error('LIFF initialization failed:', err)
      setError('ไม่สามารถเชื่อมต่อกับ LINE ได้')
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      liffService.login()
    } catch (err: any) {
      console.error('Login failed:', err)
      setError('เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          {/* App Logo/Icon */}
          <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          {/* App Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ระบบคำขอเข้าปฏิบัติงาน
          </h1>
          <p className="text-gray-600 mb-8">
            ท่าอากาศยานเชียงใหม่
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </button>

          {/* Safety Rules Button */}
          <a
            href="https://safetycnx.wixsite.com/safetycnx"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 btn-secondary w-full flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">กฎ ระเบียบ ข้อบังคับและวิธีการปฏิบัติงาน</span>
          </a>

          <p className="mt-6 text-sm text-gray-500">
            กรุณาเข้าสู่ระบบด้วย LINE<br />เพื่อใช้งานระบบคำขอเข้าปฏิบัติงาน
          </p>
        </div>
      </div>
    </div>
  )
}
