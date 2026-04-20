import { CEOAdvisorChat } from '@/components/admin/CEOAdvisorChat'

// ── Asesor CEO — página completa ─────────────────────
// Chat IA con datos operativos en vivo. Solo accesible a staff
// (la validación se hace server-side en /api/admin/ai/ceo-chat).

export default function AsistenteCEOPage() {
  return <CEOAdvisorChat />
}
