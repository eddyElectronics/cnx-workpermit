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
      <div className="text-center w-full px-4">
        <div className="relative w-full max-w-3xl h-20 mx-auto mb-4 overflow-hidden">
          {/* Airplane flying animation from left to right */}
          <div className="absolute left-0 animate-[fly_2s_ease-in-out_infinite]">
            <Image
              src="/images/airplane.png"
              alt="Loading"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
        {children}
      </div>
      <style jsx>{`
        @keyframes fly {
          0% {
            transform: translateX(-80px);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw - 80px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
