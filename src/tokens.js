/** Rough token estimate: ~4 chars / token for mixed CN/EN. */
export function estimateTokens(text) {
  if (!text) return 0
  return Math.max(1, Math.ceil(String(text).length / 4))
}

export function estimateMessagesTokens(messages) {
  return messages.reduce((sum, m) => sum + estimateTokens(stringifyContent(m.content)) + 4, 0)
}

export function stringifyContent(content) {
  if (content == null) return ''
  if (typeof content === 'string') return content
  try {
    return JSON.stringify(content)
  } catch {
    return String(content)
  }
}
