import Image from 'next/image'
import Link from 'next/link'

// Logo oficial de Vitalcom — usar siempre que se necesite la marca
// Variantes: full (logo + wordmark) | icon (solo isotipo)
type LogoProps = {
  variant?: 'full' | 'icon'
  size?: number
  href?: string
  className?: string
}

export function Logo({
  variant = 'full',
  size = 44,
  href = '/',
  className = '',
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/assets/branding/logo-vitalcom.jpeg"
        alt="Vitalcom"
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{
          width: size,
          height: size,
          maxWidth: size,
          maxHeight: size,
          boxShadow: '0 0 18px var(--vc-glow-lime)',
          border: '1px solid rgba(198, 255, 60, 0.4)',
        }}
        priority
      />
      {variant === 'full' && (
        <span
          className="vc-text-gradient text-xl font-black tracking-wider"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          VITALCOM
        </span>
      )}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}
