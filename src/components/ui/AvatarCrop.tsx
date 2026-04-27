'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'

type Props = {
  onSave: (url: string) => void
  onClose: () => void
  userId: string
}

type CroppedArea = {
  x: number
  y: number
  width: number
  height: number
}

async function getCroppedImg(imageSrc: string, pixelCrop: CroppedArea): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc

  await new Promise((resolve) => {
    image.onload = resolve
  })

  const canvas = document.createElement('canvas')
  const size = 400
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
  })
}

export default function AvatarCrop({ onSave, onClose, userId }: Props) {
  const supabase = createClient()

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: any, croppedPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    console.log('handleSave chamado', { imageSrc: !!imageSrc, croppedAreaPixels })
    if (!imageSrc || !croppedAreaPixels) return
    setSaving(true)

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      console.log('Blob gerado:', blob.size)

      const path = `${userId}/avatar.jpg`

      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

      console.log('Upload error:', uploadError)

      if (!uploadError) {
        const { data: urlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(path)

        const url = urlData.publicUrl + '?t=' + Date.now()
        console.log('URL final:', url)
        onSave(url)
      }
    } catch (err) {
      console.error('Erro ao salvar avatar:', err)
    }

    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'var(--font-inter)',
          }}
        >
          Cancelar
        </button>
        <span style={{
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
        }}>
          Foto de Perfil
        </span>
        <button
          onClick={handleSave}
          disabled={!imageSrc || saving}
          style={{
            background: 'transparent',
            border: 'none',
            color: imageSrc ? 'rgba(180,140,60,0.9)' : 'rgba(255,255,255,0.2)',
            fontSize: '13px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: imageSrc ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-inter)',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {imageSrc ? (
        <>
          <div style={{ flex: 1, position: 'relative' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: '#080808' },
              }}
            />
          </div>
          <div style={{
            padding: '20px 40px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>−</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'rgba(180,140,60,0.9)',
                height: '2px',
              }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>+</span>
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '40px',
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: '#1a1a1a',
            border: '2px dashed rgba(180,140,60,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            opacity: 0.3,
          }}>
            👤
          </div>
          <label style={{
            padding: '13px 28px',
            background: 'rgba(180,140,60,0.15)',
            border: '1px solid rgba(180,140,60,0.5)',
            borderRadius: '8px',
            color: 'rgba(180,140,60,0.95)',
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}>
            Escolher Foto
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}
    </div>
  )
}
