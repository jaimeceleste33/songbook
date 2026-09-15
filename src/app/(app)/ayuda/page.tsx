import Link from 'next/link'

export const metadata = { title: 'Ayuda · Songbook' }

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cómo funciona</h1>
        <p className="text-sm text-muted">
          Todo lo que necesitás saber, en una página.
        </p>
      </div>

      <Section title="1 · Cargar una canción">
        <p>
          Andá a <b>Librería → Nueva canción</b>, pegá la letra y poné el nombre de cada
          parte en su propio renglón:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 p-4 text-xs leading-relaxed">
{`Verso 1
El texto de la primera estrofa.

Coro
El texto del coro, una sola vez.`}
        </pre>
        <p className="mt-3">
          Los nombres que la app reconoce y colorea sola: <b>Verso</b>, <b>Coro</b>,{' '}
          <b>Pre-coro</b>, <b>Puente</b>, <b>Intro</b>, <b>Final</b> y <b>Tag</b>.
          Si usás otro nombre, escribilo entre corchetes —{' '}
          <code>[Instrumental]</code> — para que la app sepa que es una parte y no letra.
          Sale en gris.
        </p>
      </Section>

      <Section title="2 · Armar el orden">
        <p>
          Abajo del texto aparecen las partes que escribiste. Tocalas en el orden en que
          se cantan. Si el coro va tres veces, tocalo tres veces — no hace falta
          escribirlo de nuevo. Podés arrastrar para reordenar y tocar la ✕ para sacar una.
        </p>
      </Section>

      <Section title="3 · Armar el repertorio">
        <p>
          En <b>Repertorios</b> creás uno por cada vez que cantás, le ponés fecha y elegís
          las canciones de la librería en el orden que van.
        </p>
      </Section>

      <Section title="4 · Cantar">
        <p>Desde el repertorio tocás <b>▶ Cantar</b>. En esa pantalla:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Tocás el <b>lado derecho</b> para avanzar, el <b>izquierdo</b> para volver.</li>
          <li>
            También podés <b>arrastrar el dedo</b> y la hoja se da vuelta siguiéndote.
          </li>
          <li>
            Tocás el <b>centro</b> para ver la lista completa y saltar a cualquier canción.
          </li>
          <li>Desde esa lista cambiás el <b>tamaño de letra</b>.</li>
          <li>La pantalla <b>no se apaga sola</b> mientras estás cantando.</li>
        </ul>
        <p className="mt-3 text-muted">
          Si una canción es larga se parte en dos páginas, cortando siempre entre partes
          — nunca en la mitad de un verso. El número abajo a la derecha te dice en qué
          página del repertorio estás.
        </p>
      </Section>

      <Section title="Instalarla en el iPad">
        <p>
          Abrí la app en Safari, tocá el botón de compartir y elegí{' '}
          <b>Agregar a pantalla de inicio</b>. Queda como una app más, sin la barra del
          navegador.
        </p>
      </Section>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="font-medium">¿Querés ver el recorrido de nuevo?</p>
        <Link href="/bienvenida" className="mt-2 inline-block text-brand underline">
          Volver a hacer el recorrido inicial
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  )
}
