import { estimateTokens, stringifyContent } from './tokens.js'

/**
 * Priority-layered compression for OpenAI-compatible chat messages.
 * Keep: all system → tool/error signals → recent turns, drop oldest user/assistant first.
 */
export function compressMessages(messages, { maxTokens = 1600 } = {}) {
  const list = messages.map((m, index) => ({ ...m, __index: index }))

  const system = list.filter((m) => m.role === 'system')
  const rest = list.filter((m) => m.role !== 'system')

  const isHighSignal = (m) => {
    const c = stringifyContent(m.content).toLowerCase()
    if (m.role === 'tool') return true
    if (m.tool_calls) return true
    return /error|exception|failed|traceback|rate limit|timeout|429|5\d\d/.test(c)
  }

  const high = []
  const normal = []
  for (const m of rest) {
    if (isHighSignal(m)) high.push(m)
    else normal.push(m)
  }

  // Prefer recent normal turns
  const recentFirst = [...normal].reverse()
  const picked = [...system]

  const budgetLeft = () => {
    const used = picked.reduce((s, m) => s + estimateTokens(stringifyContent(m.content)) + 4, 0)
    return maxTokens - used
  }

  for (const m of high) {
    const need = estimateTokens(stringifyContent(m.content)) + 4
    if (need <= budgetLeft()) picked.push(m)
  }

  for (const m of recentFirst) {
    const need = estimateTokens(stringifyContent(m.content)) + 4
    if (need <= budgetLeft()) picked.push(m)
  }

  picked.sort((a, b) => a.__index - b.__index)
  return picked.map(({ __index, ...m }) => m)
}
