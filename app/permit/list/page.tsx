'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { useUserStore } from '@/lib/store'
import { apiService, WorkPermit } from '@/lib/api'
import { liffService } from '@/lib/liff'

export default function PermitListPage() {
  const router = useRouter()
  const { user, liffProfile, clearUser } = useUserStore()
  const [permits, setPermits] = useState<WorkPermit[]>([])
  const [filteredPermits, setFilteredPermits] = useState<WorkPermit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

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

  useEffect(() => {
    if (!user || !liffProfile) {
      router.push('/')
      return
    }

    const loadData = async () => {
      try {
        const result = await apiService.getUserWorkPermits(user.UserId)
        console.log('Permits result:', result)
        
        // Handle API response structure { data: [...] }
        const data = Array.isArray(result) ? result : (result as { data: WorkPermit[] })?.data || []
        setPermits(data)
        setFilteredPermits(data)
      } catch (err) {
        console.error('Failed to load permits:', err)
        setError('ไม่สามารถโหลดข้อมูลได้')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, liffProfile, router])

  // Filter permits when date range changes
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredPermits(permits)
      return
    }

    const filtered = permits.filter((permit) => {
      const createdDate = new Date(permit.CreatedDate)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      // Set time to start and end of day for proper comparison
      if (start) start.setHours(0, 0, 0, 0)
      if (end) end.setHours(23, 59, 59, 999)
      createdDate.setHours(0, 0, 0, 0)

      if (start && end) {
        return createdDate >= start && createdDate <= end
      } else if (start) {
        return createdDate >= start
      } else if (end) {
        return createdDate <= end
      }
      return true
    })

    setFilteredPermits(filtered)
  }, [startDate, endDate, permits])

  const handleResetFilter = () => {
    setStartDate('')
    setEndDate('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'รอตรวจสอบ':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'อนุมัติ':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ไม่อนุมัติ':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ยกเลิก':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            รายการคำขอของฉัน
          </h1>
          <div className="flex gap-2">
            {user?.IsAdmin && (
              <button
                onClick={() => router.push('/admin/permits')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                👑 อนุมัติคำขอ
              </button>
            )}
            <button
              onClick={() => router.push('/permit/create')}
              className="btn-primary px-4 py-2 text-sm"
            >
              + สร้างคำขอใหม่
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="card mb-6">
            <div className="flex items-center gap-3">
              {liffProfile?.pictureUrl && (
                <Image
                  src={liffProfile.pictureUrl}
                  alt={user.FullName}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {user.FullName}
                </p>
                <p className="text-sm text-gray-600">{user.CompanyName}</p>
                <p className="text-sm text-gray-500">{user.PhoneNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            กรองตามวันที่สร้างคำขอ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="input w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleResetFilter}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                ล้างการกรอง
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="text-gray-600">
              ทั้งหมด: <span className="font-semibold">{permits.length}</span> รายการ
            </p>
            {(startDate || endDate) && (
              <p className="text-primary-600 font-medium">
                แสดง: <span className="font-semibold">{filteredPermits.length}</span> รายการ
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Permits List */}
        {filteredPermits.length === 0 ? (
          <div className="card text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
            <p className="text-gray-600 mb-4">
              {startDate || endDate ? 'ไม่พบรายการคำขอในช่วงเวลาที่เลือก' : 'ยังไม่มีรายการคำขอ'}
            </p>
            {!startDate && !endDate && (
              <button
                onClick={() => router.push('/permit/create')}
                className="btn-primary mx-auto"
              >
                สร้างคำขอแรก
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPermits.map((permit) => (
              <div key={permit.PermitId} className="card hover:shadow-lg transition-shadow">
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {permit.PermitNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(permit.CreatedDate), 'dd MMM yyyy HH:mm', {
                        locale: th,
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      permit.Status
                    )}`}
                  >
                    {permit.Status}
                  </span>
                </div>

                {/* Permit Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">เจ้าของงาน</p>
                    <p className="font-medium text-gray-900">
                      {permit.OwnerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">บริษัท</p>
                    <p className="font-medium text-gray-900">
                      {permit.CompanyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">พื้นที่</p>
                    <p className="font-medium text-gray-900">
                      {permit.AreaName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">ประเภทงาน</p>
                    <p className="font-medium text-gray-900">
                      {permit.WorkTypeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">ช่วงเวลา</p>
                    <p className="font-medium text-gray-900">
                      {permit.WorkShift}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">ระยะเวลา</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(permit.StartDate), 'dd/MM/yyyy')} -{' '}
                      {format(new Date(permit.EndDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                {permit.Remarks && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">หมายเหตุ</p>
                    <p className="text-sm text-gray-900">{permit.Remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
