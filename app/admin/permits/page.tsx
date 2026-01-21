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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [previewPermitId, setPreviewPermitId] = useState<number | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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

  const loadPendingPermits = async () => {
    try {
      const result = await apiService.getAllWorkPermits()
      console.log('All permits result:', result)
      
      // Handle API response structure { data: [...] }
      const data = Array.isArray(result) ? result : (result as { data: WorkPermit[] })?.data || []
      setPermits(data)
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

    setUpdatingId(permitId)
    try {
      // Find the permit to get details
      const permit = permits.find(p => p.PermitId === permitId)
      
      // Update status
      await apiService.updateWorkPermitStatus(permitId, newStatus, user.UserId)
      
      // Send LINE notification to user
      if (permit) {
        try {
          await fetch('/api/line/notify-user', {
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
              approvedBy: user.FirstName + ' ' + user.LastName
            }),
          })
          console.log('User notification sent successfully')
        } catch (notifyErr) {
          console.error('Failed to send user notification:', notifyErr)
          // Don't block the main flow if notification fails
        }
      }
      
      // Reload list to show updated status
      await loadPendingPermits()
      
      // Show success message
      alert(`${newStatus === PERMIT_STATUS.APPROVED ? 'อนุมัติ' : 'ไม่อนุมัติ'}เรียบร้อยแล้ว\nได้ส่งแจ้งเตือนไปยังผู้ขอใบอนุญาตแล้ว`)
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    } finally {
      setUpdatingId(null)
    }
  }

  // Pagination
  const totalPages = Math.ceil(permits.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPermits = permits.slice(startIndex, endIndex)
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
        {permits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">ไม่มีคำขอเข้าปฏิบัติงาน</p>
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
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {permit.Status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">เจ้าของงาน</p>
                    <p className="font-medium">{permit.OwnerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">บริษัท</p>
                    <p className="font-medium">{permit.CompanyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">พื้นที่</p>
                    <p className="font-medium">{permit.AreaName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ประเภทงาน</p>
                    <p className="font-medium">{permit.WorkTypeName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ช่วงเวลา</p>
                    <p className="font-medium">{permit.WorkShift}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ระยะเวลา</p>
                    <p className="font-medium">
                      {new Date(permit.StartDate).toLocaleDateString('th-TH')} -{' '}
                      {new Date(permit.EndDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                {/* Remarks */}
                {permit.Remarks && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                    <p className="text-sm">{permit.Remarks}</p>
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
      </div>
    </div>
  )
}
