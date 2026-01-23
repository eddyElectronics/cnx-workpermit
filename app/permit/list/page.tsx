'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { useUserStore } from '@/lib/store'
import { apiService, WorkPermit } from '@/lib/api'
import { liffService } from '@/lib/liff'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function PermitListPage() {
  const router = useRouter()
  const { user, liffProfile, setUser, clearUser } = useUserStore()
  const [permits, setPermits] = useState<WorkPermit[]>([])
  const [filteredPermits, setFilteredPermits] = useState<WorkPermit[]>([])
  const [filterDate, setFilterDate] = useState<string>('')
  const [showApproved, setShowApproved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Audit modal state
  const initialAuditChecks = {
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
  }
  const [auditPermitId, setAuditPermitId] = useState<number | null>(null)
  const [auditChecks, setAuditChecks] = useState<typeof initialAuditChecks>({ ...initialAuditChecks })
  const [auditRemarks, setAuditRemarks] = useState('')
  const [auditInfo, setAuditInfo] = useState<{ auditedByName: string; auditDate: string; isExisting: boolean } | null>(null)
  const [savingAudit, setSavingAudit] = useState(false)
  const [auditedPermits, setAuditedPermits] = useState<Set<number>>(new Set())

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

  const handleSaveFullName = async () => {
    if (!newFullName.trim() || !user) return
    
    setSavingName(true)
    try {
      const response = await fetch('/api/user/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.UserId,
          fullName: newFullName.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update name')
      }

      const result = await response.json()
      
      // Update local user state
      setUser({ ...user, FullName: newFullName.trim() })
      setEditingName(false)
      alert('อัปเดตชื่อเรียบร้อยแล้ว')
    } catch (err) {
      console.error('Failed to update name:', err)
      alert('ไม่สามารถอัปเดตชื่อได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSavingName(false)
    }
  }
const handleCopyLineUserId = async () => {
    if (!user?.LineUserId) return
    
    try {
      await navigator.clipboard.writeText(user.LineUserId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenAudit = async (permitId: number) => {
    setAuditPermitId(permitId)
    setAuditChecks({ ...initialAuditChecks })
    setAuditRemarks('')
    setAuditInfo(null)
    
    // Load existing audit data
    try {
      const response = await fetch(`/api/audit?permitId=${permitId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          const audit = result.data[0] // Get the most recent audit
          
          // Populate checkboxes
          setAuditChecks({
            helmet: audit.Helmet === 1 || audit.Helmet === true,
            earPlugs: audit.EarPlugs === 1 || audit.EarPlugs === true,
            glasses: audit.Glasses === 1 || audit.Glasses === true,
            mask: audit.Mask === 1 || audit.Mask === true,
            chemicalSuit: audit.ChemicalSuit === 1 || audit.ChemicalSuit === true,
            gloves: audit.Gloves === 1 || audit.Gloves === true,
            safetyShoes: audit.SafetyShoes === 1 || audit.SafetyShoes === true,
            belt: audit.Belt === 1 || audit.Belt === true,
            safetyRope: audit.SafetyRope === 1 || audit.SafetyRope === true,
            reflectiveVest: audit.ReflectiveVest === 1 || audit.ReflectiveVest === true,
            areaBarrier: audit.AreaBarrier === 1 || audit.AreaBarrier === true,
            equipmentStrength: audit.EquipmentStrength === 1 || audit.EquipmentStrength === true,
            standardInstallation: audit.StandardInstallation === 1 || audit.StandardInstallation === true,
            toolReadiness: audit.ToolReadiness === 1 || audit.ToolReadiness === true,
            fireExtinguisher: audit.FireExtinguisher === 1 || audit.FireExtinguisher === true,
            electricalCutoff: audit.ElectricalCutoff === 1 || audit.ElectricalCutoff === true,
            alarmSystemOff: audit.AlarmSystemOff === 1 || audit.AlarmSystemOff === true,
            undergroundCheck: audit.UndergroundCheck === 1 || audit.UndergroundCheck === true,
            chemicalCheck: audit.ChemicalCheck === 1 || audit.ChemicalCheck === true,
            pressureCheck: audit.PressureCheck === 1 || audit.PressureCheck === true,
            authorizer: audit.Authorizer === 1 || audit.Authorizer === true,
            assistant: audit.Assistant === 1 || audit.Assistant === true,
            supervisor: audit.Supervisor === 1 || audit.Supervisor === true,
            worker: audit.Worker === 1 || audit.Worker === true,
          })
          
          setAuditRemarks(audit.Remarks || '')
          
          // Set audit info
          setAuditInfo({
            auditedByName: audit.AuditedByName || 'Unknown',
            auditDate: new Date(audit.AuditDate).toLocaleString('th-TH'),
            isExisting: true
          })
        }
      }
    } catch (err) {
      console.error('Failed to load existing audit:', err)
    }
  }

  const handleSaveAudit = async () => {
    if (!auditPermitId || !user) return
    
    setSavingAudit(true)
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permitId: auditPermitId,
          auditedBy: user.UserId,
          auditedByName: user.FullName,
          remarks: auditRemarks,
          auditDate: new Date().toISOString(),
          ...auditChecks
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save audit')
      }

      alert('บันทึกผลการตรวจสอบเรียบร้อยแล้ว')
      // Update audited permits set
      setAuditedPermits(prev => new Set([...prev, auditPermitId]))
      setAuditPermitId(null)
      setAuditChecks({ ...initialAuditChecks })
      setAuditRemarks('')
    } catch (err) {
      console.error('Failed to save audit:', err)
      alert('ไม่สามารถบันทึกผลการตรวจสอบได้')
    } finally {
      setSavingAudit(false)
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
        
        // Load audit status for approved permits
        const approvedPermits = data.filter(p => p.Status === 'อนุมัติ')
        const auditedIds = new Set<number>()
        
        for (const permit of approvedPermits) {
          try {
            const response = await fetch(`/api/audit?permitId=${permit.PermitId}`)
            if (response.ok) {
              const result = await response.json()
              if (result.success && result.data && result.data.length > 0) {
                auditedIds.add(permit.PermitId)
              }
            }
          } catch (err) {
            console.error(`Failed to check audit for permit ${permit.PermitId}:`, err)
          }
        }
        
        setAuditedPermits(auditedIds)
      } catch (err) {
        console.error('Failed to load permits:', err)
        setError('ไม่สามารถโหลดข้อมูลได้')
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
  }, [permits, filterDate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'รอตรวจสอบ':
        return 'bg-yellow-200 text-yellow-900 border-yellow-300'
      case 'อนุมัติ':
        return 'bg-green-200 text-green-900 border-green-300'
      case 'ไม่อนุมัติ':
        return 'bg-red-200 text-red-900 border-red-300'
      case 'ยกเลิก':
        return 'bg-gray-200 text-gray-900 border-gray-300'
      default:
        return 'bg-gray-200 text-gray-900 border-gray-300'
    }
  }

  if (loading) {
    return <LoadingSpinner message="กำลังโหลดข้อมูล..." />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 p-2 sm:p-4 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto py-4 sm:py-8 w-full px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {showApproved ? 'รายการตรวจสอบ' : 'รายการคำขอของฉัน'}
          </h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowApproved(!showApproved)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showApproved
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showApproved ? '← กลับรายการทั้งหมด' : '🔍 ตรวจสอบ (อนุมัติ)'}
            </button>
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
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-2">
                {liffProfile?.pictureUrl && (
                  <Image
                    src={liffProfile.pictureUrl}
                    alt={user.FullName}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                )}
                {!editingName && (
                  <button
                    onClick={() => {
                      setNewFullName(user.FullName)
                      setEditingName(true)
                    }}
                    className="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    แก้ไข
                  </button>
                )}
              </div>
              <div className="flex-1">
                <div>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="ชื่อ-นามสกุล"
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveFullName}
                        disabled={savingName || !newFullName.trim()}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-sm"
                      >
                        {savingName ? 'กำลังบันทึก...' : '✓'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false)
                          setNewFullName('')
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="text-lg font-medium text-gray-900">
                      {user.FullName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">{user.CompanyName}</p>
                  <p className="text-sm text-gray-500">{user.PhoneNumber}</p>
                  
                  {/* LINE User ID */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-gray-400" style={{ fontSize: '6px' }}>LINE ID:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-gray-600" style={{ fontSize: '6px' }}>
                      {user.LineUserId}
                    </code>
                    <button
                      onClick={handleCopyLineUserId}
                      className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors flex items-center gap-1"
                      title="Copy LINE User ID"
                    >
                      {copied ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="card mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">
              วันที่ในช่วงระยะเวลาขออนุญาต:
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                ล้างตัวกรอง
              </button>
            )}
            <span className="text-sm text-gray-500">
              {filterDate ? `กรองแล้ว ${filteredPermits.filter(p => !showApproved || p.Status === 'อนุมัติ').length} รายการ` : `ทั้งหมด ${permits.length} รายการ`}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Permits List */}
        {showApproved ? (
          /* Approved Permits for Audit */
          filteredPermits.filter(p => p.Status === 'อนุมัติ').length === 0 ? (
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
              <p className="text-gray-600 mb-4">ไม่มีรายการที่ต้องตรวจสอบ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPermits.filter(p => p.Status === 'อนุมัติ').map((permit) => (
                <div key={permit.PermitId} className="card hover:shadow-lg transition-shadow bg-green-100">
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
                    <span className="px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
                      {permit.Status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">เจ้าของงาน</p>
                      <p className="font-medium text-gray-900">{permit.OwnerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">บริษัท</p>
                      <p className="font-medium text-gray-900">{permit.CompanyName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">พื้นที่</p>
                      <p className="font-medium text-gray-900">{permit.AreaName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ประเภทงาน</p>
                      <p className="font-medium text-gray-900">{permit.WorkTypeName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ช่วงเวลา</p>
                      <p className="font-medium text-gray-900">{permit.WorkShift}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ระยะเวลา</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(permit.StartDate), 'dd/MM/yyyy')} - {format(new Date(permit.EndDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>

                  {permit.Remarks && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-500">หมายเหตุ</p>
                      <p className="text-sm text-gray-900">{permit.Remarks}</p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleOpenAudit(permit.PermitId)}
                      className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
                        auditedPermits.has(permit.PermitId)
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {auditedPermits.has(permit.PermitId) ? '✓ ตรวจสอบแล้ว' : '📋 รอตรวจสอบ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredPermits.length === 0 ? (
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
            <p className="text-gray-600 mb-4">ยังไม่มีรายการคำขอ</p>
            <button
              onClick={() => router.push('/permit/create')}
              className="btn-primary mx-auto"
            >
              สร้างคำขอแรก
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPermits.map((permit) => (
              <div key={permit.PermitId} className={`card hover:shadow-lg transition-shadow ${permit.Status === 'อนุมัติ' ? 'bg-green-100' : permit.Status === 'ไม่อนุมัติ' ? 'bg-red-100' : ''}`}>
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
        {/* Audit Modal */}
        {auditPermitId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
            onClick={() => setAuditPermitId(null)}
          >
            <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                <h3 className="text-lg font-semibold">ตรวจสอบความปลอดภัย</h3>
                <button
                  onClick={() => setAuditPermitId(null)}
                  className="text-white hover:text-gray-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              {/* Audit Info Banner */}
              {auditInfo && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">บันทึกครั้งล่าสุด:</span> {auditInfo.auditedByName} 
                    <span className="mx-2">•</span>
                    <span>{auditInfo.auditDate}</span>
                  </p>
                </div>
              )}
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    คำขอ: <span className="font-semibold text-gray-900">
                      {permits.find(p => p.PermitId === auditPermitId)?.PermitNumber}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    เจ้าของงาน: <span className="font-semibold text-gray-900">
                      {permits.find(p => p.PermitId === auditPermitId)?.OwnerName}
                    </span>
                  </p>
                </div>

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
        )}      </div>
    </div>
  )
}
