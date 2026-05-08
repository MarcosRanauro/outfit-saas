import { NextResponse } from 'next/server'

function weatherDesc(code: number) {
  if (code === 0) return 'Céu limpo'
  if (code <= 3) return 'Parcialmente nublado'
  if (code <= 48) return 'Nublado'
  if (code <= 67) return 'Chuva'
  if (code <= 77) return 'Neve'
  if (code <= 82) return 'Chuva forte'
  return 'Tempestade'
}

function weatherIcon(code: number) {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '☁️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '⛈️'
  return '🌩️'
}

async function fetchCurrentWeather(lat: string, lon: string) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
  const res = await fetch(url)
  const data = await res.json()
  const code = data.current.weathercode
  const temp = Math.round(data.current.temperature_2m)
  return NextResponse.json({ temp, desc: weatherDesc(code), icon: weatherIcon(code) })
}

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const date = searchParams.get('date')
  const hourParam = searchParams.get('hour')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Coordenadas necessárias' }, { status: 400 })
  }

  if (date && hourParam !== null) {
    const hour = Math.min(23, Math.max(0, parseInt(hourParam || '12') || 12))
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto&start_date=${date}&end_date=${date}`
      const res = await fetch(url)
      const data = await res.json()

      if (!data.hourly?.temperature_2m?.[hour]) {
        throw new Error('Dados de previsão indisponíveis')
      }

      const code = data.hourly.weathercode[hour]
      const temp = Math.round(data.hourly.temperature_2m[hour])
      return NextResponse.json({ temp, desc: weatherDesc(code), icon: weatherIcon(code) })
    } catch {
      return fetchCurrentWeather(lat, lon)
    }
  }

  return fetchCurrentWeather(lat, lon)
  } catch (error) {
    console.error('[weather] erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar clima' }, { status: 500 })
  }
}