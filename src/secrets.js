const SECRET_PATTERNS = [
  { name: 'openai-ish-key', re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'github-pat', re: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { name: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'generic-bearer', re: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi },
  { name: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
]

export function redactSecrets(text) {
  let out = String(text ?? '')
  let count = 0
  for (const { name, re } of SECRET_PATTERNS) {
    out = out.replace(re, () => {
      count += 1
      return `[REDACTED:${name}]`
    })
  }
  return { text: out, count }
}

export function redactMessage(message) {
  const clone = { ...message }
  if (typeof clone.content === 'string') {
    const { text, count } = redactSecrets(clone.content)
    clone.content = text
    return { message: clone, count }
  }
  const raw = JSON.stringify(clone.content ?? '')
  const { text, count } = redactSecrets(raw)
  try {
    clone.content = JSON.parse(text)
  } catch {
    clone.content = text
  }
  return { message: clone, count }
}
