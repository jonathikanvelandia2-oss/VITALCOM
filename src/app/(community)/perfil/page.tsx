'use client'

import { useState } from 'react'
import { Trophy, Heart, MessageCircle, Award, Edit3, Loader2, Save, X } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useMyProfile, useUpdateProfile } from '@/hooks/useCommunity'
import { getLevelProgress, formatLevel } from '@/lib/gamification/points'

const ACHIEVEMENTS = [
  { name: 'Primer post', icon: '✍️', key: 'first_post', check: (d: any) => d.postCount >= 1 },
  { name: '10 posts', icon: '🎯', key: '10_posts', check: (d: any) => d.postCount >= 10 },
  { name: '100 likes', icon: '❤️', key: '100_likes', check: (d: any) => d.likesReceived >= 100 },
  { name: 'Top 50', icon: '🏆', key: 'top_50', check: (d: any) => d.rankPosition <= 50 },
  { name: 'Nivel 3', icon: '🍃', key: 'level_3', check: (d: any) => (d.level ?? 1) >= 3 },
  { name: 'Nivel 5', icon: '🌿', key: 'level_5', check: (d: any) => (d.level ?? 1) >= 5 },
  { name: 'Nivel 7', icon: '🌲', key: 'level_7', check: (d: any) => (d.level ?? 1) >= 7 },
  { name: 'Nivel Vital', icon: '⚡', key: 'level_9', check: (d: any) => (d.level ?? 1) >= 9 },
]

export default function PerfilPage() {
  const { data: user, isLoading } = useMyProfile()
  const updateProfile = useUpdateProfile()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')

  if (isLoading) {
    return (
      <>
        <CommunityTopbar title="Mi perfil" subtitle="Tu progreso en la comunidad Vitalcom" />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  if (!user) return null

  const progress = getLevelProgress(user.points ?? 0)
  const initials = (user.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  function startEdit() {
    setEditName(user.name ?? '')
    setEditBio(user.bio ?? '')
    setEditing(true)
  }

  function saveEdit() {
    updateProfile.mutate({ name: editName, bio: editBio }, { onSuccess: () => setEditing(false) })
  }

  return (
    <>
      <CommunityTopbar title="Mi perfil" subtitle="Tu progreso en la comunidad Vitalcom" />
      <div className="flex-1 space-y-6 p-6">
        {/* Hero del perfil */}
        <div className="vc-card relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30"
            style={{ background: 'var(--vc-gradient-primary)', filter: 'blur(80px)' }} />
          <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-2xl font-black"
              style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-display)', boxShadow: '0 0 40px var(--vc-glow-strong)' }}>
              {initials}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-lg font-bold outline-none"
                    style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }} />
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tu bio..."
                    rows={2} className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
                    {user.name ?? 'Sin nombre'}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
                    {user.role === 'DROPSHIPPER' ? 'Dropshipper' : 'Miembro'} · {user.country ?? '—'} · Miembro desde {new Date(user.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                  </p>
                  {user.bio && <p className="mt-1 text-xs" style={{ color: 'var(--vc-white-dim)' }}>{user.bio}</p>}
                </>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: 'rgba(198, 255, 60, 0.15)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198, 255, 60, 0.4)' }}>
                  Nivel {user.level} · {formatLevel(user.level)}
                </span>
                <span className="rounded-full px-3 py-1 text-xs"
                  style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-dim)', border: '1px solid var(--vc-gray-dark)' }}>
                  {(user.points ?? 0).toLocaleString('es-CO')} puntos
                </span>
              </div>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={updateProfile.isPending}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase"
                  style={{ background: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.4)', fontFamily: 'var(--font-heading)' }}>
                  {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-dim)', border: '1px solid var(--vc-gray-dark)' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button onClick={startEdit}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
                <Edit3 size={14} /> Editar perfil
              </button>
            )}
          </div>

          {/* Progreso al siguiente nivel */}
          <div className="relative mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span style={{ color: 'var(--vc-white-dim)' }}>
                {progress.next ? (
                  <>Próximo nivel: <strong style={{ color: 'var(--vc-lime-main)' }}>{progress.next.name} {progress.next.emoji}</strong></>
                ) : (
                  <strong style={{ color: 'var(--vc-lime-main)' }}>¡Nivel máximo!</strong>
                )}
              </span>
              <span className="font-mono" style={{ color: 'var(--vc-white-dim)' }}>
                {(user.points ?? 0).toLocaleString('es-CO')} / {progress.next ? progress.next.minPoints.toLocaleString('es-CO') : '∞'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
              <div className="h-full rounded-full"
                style={{ width: `${progress.progress}%`, background: 'var(--vc-gradient-primary)', boxShadow: '0 0 12px var(--vc-glow-lime)' }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={<Heart size={18} />} value={String(user.likesReceived ?? 0)} label="Likes recibidos" />
          <Stat icon={<MessageCircle size={18} />} value={String((user.postCount ?? 0) + (user.commentCount ?? 0))} label="Posts y comentarios" />
          <Stat icon={<Award size={18} />} value={String(user.coursesCompleted ?? 0)} label="Cursos completados" />
          <Stat icon={<Trophy size={18} />} value={user.rankPosition ? `#${user.rankPosition}` : '—'} label="Ranking" />
        </div>

        {/* Logros */}
        <div className="vc-card">
          <h2 className="mb-5 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Logros
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = a.check(user)
              return (
                <div key={a.key}
                  className="flex flex-col items-center rounded-xl p-4 text-center"
                  style={{
                    background: unlocked ? 'rgba(198, 255, 60, 0.08)' : 'var(--vc-black-soft)',
                    border: unlocked ? '1px solid rgba(198, 255, 60, 0.3)' : '1px solid var(--vc-gray-dark)',
                    opacity: unlocked ? 1 : 0.4,
                    boxShadow: unlocked ? '0 0 12px var(--vc-glow-lime)' : 'none',
                  }}>
                  <span className="mb-2 text-3xl">{a.icon}</span>
                  <p className="text-[11px] font-semibold"
                    style={{ color: unlocked ? 'var(--vc-white-soft)' : 'var(--vc-gray-mid)', fontFamily: 'var(--font-heading)' }}>
                    {a.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="vc-card flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'rgba(198, 255, 60, 0.12)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198, 255, 60, 0.3)' }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
