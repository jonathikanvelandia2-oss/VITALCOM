'use client'

import { useState } from 'react'
import {
  Heart, MessageCircle, Share2, Sparkles, Image as ImageIcon,
  Pin, TrendingUp, ShoppingBag, Award, Flame,
  Loader2, Send,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { usePosts, useCreatePost, useToggleLike, useCreateComment } from '@/hooks/usePosts'
import { useMyProfile } from '@/hooks/useCommunity'
import { formatLevel } from '@/lib/gamification/points'

const CATEGORIES = ['Todos', 'Resultados', 'Tips', 'Preguntas', 'Anuncios', 'Mindset', 'Ventas']
const CATEGORY_MAP: Record<string, string> = {
  Resultados: 'resultado', Tips: 'tip', Preguntas: 'pregunta',
  Anuncios: 'anuncio', Mindset: 'mindset', Ventas: 'ventas',
}

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [composerBody, setComposerBody] = useState('')
  const [composerCategory, setComposerCategory] = useState<string>('general')

  const categoryFilter = CATEGORY_MAP[activeCategory] as any
  const { data, isLoading } = usePosts({ category: categoryFilter || undefined, limit: 20 })
  const profile = useMyProfile()
  const createPost = useCreatePost()

  const posts = data?.posts ?? []
  const total = data?.pagination?.total ?? 0

  function handlePublish() {
    if (!composerBody.trim()) return
    createPost.mutate(
      { body: composerBody, category: composerCategory as any, images: [] },
      { onSuccess: () => { setComposerBody(''); setComposerCategory('general') } }
    )
  }

  const initials = profile.data?.name
    ? profile.data.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  return (
    <>
      <CommunityTopbar
        title="Feed VITALCOMMERS"
        subtitle="Lo que pasa en la comunidad de dropshipping #1 de LATAM"
      />
      <div className="flex-1">
        <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
          {/* Resumen rápido */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickStat icon={ShoppingBag} label="Posts totales" value={String(total)} />
            <QuickStat icon={TrendingUp} label="Tu nivel" value={profile.data ? formatLevel(profile.data.level) : '—'} highlight />
            <QuickStat icon={Flame} label="Tus puntos" value={profile.data?.points?.toLocaleString('es-CO') ?? '—'} />
            <QuickStat icon={Award} label="Tu ranking" value={profile.data?.rankPosition ? `#${profile.data.rankPosition}` : '—'} />
          </div>

          {/* Composer */}
          <div className="vc-card">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
                {initials}
              </div>
              <div className="flex-1">
                <textarea value={composerBody} onChange={(e) => setComposerBody(e.target.value)}
                  placeholder="Comparte tu resultado, tip o pregunta con la comunidad..."
                  rows={3} className="w-full resize-none rounded-lg p-3 text-sm outline-none"
                  style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <select value={composerCategory} onChange={(e) => setComposerCategory(e.target.value)}
                      className="rounded-lg px-2 py-1 text-[11px] outline-none"
                      style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <option value="general">General</option>
                      <option value="resultado">Resultado</option>
                      <option value="tip">Tip</option>
                      <option value="pregunta">Pregunta</option>
                      <option value="mindset">Mindset</option>
                      <option value="ventas">Ventas</option>
                    </select>
                  </div>
                  <button onClick={handlePublish} disabled={createPost.isPending || !composerBody.trim()}
                    className="vc-btn-primary flex items-center gap-1.5" style={{ padding: '0.5rem 1.25rem', opacity: composerBody.trim() ? 1 : 0.5 }}>
                    {createPost.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  background: activeCategory === c ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: activeCategory === c ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: activeCategory === c ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}>
                {c}
              </button>
            ))}
          </div>

          {/* Posts */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            </div>
          ) : posts.length === 0 ? (
            <div className="vc-card py-12 text-center">
              <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
                No hay posts {activeCategory !== 'Todos' ? `en la categoría "${activeCategory}"` : 'todavía'}. ¡Sé el primero!
              </p>
            </div>
          ) : (
            posts.map((p: any) => (
              <PostCard key={p.id} post={p} />
            ))
          )}

          {/* CTA de la comunidad */}
          <div className="vc-card text-center" style={{ borderColor: 'rgba(198,255,60,0.3)' }}>
            <Sparkles size={24} color="var(--vc-lime-main)" className="mx-auto mb-2" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Comparte tus resultados y sube de nivel
            </h3>
            <p className="mx-auto mt-1 max-w-md text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
              Cada post te da +10 puntos. Los comentarios +3. Llega a Nivel 5 (Rama) y desbloquea herramientas Pro.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ── PostCard con like y comentarios ─────────────────────
