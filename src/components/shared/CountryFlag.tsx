// Banderas SVG inline para los 4 países Vitalcom
// No depende de emojis del SO — se ven igual en todos los navegadores
type Props = { country: 'CO' | 'EC' | 'GT' | 'CL'; size?: number }

export function CountryFlag({ country, size = 32 }: Props) {
  const flags: Record<string, React.ReactNode> = {
    CO: (
      <svg viewBox="0 0 900 600" width={size} height={size * 0.67} className="rounded-sm">
        <rect width="900" height="300" fill="#FCD116" />
        <rect width="900" height="150" y="300" fill="#003893" />
        <rect width="900" height="150" y="450" fill="#CE1126" />
      </svg>
    ),
    EC: (
      <svg viewBox="0 0 900 600" width={size} height={size * 0.67} className="rounded-sm">
        <rect width="900" height="300" fill="#FFD100" />
        <rect width="900" height="150" y="300" fill="#0033A0" />
        <rect width="900" height="150" y="450" fill="#CE1126" />
        <ellipse cx="450" cy="280" rx="80" ry="60" fill="#0033A0" opacity="0.3" />
      </svg>
    ),
    GT: (
      <svg viewBox="0 0 900 600" width={size} height={size * 0.67} className="rounded-sm">
        <rect width="300" height="600" fill="#4997D0" />
        <rect width="300" height="600" x="300" fill="#FFFFFF" />
        <rect width="300" height="600" x="600" fill="#4997D0" />
      </svg>
    ),
    CL: (
      <svg viewBox="0 0 900 600" width={size} height={size * 0.67} className="rounded-sm">
        <rect width="900" height="300" fill="#FFFFFF" />
        <rect width="900" height="300" y="300" fill="#D52B1E" />
        <rect width="300" height="300" fill="#0039A6" />
        <polygon points="150,75 165,130 225,130 175,165 190,220 150,185 110,220 125,165 75,130 135,130" fill="#FFFFFF" />
      </svg>
    ),
  }

  return <span className="inline-flex shrink-0">{flags[country]}</span>
}
