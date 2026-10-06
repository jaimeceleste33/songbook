import { hasChords, sheetLines } from '@/lib/lyrics/chords'
import { BLOCK_THEME } from '@/lib/lyrics/theme'
import type { SongContent } from '@/lib/lyrics/types'
import { lyricSegments, singerColor } from '@/lib/lyrics/voices'
import { chordStyles } from '@/lib/perform/sheet'
import { ChordLines } from './chord-lines'

/** Light blue: the stage's chord blue is unreadable on the dark editor. */
const CHORDS = chordStyles('#93c5fd')

/** The editor shows chords always: whoever edits a song has to see them to fix them. */
function Lyrics({ text }: { text: string }) {
  return hasChords(text) ? <ChordLines lines={sheetLines(text)} styles={CHORDS} /> : text
}

/** The song as it will be sung, parts in order. Read-only. */
export function SongPreview({ content, roster }: { content: SongContent; roster: string[] }) {
  const byId = new Map(content.blocks.map((b) => [b.id, b]))
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {content.flow.map((id, index) => {
        const block = byId.get(id)
        if (!block) return null
        const theme = BLOCK_THEME[block.kind]
        return (
          <div key={`${id}@${index}`} className="flex border-b border-border last:border-0">
            <div
              className="flex w-9 shrink-0 items-center justify-center py-3 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: theme.tab, writingMode: 'vertical-rl', rotate: '180deg' }}
            >
              {block.label}
            </div>
            <div
              className="flex-1 whitespace-pre-line px-4 py-3 text-sm leading-relaxed"
              style={{ background: theme.accent }}
            >
              {lyricSegments(block).map((segment, i) => {
                const gap = segment.gapBefore ? 'mt-[1.625em]' : ''
                if (segment.singer === null) {
                  return (
                    <div key={i} className={gap}>
                      <Lyrics text={segment.text} />
                    </div>
                  )
                }
                const color = singerColor(segment.singer, roster)
                return (
                  <div
                    key={i}
                    className={`my-1 rounded-r border-l-4 py-1 pl-3 text-muted ${gap}`}
                    style={{ borderColor: color, background: `${color}26` }}
                  >
                    <span
                      className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ background: color }}
                    >
                      {segment.singer}
                    </span>
                    <div>
                      <Lyrics text={segment.text} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
