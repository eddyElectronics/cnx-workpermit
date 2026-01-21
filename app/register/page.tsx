'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserStore } from '@/lib/store'
import { apiService } from '@/lib/api'
import { liffService } from '@/lib/liff'

const registerSchema = z.object({
  companyName: z.string().min(1, 'กรุณาระบุชื่อบริษัท'),
  department: z.string().optional(),
  fullName: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล'),
  phoneNumber: z.string().min(10, 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง'),
  email: z.string().email('กรุณาระบุอีเมลที่ถูกต้อง').optional().or(z.literal('')),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { liffProfile, setUser, clearUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    if (!liffProfile) {
      router.push('/')
      return
    }

    // Pre-fill name from LINE profile
    if (liffProfile.displayName) {
      setValue('fullName', liffProfile.displayName)
    }

    // Pre-fill from localStorage if available
    const savedCompany = localStorage.getItem('userCompanyName')
    const savedPhone = localStorage.getItem('userPhoneNumber')
    const savedEmail = localStorage.getItem('userEmail')
    const savedDepartment = localStorage.getItem('userDepartment')

    if (savedCompany) setValue('companyName', savedCompany)
    if (savedPhone) setValue('phoneNumber', savedPhone)
    if (savedEmail) setValue('email', savedEmail)
    if (savedDepartment) setValue('department', savedDepartment)
  }, [liffProfile, router, setValue])

  const onSubmit = async (data: RegisterForm) => {
    if (!liffProfile) {
      setError('ไม่พบข้อมูล LINE Profile')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Starting registration...')
      
      const regResult = (await apiService.registerUser({
        LineUserId: liffProfile.userId,
        CompanyName: data.companyName,
        Department: data.department,
        FullName: data.fullName,
        PhoneNumber: data.phoneNumber,
        Email: data.email,
      })) as { data: Array<{ UserId: number; Status: string }> }

      console.log('Registration result:', regResult)
      
      if (regResult?.data && regResult.data.length > 0) {
        const userId = regResult.data[0].UserId
        console.log('Registration successful, fetching user data for UserId:', userId)
        
        // Save to localStorage for backup
        localStorage.setItem('userCompanyName', data.companyName)
        localStorage.setItem('userPhoneNumber', data.phoneNumber)
        if (data.email) localStorage.setItem('userEmail', data.email)
        if (data.department) localStorage.setItem('userDepartment', data.department)
        localStorage.setItem('userFullName', data.fullName)
        
        // Get updated user data
        const users = await apiService.getUserByLineId(liffProfile.userId)
        console.log('Users fetched:', users)
        
        if (users && users.length > 0) {
          setUser(users[0])
          console.log('User set, redirecting to /permit/create...')
          router.push('/permit/create')
        } else {
          // Fallback: create minimal user object from registration data
          const minimalUser = {
            UserId: userId,
            LineUserId: liffProfile.userId,
            CompanyName: data.companyName,
            Department: data.department,
            FullName: data.fullName,
            PhoneNumber: data.phoneNumber,
            Email: data.email,
            IsAdmin: false,
            IsActive: true,
          }
          setUser(minimalUser)
          console.log('Using minimal user object, redirecting...')
          router.push('/permit/create')
        }
      } else {
        throw new Error('Registration did not return user ID')
      }
    } catch (err) {
      console.error('Registration error:', err)
      const errorMessage = err instanceof Error ? err.message : 'ลงทะเบียนไม่สำเร็จ'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('ต้องการออกจากระบบหรือไม่?')) {
      try {
        await liffService.logout()
        clearUser()
        localStorage.clear()
        router.push('/')
      } catch (err) {
        console.error('Logout error:', err)
      }
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ลงทะเบียนผู้ใช้งาน
              </h1>
              <p className="text-gray-600">
                กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>

          {liffProfile && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                {liffProfile.pictureUrl && (
                  <Image
                    src={liffProfile.pictureUrl}
                    alt={liffProfile.displayName || 'User'}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {liffProfile.displayName}
                  </p>
                  <p className="text-sm text-gray-600">
                    LINE Account Connected
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">
                ชื่อบริษัท <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="ระบุชื่อบริษัท"
                {...register('companyName')}
              />
              {errors.companyName && (
                <p className="error-text">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="label">สังกัด/แผนก</label>
              <input
                type="text"
                className="input"
                placeholder="ระบุสังกัดหรือแผนก (ถ้ามี)"
                {...register('department')}
              />
            </div>

            <div>
              <label className="label">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="ระบุชื่อ-นามสกุล"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="error-text">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="label">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="input"
                placeholder="0812345678"
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && (
                <p className="error-text">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label className="label">อีเมล</label>
              <input
                type="email"
                className="input"
                placeholder="example@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังลงทะเบียน...
                  </span>
                ) : 'ลงทะเบียน'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
