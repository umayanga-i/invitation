'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="iv-state-page"><span aria-hidden="true" className="iv-state-icon">✉</span><h1>Something went wrong.</h1><p>Please try again. Your invitation details are still safe.</p><button className="iv-state-link" onClick={() => reset()}>Try again ↻</button></main>; }
