export default function LoadingSpinner({ 
  message = 'กำลังโหลด...', 
  children 
}: { 
  message?: string
  children?: React.ReactNode 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          {/* Outer spinning circle */}
          <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
          {/* Inner spinning arc */}
          <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
        {children}
      </div>
    </div>
  )
}
