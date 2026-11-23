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

async function resolveCityName(lat: string, lon: string): Promise<string> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) })
    if (res.ok) {
      const data = await res.json()
      const city = data.city || data.locality || data.principalSubdivision
      if (city) return city
    }
  } catch {}
  return 'Localização atual'
}

async function fetchCurrentWeather(lat: string, lon: string, cityHint?: string | null) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  const code = data.current?.weathercode ?? 0
  const temp = Math.round(data.current?.temperature_2m ?? 22)
  const city = cityHint || (await resolveCityName(lat, lon))
  return NextResponse.json({ temp, desc: weatherDesc(code), icon: weatherIcon(code), city })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let lat = searchParams.get('lat')
    let lon = searchParams.get('lon')
    let city = searchParams.get('city')
    const date = searchParams.get('date')
    const hourParam = searchParams.get('hour')

    if (!lat || !lon) {
      const vercelLat = request.headers.get('x-vercel-ip-latitude')
      const vercelLon = request.headers.get('x-vercel-ip-longitude')
      const vercelCity = request.headers.get('x-vercel-ip-city')

      if (vercelLat && vercelLon) {
        lat = vercelLat
        lon = vercelLon
        if (!city && vercelCity) {
          city = decodeURIComponent(vercelCity)
        }
      } else {
        // Fallback default: São Paulo
        lat = '-23.5505'
        lon = '-46.6333'
        if (!city) city = 'São Paulo'
      }
    }

    if (date && hourParam !== null) {
      const hour = Math.min(23, Math.max(0, parseInt(hourParam || '12') || 12))
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto&start_date=${date}&end_date=${date}`
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
        const data = await res.json()

        if (!data.hourly?.temperature_2m?.[hour]) {
          throw new Error('Dados de previsão indisponíveis')
        }

        const code = data.hourly.weathercode[hour]
        const temp = Math.round(data.hourly.temperature_2m[hour])
        const resolvedCity = city || (await resolveCityName(lat, lon))
        return NextResponse.json({ temp, desc: weatherDesc(code), icon: weatherIcon(code), city: resolvedCity })
      } catch {
        return fetchCurrentWeather(lat, lon, city)
      }
    }

    return fetchCurrentWeather(lat, lon, city)
  } catch (error) {
    console.error('[weather] erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar clima' }, { status: 500 })
  }
}