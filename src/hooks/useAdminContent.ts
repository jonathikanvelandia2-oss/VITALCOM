'use client'

import { useQuery } from '@tanstack/react-query'

export type ContentOverview = {
  kpis: {
    resourcesTotal: number
    resourcesPublished: number
    resourcesDownloads: number
    coursesTotal: number
    coursesPublished: number
    postsTotal: number
    postsRecent: number
  }
  topResources: Array<{
    id: string
    title: string
    category: string
    type: string
    downloads: number
    thumbnail: string | null
  }>
  latestCourses: Array<{
    id: string
    title: string
    slug: string
    level: string
    published: boolean
    cover: string | null
    createdAt: string
  }>
  latestPosts: Array<{
    id: string
    title: string | null
    body: string
    category: string | null
    likes: number
    authorName: string
    createdAt: string
  }>
}

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useAdminContent() {
  return useQuery<ContentOverview>({
    queryKey: ['admin-content'],
    queryFn: () => fetcher('/api/admin/content/overview'),
    staleTime: 60_000,
  })
}
