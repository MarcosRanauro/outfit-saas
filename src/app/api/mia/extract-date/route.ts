import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { miaExtractDateBodySchema } from "@/lib/api-schemas"
import { parseRequestBody } from "@/lib/parse-request-body"
import { checkRateLimit } from "@/lib/rate-limit"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { allowed } = await checkRateLimit(user.id, 'mia_chat')
  if (!allowed) return NextResponse.json({ event_date: null, event_hour: null })

  const parsed = await parseRequestBody(request, miaExtractDateBodySchema)
  if (!parsed.success) return parsed.response

  try {
    const { message, history } = parsed.data
    const hoje = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' })
    const anoAtual = new Date().getFullYear()

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      system: `Você é um extrator de datas. Analise a mensagem e o histórico e retorne APENAS um JSON com a data e hora do evento mencionado.
Hoje é ${hoje}.
Ano atual: ${anoAtual}. Mês atual: ${mesAtual}.

Retorne APENAS:
{"event_date": "YYYY-MM-DD", "event_hour": H}

Se não houver data futura específica, retorne:
{"event_date": null, "event_hour": null}

Exemplos:
- "dia 15 às 11h" → {"event_date": "${anoAtual}-[mês atual com 2 dígitos]-15", "event_hour": 11}
- "quero um look" → {"event_date": null, "event_hour": null}
- Para "amanhã de manhã" → calcule a data de amanhã a partir de hoje, event_hour: 9
- Para "sábado à noite" → calcule a data do próximo sábado a partir de hoje, event_hour: 21

Retorne APENAS o JSON, sem texto adicional.`,
      messages: [
        ...(history || []).slice(-4).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "user",
          content: message,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      return NextResponse.json({ event_date: null, event_hour: null })
    }

    const clean = content.text.replace(/```json|```/g, "").trim()
    const eventData = JSON.parse(clean)
    return NextResponse.json(eventData)

  } catch {
    return NextResponse.json({ event_date: null, event_hour: null })
  }
}
