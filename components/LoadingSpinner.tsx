import Image from 'next/image'

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
        <div className="relative w-24 h-24 mx-auto mb-4">
          {/* Airplane image with rotation animation */}
          <div className="animate-spin">
            <Image
              src="/images/airplane.png"
              alt="Loading"
              width={96}
              height={96}
              className="w-24 h-24 object-contain"
              priority
            />
          </div>
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
        {children}
      </div>
    </div>
  )
}
