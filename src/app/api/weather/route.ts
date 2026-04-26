import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Coordenadas necessárias' }, { status: 400 })
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`

  const res = await fetch(url)
  const data = await res.json()

  const code = data.current.weathercode
  const temp = Math.round(data.current.temperature_2m)

  const weatherDesc = (code: number) => {
    if (code === 0) return 'Céu limpo'
    if (code <= 3) return 'Parcialmente nublado'
    if (code <= 48) return 'Nublado'
    if (code <= 67) return 'Chuva'
    if (code <= 77) return 'Neve'
    if (code <= 82) return 'Chuva forte'
    return 'Tempestade'
  }

  const weatherIcon = (code: number) => {
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '☁️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    if (code <= 82) return '⛈️'
    return '🌩️'
  }

  return NextResponse.json({
    temp,
    desc: weatherDesc(code),
    icon: weatherIcon(code),
  })
}