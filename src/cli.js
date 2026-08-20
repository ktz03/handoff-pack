import fs from 'node:fs'
import path from 'node:path'
import { buildHandoffPack, loadMessagesFile } from './pack.js'
import { estimateTokens } from './tokens.js'

function printHelp() {
  console.log(`handoff-pack — Multi-model Agent context handoff packet CLI

Usage:
  handoff-pack preview <messages.json> [--max-tokens N]
  handoff-pack pack    <messages.json> [--max-tokens N] [--out RESUME.md] [--json]
  handoff-pack help

Input format:
  OpenAI-compatible messages array, or { "messages": [...] }

Examples:
  npm run preview
  npm run demo
`)
}

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--max-tokens') args.maxTokens = Number(argv[++i])
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--json') args.json = true
    else if (a === '--help' || a === '-h') args.help = true
    else args._.push(a)
  }
  return args
}

export async function runCli(argv) {
  const args = parseArgs(argv)
  const [cmd, file] = args._

  if (!cmd || args.help || cmd === 'help') {
    printHelp()
    return
  }

  if (!file) throw new Error(`missing messages file. Try: handoff-pack ${cmd} examples/session.messages.json`)

  const abs = path.resolve(file)
  if (!fs.existsSync(abs)) throw new Error(`file not found: ${abs}`)

  const messages = loadMessagesFile(abs)
  const maxTokens = Number.isFinite(args.maxTokens) && args.maxTokens > 0 ? args.maxTokens : 1600
  const pack = buildHandoffPack(messages, { maxTokens, sourcePath: abs })

  if (cmd === 'preview') {
    console.log(`source: ${abs}`)
    console.log(`messages: ${pack.stats.messageCount}`)
    console.log(`tokens before: ${pack.stats.tokensBefore}`)
    console.log(`tokens after:  ${pack.stats.tokensAfter}`)
    console.log(`compression:   ${pack.stats.compressionRatio}`)
    console.log(`secrets found: ${pack.stats.secretsRedacted}`)
    console.log(`kept roles:    ${pack.stats.keptSummary}`)
    return
  }

  if (cmd === 'pack') {
    if (args.json) {
      const out = args.out || 'handoff.packet.json'
      fs.writeFileSync(out, JSON.stringify(pack.packet, null, 2), 'utf8')
      console.log(`wrote ${path.resolve(out)}`)
      console.log(`tokens ${pack.stats.tokensBefore} → ${pack.stats.tokensAfter} (${pack.stats.compressionRatio})`)
      return
    }

    const out = args.out || 'RESUME.md'
    fs.writeFileSync(out, pack.markdown, 'utf8')
    console.log(`wrote ${path.resolve(out)}`)
    console.log(`tokens ${pack.stats.tokensBefore} → ${pack.stats.tokensAfter} (${pack.stats.compressionRatio})`)
    console.log(`paste RESUME.md into the next model / agent session`)
    return
  }

  throw new Error(`unknown command: ${cmd}`)
}

// silence unused import warning in some linters
void estimateTokens
