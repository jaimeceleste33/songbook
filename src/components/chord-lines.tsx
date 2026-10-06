import type { SheetLine } from '@/lib/lyrics/chords'
import type { ChordStyles } from '@/lib/perform/sheet'

/**
 * Lyrics with their chords on top. `measureAll` in `layout.ts` builds this
 * same markup by hand to measure it: change one, change the other.
 */
export function ChordLines({ lines, styles }: { lines: SheetLine[]; styles: ChordStyles }) {
  return (
    <>
      {lines.map((line, i) => {
        if (line.kind === 'blank') return <div key={i} style={styles.blank} />
        if (line.kind === 'text') {
          return (
            <div key={i} style={styles.line}>
              {line.text}
            </div>
          )
        }
        if (line.kind === 'chords') {
          return (
            <div key={i} style={styles.chordRow}>
              {line.chords.map((chord, j) => (
                <span key={j} style={styles.chordRowItem}>
                  {chord}
                </span>
              ))}
            </div>
          )
        }
        return (
          <div key={i} style={styles.line}>
            {line.runs.map((run, j) => {
              if ('space' in run) return run.space
              if (run.word.every((p) => p.chord === null)) {
                return run.word.map((p) => p.text).join('')
              }
              return (
                <span key={j} style={styles.word}>
                  {run.word.map((piece, k) =>
                    piece.chord === null ? (
                      piece.text
                    ) : (
                      <span key={k} style={styles.anchor}>
                        <span style={styles.chord}>{piece.chord}</span>
                        {/* A chord over a gap still needs a line to sit on. */}
                        <span style={styles.syllable}>{piece.text || ' '}</span>
                      </span>
                    ),
                  )}
                </span>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
