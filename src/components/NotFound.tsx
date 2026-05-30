import { Link } from '@tanstack/react-router'

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-6xl font-bold text-white sm:text-8xl">
        404
      </h1>
      <p className="mt-4 text-xl text-(--color-copy-soft)">
        Oops! The page you're looking for doesn't exist.
      </p>
      <div className="mt-10">
        <Link to="/" className="cta-primary">
          Back to Home
        </Link>
      </div>
    </main>
  )
}
