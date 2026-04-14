'use client'

import { Home, ShoppingBag, TrendingUp, Package, GraduationCap } from 'lucide-react'
import { MobileNav } from '@/components/shared/MobileNav'

// Navegación móvil de la comunidad — los 5 módulos clave del dropshipper
export function CommunityMobileNav() {
  return (
    <MobileNav
      items={[
        { href: '/feed', label: 'Feed', icon: Home },
        { href: '/mi-tienda', label: 'Mi Tienda', icon: ShoppingBag, badge: '3' },
        { href: '/rendimiento', label: 'Ventas', icon: TrendingUp },
        { href: '/herramientas/catalogo', label: 'Catálogo', icon: Package },
        { href: '/cursos', label: 'Cursos', icon: GraduationCap },
      ]}
    />
  )
}
