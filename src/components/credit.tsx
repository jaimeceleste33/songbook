/** The author's credit, shown quietly at the foot of the app and sign-in pages. */
export function Credit({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-muted/70 ${className}`}>
      Hecho con <span aria-label="cariño">♥</span> por{' '}
      <a
        href="https://dfagundez.dev"
        target="_blank"
        rel="noreferrer"
        className="font-medium text-muted underline-offset-4 transition hover:text-text hover:underline"
      >
        Diego Fagundez
      </a>
    </p>
  )
}
