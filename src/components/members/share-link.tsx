'use client'

import { useState } from 'react'

/** A link to hand over by WhatsApp: copy it, or open WhatsApp with it. */
export function ShareLink({ link, message }: { link: string; message: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      // Clipboard blocked: the link is on screen and selectable anyway.
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-brand/40 bg-brand/10 p-3">
      <p className="break-all font-mono text-xs">{link}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium"
        >
          {copied ? '¡Copiado!' : 'Copiar link'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-black"
        >
          Mandar por WhatsApp
        </a>
      </div>
      <p className="mt-2 text-xs text-muted">Sirve una sola vez. Si se pierde, generá otro.</p>
    </div>
  )
}
