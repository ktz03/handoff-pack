import assert from 'node:assert/strict'
import test from 'node:test'
import { compressMessages } from '../src/compress.js'
import { redactSecrets, redactMessage } from '../src/secrets.js'
import { buildHandoffPack } from '../src/pack.js'
import { estimateMessagesTokens } from '../src/tokens.js'

test('redactSecrets removes openai-ish keys', () => {
  const { text, count } = redactSecrets('key=sk-thisIsAFakeOpenAIKeyForDemoOnly123456 ok')
  assert.equal(count, 1)
  assert.match(text, /\[REDACTED:openai-ish-key\]/)
  assert.doesNotMatch(text, /sk-thisIsAFake/)
})

test('compressMessages keeps system and drops oldest low-signal turns under budget', () => {
  const messages = [
    { role: 'system', content: 'sys' },
    { role: 'user', content: 'old-1 '.repeat(40) },
    { role: 'assistant', content: 'old-2 '.repeat(40) },
    { role: 'tool', content: 'Error: 429 Too Many Requests' },
    { role: 'user', content: 'newest goal' }
  ]
  const out = compressMessages(messages, { maxTokens: 60 })
  assert.ok(out.some((m) => m.role === 'system'))
  assert.ok(out.some((m) => m.role === 'tool'))
  assert.ok(out.some((m) => m.content === 'newest goal'))
  assert.ok(estimateMessagesTokens(out) <= 60 + 20)
})

test('buildHandoffPack returns compression stats and packet fields', () => {
  const messages = [
    { role: 'system', content: 'You are helpful. '.repeat(5) },
    { role: 'user', content: ('old context ' + 'x'.repeat(120) + ' ').repeat(3) },
    { role: 'assistant', content: ('old reply ' + 'y'.repeat(120) + ' ').repeat(3) },
    { role: 'user', content: 'Fix JWT rate limit. key sk-abcdefghijklmnopqrstuvwxyz012345' },
    { role: 'tool', content: 'Error: failed with timeout' },
    { role: 'assistant', content: 'Will dual-key the limiter.' },
    { role: 'user', content: 'How do we hand off to the next model?' }
  ]
  const pack = buildHandoffPack(messages, { maxTokens: 90, sourcePath: 't.json' })
  assert.ok(pack.stats.tokensBefore > pack.stats.tokensAfter)
  assert.ok(pack.stats.secretsRedacted >= 1)
  assert.ok(pack.packet.task_state.goal)
  assert.ok(pack.packet.plans.A)
  assert.ok(pack.markdown.includes('Agent Handoff Packet'))
  assert.equal(redactMessage(messages[3]).count >= 1, true)
})
