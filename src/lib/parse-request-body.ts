import { NextResponse } from 'next/server'
import type { z } from 'zod'

export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let json: unknown

  try {
    json = await request.json()
  } catch (error) {
    console.error('Body JSON inválido:', error)
    return {
      success: false,
      response: NextResponse.json({ error: 'Requisição inválida' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(json)
  if (!result.success) {
    console.error('Validação Zod falhou:', result.error.flatten())
    return {
      success: false,
      response: NextResponse.json({ error: 'Requisição inválida' }, { status: 400 }),
    }
  }

  return { success: true, data: result.data }
}

export async function parseOptionalRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const contentType = request.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    const result = schema.safeParse({})
    if (!result.success) {
      console.error('Validação Zod falhou (body vazio):', result.error.flatten())
      return {
        success: false,
        response: NextResponse.json({ error: 'Requisição inválida' }, { status: 400 }),
      }
    }
    return { success: true, data: result.data }
  }

  return parseRequestBody(request, schema)
}
