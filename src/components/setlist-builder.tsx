'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { reorderSetlist } from '@/lib/actions/setlists'

type Chosen = {
  songId: string
  title: string
  artist: string | null
  songKey: string | null
}

type LibraryItem = { id: string; title: string; artist: string | null }

export function SetlistBuilder({
  setlistId,
  chosen,
  library,
}: {
  setlistId: string
  chosen: Chosen[]
  library: LibraryItem[]
}) {
  const [items, setItems] = useState(chosen)
  const [query, setQuery] = useState('')
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /** Optimistic: reorder locally, then persist the full order. */
  const persist = (next: Chosen[]) => {
    setItems(next)
    startTransition(() => {
      void reorderSetlist(setlistId, next.map((i) => i.songId))
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.songId === active.id)
    const to = items.findIndex((i) => i.songId === over.id)
    if (from < 0 || to < 0) return
    persist(arrayMove(items, from, to))
  }

  const add = (song: LibraryItem) => {
    if (items.some((i) => i.songId === song.id)) return
    persist([...items, { songId: song.id, title: song.title, artist: song.artist, songKey: null }])
  }

  const remove = (songId: string) => persist(items.filter((i) => i.songId !== songId))

  const chosenIds = new Set(items.map((i) => i.songId))
  const available = library
    .filter((s) => !chosenIds.has(s.id))
    .filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-2 font-medium">
          Orden del repertorio{' '}
          <span className="font-normal text-muted">({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
            Elegí canciones de la librería. El orden que armes acá es el orden en que las
            vas a ir pasando cuando cantes.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.songId)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-2">
                {items.map((item, index) => (
                  <SortableSong
                    key={item.songId}
                    item={item}
                    index={index}
                    onRemove={() => remove(item.songId)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-medium">Agregar de la librería</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base outline-none focus:border-brand"
        />

        {library.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
            Tu librería está vacía.{' '}
            <Link href="/library/new" className="text-brand underline">
              Cargá una canción
            </Link>{' '}
            primero.
          </p>
        ) : available.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
            {query ? 'No hay coincidencias.' : 'Ya agregaste todas las canciones.'}
          </p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto rounded-2xl border border-border bg-surface">
            {available.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  onClick={() => add(song)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{song.title}</span>
                    {song.artist ? (
                      <span className="block truncate text-xs text-muted">{song.artist}</span>
                    ) : null}
                  </span>
                  <span aria-hidden className="text-brand">+</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SortableSong({
  item,
  index,
  onRemove,
}: {
  item: Chosen
  index: number
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.songId })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 ${
        isDragging ? 'z-10 opacity-90 shadow-lg' : ''
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Mover ${item.title}`}
        className="cursor-grab touch-none px-1 text-muted active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="w-5 text-right text-sm tabular-nums text-muted">{index + 1}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        {item.artist ? (
          <span className="block truncate text-xs text-muted">{item.artist}</span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${item.title}`}
        className="rounded-lg px-2 py-1 text-muted transition hover:bg-surface-2 hover:text-red-400"
      >
        ✕
      </button>
    </li>
  )
}
