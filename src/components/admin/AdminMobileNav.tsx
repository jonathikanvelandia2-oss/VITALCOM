'use client'

import { LayoutDashboard, ShoppingBag, Package, DollarSign, Inbox } from 'lucide-react'
import { MobileNav } from '@/components/shared/MobileNav'

// Navegación móvil del panel admin — los 5 módulos más usados
export function AdminMobileNav() {
  return (
    <MobileNav
      items={[
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, badge: '37' },
        { href: '/admin/catalogo', label: 'Catálogo', icon: Package },
        { href: '/admin/finanzas', label: 'Finanzas', icon: DollarSign },
        { href: '/admin/inbox', label: 'Inbox', icon: Inbox, badge: '5' },
      ]}
    />
  )
}
