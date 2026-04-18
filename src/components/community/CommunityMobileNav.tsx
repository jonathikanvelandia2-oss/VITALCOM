'use client'

import { Home, ShoppingBag, Wallet, ShoppingCart, Package } from 'lucide-react'
import { MobileNav } from '@/components/shared/MobileNav'

// Navegación móvil de la comunidad — los 5 módulos clave del dropshipper
export function CommunityMobileNav() {
  return (
    <MobileNav
      items={[
        { href: '/feed', label: 'Feed', icon: Home },
        { href: '/mi-tienda', label: 'Tienda', icon: ShoppingBag },
        { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
        { href: '/mi-pyg', label: 'Mi P&G', icon: Wallet },
        { href: '/herramientas/catalogo', label: 'Catálogo', icon: Package },
      ]}
    />
  )
}
