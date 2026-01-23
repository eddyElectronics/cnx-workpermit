'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserStore } from '@/lib/store'
import { apiService, Area, WorkType } from '@/lib/api'
import { WORK_SHIFTS } from '@/lib/config'
import { liffService } from '@/lib/liff'
import LoadingSpinner from '@/components/LoadingSpinner'

const permitSchema = z.object({
  ownerName: z.string().min(1, 'กรุณาระบุชื่อเจ้าของงาน'),
  companyName: z.string().min(1, 'กรุณาระบุชื่อบริษัท'),
  areaId: z.string().min(1, 'กรุณาเลือกพื้นที่'),
  workTypeId: z.string().min(1, 'กรุณาเลือกประเภทงาน'),
  workShift: z.string().min(1, 'กรุณาเลือกช่วงเวลา'),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มต้น'),
  endDate: z.string().min(1, 'กรุณาเลือกวันที่สิ้นสุด'),
  remarks: z.string().optional(),
}).refine((data) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(data.startDate)
  return start >= today
}, {
  message: 'วันที่เริ่มต้นต้องไม่ย้อนหลัง',
  path: ['startDate'],
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end >= start
}, {
  message: 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น',
  path: ['endDate'],
})

type PermitForm = z.infer<typeof permitSchema>

export default function CreatePermitPage() {
  const router = useRouter()
  const { user, liffProfile, clearUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [minStartDate, setMinStartDate] = useState('')
  const [minEndDate, setMinEndDate] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PermitForm>({
    resolver: zodResolver(permitSchema),
  })

  useEffect(() => {
    // Set minimum date to today
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    setMinStartDate(todayStr)
    setMinEndDate(todayStr)
  }, [])

  useEffect(() => {
    if (!user || !liffProfile) {
      router.push('/')
      return
    }

    // Pre-fill owner and company from user data
    setValue('ownerName', user.FullName)
    setValue('companyName', user.CompanyName)

    loadMasterData()
  }, [user, liffProfile, router, setValue])

  const loadMasterData = async () => {
    try {
      const [areasResult, workTypesResult] = await Promise.all([
        apiService.getAreas(),
        apiService.getWorkTypes(),
      ])
      
      console.log('Areas result:', areasResult)
      console.log('Work types result:', workTypesResult)
      
      // Handle API response structure { data: [...] }
      const areasData = Array.isArray(areasResult) ? areasResult : (areasResult as { data: Area[] })?.data || []
      const workTypesData = Array.isArray(workTypesResult) ? workTypesResult : (workTypesResult as { data: WorkType[] })?.data || []
      
      setAreas(areasData)
      setWorkTypes(workTypesData)
    } catch (err) {
      console.error('Failed to load master data:', err)
      setError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoadingData(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploadError(null)
    const fileArray = Array.from(files)
    
    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    const invalidTypes = fileArray.filter(f => !allowedTypes.includes(f.type))
    
    if (invalidTypes.length > 0) {
      setUploadError('รองรับเฉพาะไฟล์รูปภาพ JPG และ PNG เท่านั้น')
      return
    }
    
    // Validate file size (max 250KB per file)
    const maxSize = 250 * 1024
    const invalidFiles = fileArray.filter(f => f.size > maxSize)
    
    if (invalidFiles.length > 0) {
      setUploadError('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 250KB')
      return
    }

    setUploadedFiles(prev => [...prev, ...fileArray])
  }

  const handleUploadClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    fileInput?.click()
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value
    setValue('startDate', startDate)
    setMinEndDate(startDate) // Update minimum end date to match start date
  }

  const onSubmit = async (data: PermitForm) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Create Work Permit
      console.log('Creating work permit with data:', {
        UserId: user.UserId,
        OwnerName: data.ownerName,
        CompanyName: data.companyName,
        AreaId: parseInt(data.areaId),
        WorkTypeId: parseInt(data.workTypeId),
        WorkShift: data.workShift,
        StartDate: data.startDate,
        EndDate: data.endDate,
        Remarks: data.remarks || null,
      })
      
      const result = (await apiService.createWorkPermit({
        UserId: user.UserId,
        OwnerName: data.ownerName,
        CompanyName: data.companyName,
        AreaId: parseInt(data.areaId),
        WorkTypeId: parseInt(data.workTypeId),
        WorkShift: data.workShift,
        StartDate: data.startDate,
        EndDate: data.endDate,
        Remarks: data.remarks || undefined,
      })) as any
      
      console.log('Work permit created - Full response:', result)
      console.log('Result type:', typeof result)
      console.log('Result keys:', result ? Object.keys(result) : 'null')
      
      // Handle different response structures
      let permitData: any
      if (Array.isArray(result)) {
        permitData = result[0]
      } else if (result?.data && Array.isArray(result.data)) {
        permitData = result.data[0]
      } else if (result?.recordsets && result.recordsets[0]) {
        permitData = result.recordsets[0][0]
      } else {
        permitData = result
      }
      
      console.log('Extracted permit data:', permitData)

      const permitId = permitData?.PermitId
      const permitNumber = permitData?.PermitNumber
      
      console.log('PermitId:', permitId, 'PermitNumber:', permitNumber)
      
      if (!permitId || !permitNumber) {
        throw new Error('ไม่ได้รับ Permit ID หรือ Permit Number จากระบบ')
      }

      // Upload files if any
      if (uploadedFiles.length > 0 && permitId) {
        console.log('=== Starting file upload ===')
        console.log('Number of files:', uploadedFiles.length)
        console.log('PermitId:', permitId)
        
        const formData = new FormData()
        formData.append('permitId', permitId.toString())
        uploadedFiles.forEach((file, index) => {
          console.log(`Adding file ${index + 1}:`, file.name, file.size, 'bytes')
          formData.append('files', file)
        })

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        console.log('Upload response status:', uploadResponse.status)
        const uploadResult = await uploadResponse.json()
        console.log('Upload response:', uploadResult)
        
        if (!uploadResponse.ok || !uploadResult.success) {
          console.error('=== Upload Failed ===')
          console.error('Response:', uploadResult)
          console.error('Error:', uploadResult.error)
          console.error('Details:', uploadResult.details)
          
          // Log each error detail
          if (uploadResult.details && Array.isArray(uploadResult.details)) {
            uploadResult.details.forEach((detail: any, index: number) => {
              console.error(`Error ${index + 1}:`, detail)
            })
          }
          
          throw new Error(uploadResult.error || 'อัพโหลดไฟล์ไม่สำเร็จ')
        }
        
        console.log('=== File upload complete ===')
      }

      // Send LINE Notification to Admin
      try {
        await fetch('/api/line/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permitNumber: permitNumber,
            ownerName: data.ownerName,
            companyName: data.companyName,
            area: areas.find(a => a.AreaId === parseInt(data.areaId))?.AreaName,
            workType: workTypes.find(w => w.WorkTypeId === parseInt(data.workTypeId))?.WorkTypeName,
            workShift: data.workShift,
            startDate: data.startDate,
            endDate: data.endDate,
          }),
        })
      } catch (notifyErr) {
        console.error('Failed to send notification:', notifyErr)
      }

      // Success - redirect to list
      router.push('/permit/list')
    } catch (err) {
      console.error('Create permit error:', err)
      
      // Extract detailed error message
      let errorMessage = 'สร้างคำขอไม่สำเร็จ'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Try to extract more details from axios error
        const axiosError = err as any
        if (axiosError.response?.data) {
          const data = axiosError.response.data
          if (data.details) {
            try {
              const details = JSON.parse(data.details)
              errorMessage = details.error || data.error || errorMessage
            } catch (e) {
              errorMessage = data.details || data.error || errorMessage
            }
          } else if (data.error) {
            errorMessage = data.error
          }
        }
      }
      
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <LoadingSpinner message="กำลังโหลดข้อมูล..." />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-2 sm:px-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            สร้างคำขอเข้าปฏิบัติงาน
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/permit/list')}
              className="btn-secondary px-4 py-2 text-sm"
            >
              ดูรายการ
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        <div className="card">
          {/* User Info */}
          {user && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                {liffProfile?.pictureUrl && (
                  <Image
                    src={liffProfile.pictureUrl}
                    alt={user.FullName}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{user.FullName}</p>
                  <p className="text-sm text-gray-600">{user.CompanyName}</p>
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
            {/* Owner Name - Hidden */}
            <input type="hidden" {...register('ownerName')} />

            {/* Company Name */}
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

            {/* Area */}
            <div>
              <label className="label">
                พื้นที่เข้าทำงาน <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('areaId')}>
                <option value="">-- เลือกพื้นที่ --</option>
                {areas.map((area) => (
                  <option key={area.AreaId} value={area.AreaId}>
                    {area.AreaName}
                  </option>
                ))}
              </select>
              {errors.areaId && (
                <p className="error-text">{errors.areaId.message}</p>
              )}
            </div>

            {/* Work Type */}
            <div>
              <label className="label">
                ประเภทงาน <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('workTypeId')}>
                <option value="">-- เลือกประเภทงาน --</option>
                {workTypes.map((type) => (
                  <option key={type.WorkTypeId} value={type.WorkTypeId}>
                    {type.WorkTypeName}
                  </option>
                ))}
              </select>
              {errors.workTypeId && (
                <p className="error-text">{errors.workTypeId.message}</p>
              )}
            </div>

            {/* Work Shift */}
            <div>
              <label className="label">
                ช่วงเวลาเข้าทำงาน <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('workShift')}>
                <option value="">-- เลือกช่วงเวลา --</option>
                {WORK_SHIFTS.map((shift) => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
              {errors.workShift && (
                <p className="error-text">{errors.workShift.message}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  วันที่เริ่มต้น <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="input pl-10"
                    min={minStartDate}
                    {...register('startDate')}
                    onChange={handleStartDateChange}
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {errors.startDate && (
                  <p className="error-text">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  วันที่สิ้นสุด <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="input pl-10"
                    min={minEndDate}
                    {...register('endDate')}
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {errors.endDate && (
                  <p className="error-text">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="label">หมายเหตุ</label>
              <textarea
                className="input"
                rows={3}
                placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                {...register('remarks')}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="label">อัพโหลดเอกสารประกอบ</label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Image 
                  src="/images/upload.png" 
                  alt="Upload" 
                  width={24} 
                  height={24}
                />
                เลือกไฟล์
              </button>
              <p className="text-xs text-gray-500 mt-1">
                รองรับเฉพาะไฟล์รูปภาพ JPG, PNG (สูงสุด 250KB ต่อไฟล์)
              </p>
              {uploadError && (
                <p className="error-text">{uploadError}</p>
              )}
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0"
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกคำขอ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
