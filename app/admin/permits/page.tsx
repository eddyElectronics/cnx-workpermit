'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useUserStore } from '@/lib/store'
import { apiService, WorkPermit } from '@/lib/api'
import { PERMIT_STATUS } from '@/lib/config'
import { liffService } from '@/lib/liff'

export default function AdminPermitsPage() {
  const router = useRouter()
  const { user, liffProfile, clearUser } = useUserStore()
  const [permits, setPermits] = useState<WorkPermit[]>([])
  const [filteredPermits, setFilteredPermits] = useState<WorkPermit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [previewPermitId, setPreviewPermitId] = useState<number | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0])
  
  // Audit states
  const [auditPermitId, setAuditPermitId] = useState<number | null>(null)
  const [savingAudit, setSavingAudit] = useState(false)
  const [auditChecks, setAuditChecks] = useState({
    helmet: false,
    earPlugs: false,
    glasses: false,
    mask: false,
    chemicalSuit: false,
    gloves: false,
    safetyShoes: false,
    belt: false,
    safetyRope: false,
    reflectiveVest: false,
    areaBarrier: false,
    equipmentStrength: false,
    standardInstallation: false,
    toolReadiness: false,
    fireExtinguisher: false,
    electricalCutoff: false,
    alarmSystemOff: false,
    undergroundCheck: false,
    chemicalCheck: false,
    pressureCheck: false,
    authorizer: false,
    assistant: false,
    supervisor: false,
    worker: false,
  })
  const [auditRemarks, setAuditRemarks] = useState('')

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

    // Check if user is admin
    if (!user.IsAdmin) {
      router.push('/')
      return
    }

    loadPendingPermits()
  }, [user, liffProfile, router])

  // Filter permits based on selected date
  useEffect(() => {
    if (!filterDate) {
      setFilteredPermits(permits)
      return
    }

    const filtered = permits.filter(permit => {
      if (!permit.StartDate || !permit.EndDate) return false
      
      const selectedDate = new Date(filterDate)
      const startDate = new Date(permit.StartDate)
      const endDate = new Date(permit.EndDate)
      
      // Check if selected date falls within the work period
      return selectedDate >= startDate && selectedDate <= endDate
    })
    
    setFilteredPermits(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [permits, filterDate])

  const loadPendingPermits = async (forceReload = false) => {
    if (forceReload) {
      setLoading(true)
    }
    try {
      const result = await apiService.getAllWorkPermits()
      console.log('All permits result:', result)
      
      // Handle API response structure { data: [...] }
      const data = Array.isArray(result) ? result : (result as { data: WorkPermit[] })?.data || []
      setPermits(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load permits:', err)
      setError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (permitId: number) => {
    setLoadingDocs(true)
    setPreviewPermitId(permitId)
    try {
      const result = await apiService.getPermitDocuments(permitId)
      const docs = Array.isArray(result) ? result : (result as { data: any[] })?.data || []
      setDocuments(docs)
    } catch (err) {
      console.error('Failed to load documents:', err)
      alert('ไม่สามารถโหลดเอกสารได้')
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleUpdateStatus = async (permitId: number, newStatus: string) => {
    if (!user) return

    // Confirm dialog
    const confirmMessage = newStatus === PERMIT_STATUS.APPROVED 
      ? 'คุณต้องการอนุมัติคำขอนี้หรือไม่?' 
      : 'คุณต้องการไม่อนุมัติคำขอนี้หรือไม่?'
    
    if (!confirm(confirmMessage)) {
      return
    }

    // Disable button by setting updatingId
    setUpdatingId(permitId)
    
    try {
      // Find the permit to get details for notification
      const permit = permits.find(p => p.PermitId === permitId)
      
      // Step 1: Update status in database (wait for API response)
      console.log('Updating status in database...')
      await apiService.updateWorkPermitStatus(permitId, newStatus, user.UserId)
      console.log('Status updated successfully in database')
      
      // Step 2: Update local state immediately after API success
      setPermits(prevPermits => 
        prevPermits.map(p => 
          p.PermitId === permitId 
            ? { ...p, Status: newStatus }
            : p
        )
      )
      console.log('Local state updated with new status')
      
      // Step 3: Send LINE notification to user (don't wait)
      if (permit) {
        fetch('/api/line/notify-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lineUserId: permit.LineUserId,
            permitNumber: permit.PermitNumber,
            ownerName: permit.OwnerName,
            companyName: permit.CompanyName,
            area: permit.AreaName,
            workType: permit.WorkTypeName,
            status: newStatus,
            approvedBy: user.FullName
          }),
        })
        .then(() => console.log('User notification sent successfully'))
        .catch(notifyErr => console.error('Failed to send user notification:', notifyErr))
      }
      
      // Step 4: Clear updating state and show success message
      setUpdatingId(null)
      alert(`${newStatus === PERMIT_STATUS.APPROVED ? 'อนุมัติ' : 'ไม่อนุมัติ'}เรียบร้อยแล้ว\nได้ส่งแจ้งเตือนไปยังผู้ขอใบอนุญาตแล้ว`)
    } catch (err) {
      console.error('Failed to update status:', err)
      setUpdatingId(null)
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    }
  }

  const handleOpenAudit = (permitId: number) => {
    setAuditPermitId(permitId)
    // Reset audit form
    setAuditChecks({
      helmet: false,
      earPlugs: false,
      glasses: false,
      mask: false,
      chemicalSuit: false,
      gloves: false,
      safetyShoes: false,
      belt: false,
      safetyRope: false,
      reflectiveVest: false,
      areaBarrier: false,
      equipmentStrength: false,
      standardInstallation: false,
      toolReadiness: false,
      fireExtinguisher: false,
      electricalCutoff: false,
      alarmSystemOff: false,
      undergroundCheck: false,
      chemicalCheck: false,
      pressureCheck: false,
      authorizer: false,
      assistant: false,
      supervisor: false,
      worker: false,
    })
    setAuditRemarks('')
  }

  const handleSaveAudit = async () => {
    if (!auditPermitId || !user) return

    setSavingAudit(true)
    try {
      console.log('Saving audit for permit:', auditPermitId, 'by user:', user.UserId)
      console.log('Audit checks:', auditChecks)
      
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permitId: auditPermitId,
          auditedBy: user.UserId,
          ...auditChecks,
          remarks: auditRemarks || null
        })
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API error response:', errorData)
        throw new Error(errorData.error || 'Failed to save audit')
      }

      const result = await response.json()
      console.log('Audit saved successfully:', result)
      
      alert('บันทึกการตรวจสอบเรียบร้อยแล้ว')
      setAuditPermitId(null)
    } catch (error: any) {
      console.error('Failed to save audit:', error)
      alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.message || 'Unknown error'}`)
    } finally {
      setSavingAudit(false)
    }
  }

  // Pagination - use filteredPermits instead of permits
  const totalPages = Math.ceil(filteredPermits.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPermits = filteredPermits.slice(startIndex, endIndex)
  const pendingCount = permits.filter(p => p.Status === PERMIT_STATUS.PENDING).length

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
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              อนุมัติคำขอเข้าปฏิบัติงาน
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              ทั้งหมด {permits.length} รายการ | รอตรวจสอบ {pendingCount} รายการ
              {filterDate && ` | กรองแล้ว ${filteredPermits.length} รายการ`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              กลับหน้าหลัก
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">
              วันที่ในช่วงระยะเวลาขออนุญาต:
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setFilterDate('')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              แสดงทั้งหมด
            </button>
          </div>
        </div>

        {/* Admin Profile */}
        {liffProfile && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex items-center gap-3">
              {liffProfile.pictureUrl && (
                <Image
                  src={liffProfile.pictureUrl}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-semibold">{user?.FullName}</p>
                <p className="text-xs text-primary-600">👑 ผู้ดูแลระบบ</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Permits List */}
        {filteredPermits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">
              {filterDate ? 'ไม่มีคำขอที่ตรงกับวันที่ที่เลือก' : 'ไม่มีคำขอเข้าปฏิบัติงาน'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentPermits.map((permit) => (
              <div
                key={permit.PermitId}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {permit.PermitNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(permit.CreatedDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    permit.Status === PERMIT_STATUS.PENDING ? 'bg-yellow-100 text-yellow-800' :
                    permit.Status === PERMIT_STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                    permit.Status === PERMIT_STATUS.REJECTED ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {permit.Status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">เจ้าของงาน</p>
                    <p className="font-medium text-gray-900">{permit.OwnerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">บริษัท</p>
                    <p className="font-medium text-gray-900">{permit.CompanyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">พื้นที่</p>
                    <p className="font-medium text-gray-900">{permit.AreaName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ประเภทงาน</p>
                    <p className="font-medium text-gray-900">{permit.WorkTypeName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ช่วงเวลา</p>
                    <p className="font-medium text-gray-900">{permit.WorkShift}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ระยะเวลา</p>
                    <p className="font-medium text-gray-900">
                      {new Date(permit.StartDate).toLocaleDateString('th-TH')} -{' '}
                      {new Date(permit.EndDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                {/* Remarks */}
                {permit.Remarks && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                    <p className="text-sm text-gray-900">{permit.Remarks}</p>
                  </div>
                )}

                {/* Documents */}
                {permit.DocumentCount && permit.DocumentCount > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => loadDocuments(permit.PermitId)}
                      className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded transition-colors text-left flex items-center justify-between"
                    >
                      <span className="text-sm text-blue-700">
                        📎 เอกสารแนบ: {permit.DocumentCount} ไฟล์
                      </span>
                      <span className="text-blue-600">คลิกเพื่อดู →</span>
                    </button>
                  </div>
                )}

                {permit.Status === PERMIT_STATUS.PENDING && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleUpdateStatus(permit.PermitId, PERMIT_STATUS.APPROVED)}
                      disabled={updatingId === permit.PermitId}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingId === permit.PermitId ? 'กำลังอัปเดต...' : '✓ อนุมัติ'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(permit.PermitId, PERMIT_STATUS.REJECTED)}
                      disabled={updatingId === permit.PermitId}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingId === permit.PermitId ? 'กำลังอัปเดต...' : '✕ ไม่อนุมัติ'}
                    </button>
                  </div>
                )}

                {/* Audit Button for Approved Permits */}
                {permit.Status === PERMIT_STATUS.APPROVED && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleOpenAudit(permit.PermitId)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🔍 ตรวจสอบ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← ก่อนหน้า
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </>
        )}

        {/* Documents Preview Modal */}
        {previewPermitId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setPreviewPermitId(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">เอกสารแนบ</h3>
                <button
                  onClick={() => setPreviewPermitId(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {loadingDocs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลดเอกสาร...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">ไม่มีเอกสารแนบ</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.DocumentId} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        {doc.DocumentType.startsWith('image/') ? (
                          <div 
                            className="cursor-pointer"
                            onClick={() => setSelectedImage(doc.DocumentPath)}
                          >
                            <img
                              src={doc.DocumentPath}
                              alt={doc.DocumentName}
                              className="w-full h-48 object-cover"
                            />
                            <div className="p-2 bg-gray-50">
                              <p className="text-xs text-gray-700 truncate">{doc.DocumentName}</p>
                              <p className="text-xs text-gray-500">{(doc.FileSize / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={doc.DocumentPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-center h-48 bg-gray-100">
                              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="p-2 bg-gray-50">
                              <p className="text-xs text-gray-700 truncate">{doc.DocumentName}</p>
                              <p className="text-xs text-gray-500">{(doc.FileSize / 1024).toFixed(1)} KB</p>
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-7xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 text-2xl"
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </div>
        )}

        {/* Audit Modal */}
        {auditPermitId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setAuditPermitId(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                <h3 className="text-lg font-semibold">ตรวจสอบความปลอดภัย</h3>
                <button
                  onClick={() => setAuditPermitId(null)}
                  className="text-white hover:text-gray-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* อุปกรณ์ป้องกันส่วนบุคคล (PPE) */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">อุปกรณ์ป้องกันส่วนบุคคล (PPE)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'helmet', label: 'หมวก' },
                        { key: 'earPlugs', label: 'ที่อุดหู' },
                        { key: 'glasses', label: 'แว่นตา' },
                        { key: 'mask', label: 'หน้ากาก' },
                        { key: 'chemicalSuit', label: 'ชุดป้องกันสารเคมี' },
                        { key: 'gloves', label: 'ถุงมือ' },
                        { key: 'safetyShoes', label: 'รองเท้า' },
                        { key: 'belt', label: 'เข็มขัด' },
                        { key: 'safetyRope', label: 'เชือกนิรภัย' },
                        { key: 'reflectiveVest', label: 'เสื้อสะท้อนแสง' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={auditChecks[item.key as keyof typeof auditChecks]}
                            onChange={(e) => setAuditChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* การจัดการพื้นที่และอุปกรณ์ */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">การจัดการพื้นที่และอุปกรณ์</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'areaBarrier', label: 'กั้นพื้นที่' },
                        { key: 'equipmentStrength', label: 'ความแข็งแรงของอุปกรณ์' },
                        { key: 'standardInstallation', label: 'การติดตั้งตามมาตรฐาน' },
                        { key: 'toolReadiness', label: 'ความพร้อมเครื่องมือ' },
                        { key: 'fireExtinguisher', label: 'อุปกรณ์ดับเพลิง' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={auditChecks[item.key as keyof typeof auditChecks]}
                            onChange={(e) => setAuditChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* การเตือนและตรวจสอบ */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">การเตือนและตรวจสอบ</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'electricalCutoff', label: 'เตือน ตัดกระแสไฟฟ้า' },
                        { key: 'alarmSystemOff', label: 'เตือน ปิดระบบแจงเตือน' },
                        { key: 'undergroundCheck', label: 'ตรวจความพร้อมใต้ดิน' },
                        { key: 'chemicalCheck', label: 'ตรวจสารเคมี' },
                        { key: 'pressureCheck', label: 'วัดความดัน' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={auditChecks[item.key as keyof typeof auditChecks]}
                            onChange={(e) => setAuditChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* บุคลากร */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">บุคลากร</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'authorizer', label: 'ผู้อนุญาต' },
                        { key: 'assistant', label: 'ผู้ช่วยเหลือ' },
                        { key: 'supervisor', label: 'ผู้ควบคุม' },
                        { key: 'worker', label: 'ผู้ปฏิบัติงาน' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={auditChecks[item.key as keyof typeof auditChecks]}
                            onChange={(e) => setAuditChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* หมายเหตุ */}
                  <div>
                    <label className="block font-semibold text-gray-900 mb-2">หมายเหตุ</label>
                    <textarea
                      value={auditRemarks}
                      onChange={(e) => setAuditRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="ระบุข้อมูลเพิ่มเติม (ถ้ามี)"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => setAuditPermitId(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={savingAudit}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveAudit}
                  disabled={savingAudit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingAudit ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
