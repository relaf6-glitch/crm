'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <div className="w-14 h-14 bg-red-100 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-600" />
      </div>
      <h2 className="text-xl font-bold mb-2">אירעה שגיאה</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        {error.message || 'שגיאה לא צפויה. נסה שוב.'}
      </p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        נסה שוב
      </button>
    </div>
  )
}
