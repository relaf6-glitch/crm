import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="text-8xl font-black text-muted-foreground/20 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">הדף לא נמצא</h1>
      <p className="text-muted-foreground mb-6">הדף שחיפשת אינו קיים או הוסר</p>
      <Link
        href="/dashboard"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        חזור לדשבורד
      </Link>
    </div>
  )
}
