'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AvatarCrop from '@/components/ui/AvatarCrop'
import DashboardTopBanner from '@/components/layout/DashboardTopBanner'
import '../../perfil.css'

interface ProfileUpdate {
  name?: string
  height?: number | null
  weight?: number | null
  style?: string | null
  avatar_url?: string
}

const STYLES = ['Streetwear', 'Sportwear', 'Casual', 'Social', 'Minimalista']

type Profile = {
  id: string
  name: string | null
  height: number | null
  weight: number | null
  style: string | null
  avatar_url: string | null
  plan: string
  trial_ends_at: string | null
}

function getTrialDaysLeft(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [piecesCount, setPiecesCount] = useState(0)
  const [outfitsCount, setOutfitsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [editModal, setEditModal] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editStyles, setEditStyles] = useState<string[]>([])
  const [editCustomStyle, setEditCustomStyle] = useState('')
  const [saving, setSaving] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email || '')

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { count: pieces } = await supabase
      .from('pieces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: outfits } = await supabase
      .from('outfits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (profileData) setProfile(profileData)
    setPiecesCount(pieces || 0)
    setOutfitsCount(outfits || 0)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgrade') === 'success') {
      alert('🎉 Bem-vindo ao Mia Pro! Seu plano foi ativado.')
      window.history.replaceState({}, '', '/perfil')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData()
    }
    if (params.get('upgrade') === 'cancelled') {
      window.history.replaceState({}, '', '/perfil')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function openEdit(field: string) {
    setEditModal(field)
    if (field === 'name') setEditValue(profile?.name || '')
    if (field === 'height') setEditValue(profile?.height?.toString() || '')
    if (field === 'weight') setEditValue(profile?.weight?.toString() || '')
    if (field === 'style') {
      const current = profile?.style?.split('/').map(s => s.trim()) || []
      setEditStyles(current.filter(s => STYLES.includes(s)))
      setEditCustomStyle(current.filter(s => !STYLES.includes(s)).join(''))
    }
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)

    let updateData: ProfileUpdate = {}

    if (editModal === 'name') updateData.name = editValue
    if (editModal === 'height') updateData.height = parseInt(editValue) || null
    if (editModal === 'weight') updateData.weight = parseFloat(editValue) || null
    if (editModal === 'style') {
      const all = [...editStyles]
      if (editCustomStyle.trim()) all.push(editCustomStyle.trim())
      updateData.style = all.length > 0 ? all.join(' / ') : null
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single()

      if (error) throw error

      if (data) setProfile(data)
      setEditModal(null)
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpgrade() {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert('Erro ao iniciar pagamento. Tente novamente.')
    }
  }

  async function handleManageSubscription() {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert('Erro ao abrir portal. Tente novamente.')
    }
  }

  async function handleAvatarSave(url: string) {
    if (!profile) return;

    try {
      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);

      setCropOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Erro ao salvar avatar:', err)
      alert('Erro ao salvar foto. Tente novamente.')
    }
  }

  const stylesCount = profile?.style
    ? profile.style.split('/').filter(Boolean).length
    : 0

  if (loading) {
    return (
      <div className="perfil-loading">
        Carregando...
      </div>
    )
  }

  return (
    <>
      <DashboardTopBanner />

      <div className="perfil-header">
        <h1 className="perfil-title">
          Meu <span>Perfil</span>
        </h1>
      </div>

      <div className="perfil-content">
        
        {/* Avatar */}
        <div className="avatar-section">
          <div className="avatar-wrap">
            <div className="avatar">
              {profile?.avatar_url ? (
                <img src={`${profile.avatar_url}?v=${Date.now()}`} alt="avatar" />
              ) : (
                <span className="avatar-icon">👤</span>
              )}
            </div>
            <div className="avatar-edit" onClick={() => setCropOpen(true)}>
              ✏️
            </div>
          </div>
          <div className="avatar-name">{profile?.name || "Usuário"}</div>
          <div className="avatar-email">{email}</div>
        </div>

        {/* Stats */}
        <div className="perfil-stats">
          <div className="perfil-stat">
            <div className="perfil-stat-num">{piecesCount}</div>
            <div className="perfil-stat-label">Peças</div>
          </div>
          <div className="perfil-stat">
            <div className="perfil-stat-num">{outfitsCount}</div>
            <div className="perfil-stat-label">Outfits</div>
          </div>
          <div className="perfil-stat">
            <div className="perfil-stat-num">{stylesCount}</div>
            <div className="perfil-stat-label">Estilos</div>
          </div>
        </div>

        {/* Dados pessoais */}
        <div className="perfil-section-title">Dados Pessoais</div>
        <div className="field-group">
          <div className="field-row" onClick={() => openEdit("name")}>
            <span className="field-row-label">Nome</span>
            <div className="field-row-value-wrap">
              <span
                className={`field-row-value ${!profile?.name ? "empty" : ""}`}
              >
                {profile?.name || "Adicionar"}
              </span>
              <span className="field-row-arrow">›</span>
            </div>
          </div>
          <div className="field-row" onClick={() => openEdit("height")}>
            <span className="field-row-label">Altura</span>
            <div className="field-row-value-wrap">
              <span
                className={`field-row-value ${!profile?.height ? "empty" : ""}`}
              >
                {profile?.height ? `${profile.height}cm` : "Adicionar"}
              </span>
              <span className="field-row-arrow">›</span>
            </div>
          </div>
          <div className="field-row" onClick={() => openEdit("weight")}>
            <span className="field-row-label">Peso</span>
            <div className="field-row-value-wrap">
              <span
                className={`field-row-value ${!profile?.weight ? "empty" : ""}`}
              >
                {profile?.weight ? `${profile.weight}kg` : "Adicionar"}
              </span>
              <span className="field-row-arrow">›</span>
            </div>
          </div>
          <div className="field-row" onClick={() => openEdit("style")}>
            <span className="field-row-label">Estilo</span>
            <div className="field-row-value-wrap">
              <span
                className={`field-row-value field-row-value--small ${!profile?.style ? "empty" : ""}`}
              >
                {profile?.style || "Adicionar"}
              </span>
              <span className="field-row-arrow">›</span>
            </div>
          </div>
        </div>

        {/* Plano */}
        <div className="perfil-section-title">Plano</div>

        {profile?.plan === 'pro' ? (
          <>
            <div className="plan-card">
              <div className="plan-left">
                <div className="plan-icon">✦</div>
                <div>
                  <div className="plan-name">Plano Pro</div>
                  <div className="plan-desc">Acesso ilimitado</div>
                </div>
              </div>
              <div className="plan-badge">Pro</div>
            </div>
            <button
              className="upgrade-btn upgrade-btn--active"
              onClick={handleManageSubscription}
            >
              ✓ Plano Pro ativo — Gerenciar assinatura
            </button>
          </>
        ) : (() => {
          const daysLeft = getTrialDaysLeft(profile?.trial_ends_at ?? null)
          return (
            <>
              {daysLeft > 0 ? (
                <div className="trial-banner">
                  <div className="trial-banner-info">
                    <div className="trial-banner-title">✦ Período de teste ativo</div>
                    <div className="trial-banner-sub">
                      {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''} —
                      acesso completo a todas as funcionalidades
                    </div>
                  </div>
                  <div className="trial-days-badge">{daysLeft}d</div>
                </div>
              ) : (
                <div className="trial-expired-banner">
                  <div className="trial-banner-title">⚠️ Período de teste encerrado</div>
                  <div className="trial-banner-sub">Assine o Pro para continuar usando a Mia</div>
                </div>
              )}
              <button className="upgrade-btn" onClick={handleUpgrade}>
                ⚡ Assinar Pro — R$19/mês
              </button>
            </>
          )
        })()}

        {/* Logout */}
        <button className="logout-btn" onClick={handleLogout}>
          Sair da conta
        </button>

        <div className="perfil-footer-links">
          <a href="/sobre" className="perfil-footer-link">Sobre o Mia Outfit AI</a>
          <a href="/faq" className="perfil-footer-link">FAQ</a>
          <a href="/termos" className="perfil-footer-link">Termos</a>
          <a href="/privacidade" className="perfil-footer-link">Privacidade</a>
        </div>
      </div>

      {/* Modal de edição */}
      <div
        className={`edit-modal ${editModal ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setEditModal(null);
        }}
      >
        <div className="edit-sheet">
          <div className="edit-handle" />

          {editModal === "name" && (
            <>
              <div className="edit-title">Nome</div>
              <input
                className="edit-input"
                placeholder="Seu nome"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
              <button
                className="edit-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}

          {editModal === "height" && (
            <>
              <div className="edit-title">Altura</div>
              <input
                className="edit-input"
                placeholder="Ex: 180"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                type="number"
                step="0.01"
                autoFocus
              />
              <button
                className="edit-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}

          {editModal === "weight" && (
            <>
              <div className="edit-title">Peso</div>
              <input
                className="edit-input"
                placeholder="Ex: 80"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                type="number"
                autoFocus
              />
              <button
                className="edit-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}

          {editModal === "style" && (
            <>
              <div className="edit-title">
                Estilo (pode escolher mais de um)
              </div>
              <div className="style-chips">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    className={`style-chip ${editStyles.includes(s) ? "active" : ""}`}
                    onClick={() => {
                      setEditStyles((prev) =>
                        prev.includes(s)
                          ? prev.filter((x) => x !== s)
                          : [...prev, s],
                      );
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                className="edit-input"
                placeholder="Outro estilo (opcional)"
                value={editCustomStyle}
                onChange={(e) => setEditCustomStyle(e.target.value)}
              />
              <button
                className="edit-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>
      </div>
      {cropOpen && profile && (
        <AvatarCrop
          userId={profile.id}
          onSave={handleAvatarSave}
          onClose={() => setCropOpen(false)}
        />
      )}
    </>
  );
}