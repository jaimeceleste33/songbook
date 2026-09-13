'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export function SearchBox({
  placeholder,
  defaultValue,
}: {
  placeholder: string
  defaultValue: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  const [, startTransition] = useTransition()

  // Debounced so typing on the iPad doesn't fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params)
      if (value.trim()) next.set('q', value.trim())
      else next.delete('q')
      startTransition(() => router.replace(`?${next.toString()}`, { scroll: false }))
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-brand"
    />
  )
}
