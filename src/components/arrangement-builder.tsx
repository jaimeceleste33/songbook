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
import { BLOCK_THEME } from '@/lib/lyrics/theme'
import type { SongBlock } from '@/lib/lyrics/types'

/** Flow entries need keys unique per position, not per block. */
type Slot = { slotId: string; blockId: string }

export function ArrangementBuilder({
  blocks,
  flow,
  onChange,
}: {
  blocks: SongBlock[]
  flow: string[]
  onChange: (flow: string[]) => void
}) {
  const byId = new Map(blocks.map((b) => [b.id, b]))
  const slots: Slot[] = flow.map((blockId, i) => ({ slotId: `${blockId}@${i}`, blockId }))

  const sensors = useSensors(
    // A small distance so a tap still registers as a tap, not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = slots.findIndex((s) => s.slotId === active.id)
    const to = slots.findIndex((s) => s.slotId === over.id)
    if (from < 0 || to < 0) return
    onChange(arrayMove(slots, from, to).map((s) => s.blockId))
  }

  const removeAt = (index: number) => onChange(flow.filter((_, i) => i !== index))
  const append = (blockId: string) => onChange([...flow, blockId])

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* Palette: tap a part to append it to the order. */}
      <div>
        <p className="mb-2 text-sm font-medium">Partes de la canción</p>
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Escribí la letra con <code>Coro</code>, <code>Verso 1</code>… en su propio
            renglón y las partes aparecen acá.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blocks.map((block) => {
              const theme = BLOCK_THEME[block.kind]
              const times = flow.filter((id) => id === block.id).length
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => append(block.id)}
                  className="group flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm transition hover:border-brand active:scale-[0.98]"
                >
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ background: theme.tab }}
                  />
                  <span className="font-medium">{block.label}</span>
                  {times > 0 ? (
                    <span className="rounded-md bg-surface-2 px-1.5 text-xs text-muted">
                      ×{times}
                    </span>
                  ) : null}
                  <span aria-hidden className="text-muted group-hover:text-brand">
                    +
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* The order actually sung. */}
      <div>
        <p className="mb-2 text-sm font-medium">
          Orden en que se canta{' '}
          <span className="font-normal text-muted">
            ({flow.length} {flow.length === 1 ? 'parte' : 'partes'})
          </span>
        </p>

        {flow.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Tocá las partes de la izquierda para armar el orden. Podés repetir el coro
            las veces que haga falta.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slots.map((s) => s.slotId)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-1.5">
                {slots.map((slot, index) => {
                  const block = byId.get(slot.blockId)
                  if (!block) return null
                  return (
                    <SortableSlot
                      key={slot.slotId}
                      id={slot.slotId}
                      index={index}
                      block={block}
                      onRemove={() => removeAt(index)}
                    />
                  )
                })}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

function SortableSlot({
  id,
  index,
  block,
  onRemove,
}: {
  id: string
  index: number
  block: SongBlock
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const theme = BLOCK_THEME[block.kind]

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 ${
        isDragging ? 'z-10 opacity-90 shadow-lg' : ''
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Mover ${block.label}`}
        className="cursor-grab touch-none px-1 text-muted active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="w-5 text-right text-sm tabular-nums text-muted">{index + 1}</span>
      <span
        aria-hidden
        className="h-6 w-1.5 rounded-full"
        style={{ background: theme.tab }}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{block.label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${block.label} del orden`}
        className="rounded-lg px-2 py-1 text-muted transition hover:bg-surface-2 hover:text-red-400"
      >
        ✕
      </button>
    </li>
  )
}
