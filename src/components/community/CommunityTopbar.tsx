// Topbar reutilizable para vistas de comunidad
type Props = { title: string; subtitle?: string }

export function CommunityTopbar({ title, subtitle }: Props) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center px-6"
      style={{
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(198, 255, 60, 0.18)',
      }}
    >
      <div>
        <h1
          className="text-lg font-bold"
          style={{
            color: 'var(--vc-white-soft)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-[11px]"
            style={{
              color: 'var(--vc-gray-mid)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  )
}
