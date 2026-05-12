'use client'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center' as const,
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        width: '64px', height: '64px',
        border: '1px solid rgba(180,140,60,0.4)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        marginBottom: '24px',
      }}>✦</div>
      <h1 style={{
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        fontWeight: 400,
        color: '#f0f0f0',
        marginBottom: '12px',
      }}>Sem conexão</h1>
      <p style={{
        fontSize: '15px',
        color: 'rgba(255,255,255,0.4)',
        maxWidth: '280px',
        lineHeight: 1.6,
        marginBottom: '32px',
      }}>
        Verifique sua conexão com a internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'rgba(180,140,60,0.1)',
          border: '1px solid rgba(180,140,60,0.4)',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '14px',
          color: 'rgba(180,140,60,0.9)',
          cursor: 'pointer',
          fontFamily: 'sans-serif',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
