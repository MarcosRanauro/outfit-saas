'use client'

import '@/app/studio-scanner.css'

interface StudioScannerOverlayProps {
  open: boolean
  photoSrc: string | null
  title: string
  subtitle: string
}

export default function StudioScannerOverlay({
  open, photoSrc, title, subtitle,
}: StudioScannerOverlayProps) {
  if (!open) return null

  return (
    <div className="np-studio-overlay">
      <div className="np-studio-modal">
        <div className="np-scanner-container">
          {photoSrc && (
            <img src={photoSrc} alt="Peça sendo analisada" className="np-scanner-photo" />
          )}
          <div className="np-scanner-glow" />
          <div className="np-scanner-line" />
          <div className="np-scanner-corners">
            <div className="np-corner np-corner-tl" />
            <div className="np-corner np-corner-tr" />
            <div className="np-corner np-corner-bl" />
            <div className="np-corner np-corner-br" />
          </div>
        </div>
        <p className="np-scanner-title">{title}</p>
        <p className="np-scanner-sub">{subtitle}</p>
        <div className="np-progress-wrap">
          <div className="np-progress-bar" />
        </div>
        <div className="np-dots">
          <div className="np-dot" />
          <div className="np-dot" />
          <div className="np-dot" />
        </div>
      </div>
    </div>
  )
}
