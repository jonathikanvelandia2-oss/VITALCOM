'use client'

import { useMutation } from '@tanstack/react-query'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useSoporteChat() {
  return useMutation<{ reply: string }, Error, ChatMessage[]>({
    mutationFn: (messages) =>
      fetchJson('/api/ai/soporte/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      }),
  })
}
