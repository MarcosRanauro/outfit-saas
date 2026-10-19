// Auditoria única: passa as imagens já existentes no Storage pela moderação da OpenAI.
// Só lê e lista — não apaga nada. Uso: node scripts/audit-storage-moderation.mjs
// Requer NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e OPENAI_API_KEY em .env.local.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

async function listAll(bucket, prefix = '') {
  const files = []
  const pending = [prefix]
  while (pending.length) {
    const dir = pending.pop()
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 1000, offset })
      if (error) throw error
      if (!data?.length) break
      for (const e of data) {
        const path = dir ? `${dir}/${e.name}` : e.name
        if (e.id) files.push(path)
        else pending.push(path)
      }
      if (data.length < 1000) break
    }
  }
  return files
}

let checked = 0
const flagged = []
const errors = []

for (const bucket of ['pieces', 'avatars']) {
  const files = await listAll(bucket)
  console.log(`${bucket}: ${files.length} arquivos`)
  for (const path of files) {
    try {
      const { data, error } = await admin.storage.from(bucket).download(path)
      if (error) throw error
      const buf = Buffer.from(await data.arrayBuffer())
      const mime = data.type || 'image/jpeg'
      const r = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: [{ type: 'image_url', image_url: { url: `data:${mime};base64,${buf.toString('base64')}` } }],
      })
      checked++
      if (r.results[0].flagged) {
        const cats = Object.entries(r.results[0].categories).filter(([, v]) => v).map(([k]) => k)
        flagged.push({ bucket, path, cats })
      }
    } catch (e) {
      errors.push({ bucket, path, error: String(e?.message ?? e) })
    }
  }
}

console.log(`\nVerificadas: ${checked} | Sinalizadas: ${flagged.length} | Erros: ${errors.length}`)
for (const f of flagged) console.log('SINALIZADA', f.bucket, f.path, f.cats.join(','))
for (const e of errors) console.log('ERRO', e.bucket, e.path, e.error)