function PostCard({ post }: { post: any }) {
  const toggleLike = useToggleLike()
  const [showComments, setShowComments] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const createComment = useCreateComment(post.id)

  const authorName = post.author?.name ?? 'Usuario'
  const authorInitials = authorName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const levelLabel = formatLevel(post.author?.level ?? 1)
  const timeAgo = getTimeAgo(post.createdAt)

  function handleComment() {
    if (!commentBody.trim()) return
    createComment.mutate({ body: commentBody }, { onSuccess: () => setCommentBody('') })
  }

  return (
    <article className="vc-card">
      {post.pinned && (
        <div className="-mt-2 mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
          <Pin size={11} /> Anclado por el equipo
        </div>
      )}
      <header className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
          {authorInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            {authorName}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--vc-lime-main)' }}>
            {levelLabel} · <span style={{ color: 'var(--vc-gray-mid)' }}>{timeAgo}</span>
          </p>
        </div>
        {post.category && <CategoryBadge category={post.category} />}
      </header>

      <div className="mb-4 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--vc-white-soft)' }}>
        {post.body}
      </div>

      <footer className="flex items-center gap-6 pt-3 text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
        <button onClick={() => toggleLike.mutate(post.id)}
          className="flex items-center gap-1.5 transition-colors hover:text-[--vc-lime-main]"
          style={{ color: post.likedByMe ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)' }}>
          <Heart size={14} fill={post.likedByMe ? 'currentColor' : 'none'} /> {post.likes}
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5" style={{ color: 'var(--vc-white-dim)' }}>
          <MessageCircle size={14} /> {post.commentCount}
        </button>
        <button className="ml-auto flex items-center gap-1.5" style={{ color: 'var(--vc-white-dim)' }}>
          <Share2 size={14} /> Compartir
        </button>
      </footer>

      {/* Sección de comentarios expandible */}
      {showComments && (
        <div className="mt-4 space-y-3 pt-3" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
          {post.comments?.map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-lime-main)', border: '1px solid var(--vc-gray-dark)' }}>
                {(c.author?.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <p className="text-[11px]">
                  <span className="font-bold" style={{ color: 'var(--vc-white-soft)' }}>{c.author?.name}</span>
                  <span className="ml-2" style={{ color: 'var(--vc-gray-mid)' }}>{getTimeAgo(c.createdAt)}</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={commentBody} onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()} />
            <button onClick={handleComment} disabled={createComment.isPending || !commentBody.trim()}
              className="rounded-lg px-3 py-2 text-xs font-bold"
              style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)' }}>
              {createComment.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// ── Componentes auxiliares ────────────────────────────────

function QuickStat({ icon: Icon, label, value, highlight }: {
  icon: typeof ShoppingBag; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className="vc-card text-center" style={{ padding: '0.75rem' }}>
      <Icon size={14} className="mx-auto mb-1" style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
      <p className="text-sm font-black" style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)' }}>{label}</p>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, { bg: string; color: string }> = {
    anuncio: { bg: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)' },
    resultado: { bg: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)' },
    tip: { bg: 'rgba(60,198,255,0.15)', color: 'var(--vc-info)' },
    pregunta: { bg: 'rgba(255,184,0,0.15)', color: 'var(--vc-warning)' },
    mindset: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    ventas: { bg: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-deep)' },
    general: { bg: 'rgba(255,255,255,0.08)', color: 'var(--vc-white-dim)' },
  }
  const c = config[category] || config.general
  return (
    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33` }}>
      {category}
    </span>
  )
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}
