import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

describe('GET /api/weather', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna previsão atual com sucesso quando lat e lon são fornecidos', async () => {
    const mockWeatherResponse = {
      current: {
        weathercode: 0,
        temperature_2m: 23.4,
      },
    }

    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = String(url)
      if (urlStr.includes('open-meteo.com')) {
        return {
          ok: true,
          json: async () => mockWeatherResponse,
        } as unknown as Response
      }
      if (urlStr.includes('bigdatacloud.net')) {
        return {
          ok: true,
          json: async () => ({ city: 'São Paulo' }),
        } as unknown as Response
      }
      return { ok: false } as unknown as Response
    })

    const req = new Request('http://localhost:3000/api/weather?lat=-23.55&lon=-46.63')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.temp).toBe(23)
    expect(data.desc).toBe('Céu limpo')
    expect(data.icon).toBe('☀️')
    expect(data.city).toBe('São Paulo')
  })

  it('usa fallback de coordenadas quando lat e lon não são passados', async () => {
    const mockWeatherResponse = {
      current: {
        weathercode: 2,
        temperature_2m: 19.8,
      },
    }

    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = String(url)
      if (urlStr.includes('open-meteo.com')) {
        return {
          ok: true,
          json: async () => mockWeatherResponse,
        } as unknown as Response
      }
      return { ok: false } as unknown as Response
    })

    const req = new Request('http://localhost:3000/api/weather')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.temp).toBe(20)
    expect(data.desc).toBe('Parcialmente nublado')
    expect(data.icon).toBe('⛅')
    expect(data.city).toBe('São Paulo')
  })
})
