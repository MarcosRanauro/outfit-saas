'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AvatarCrop from '@/components/ui/AvatarCrop'
import DashboardTopBanner from '@/components/layout/DashboardTopBanner'
import '../../perfil.css'

const STYLES = ['Streetwear', 'Sportwear', 'Casual', 'Social', 'Minimalista']

type Profile = {
  id: string
  name: string | null
  height: number | null
  weight: number | null
  style: string | null
  avatar_url: string | null
  plan: string
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

  useEffect(() => {
    loadData()
  }, [])

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

    let updateData: any = {}

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
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                className={`field-row-value ${!profile?.style ? "empty" : ""}`}
                style={{ fontSize: "11px" }}
              >
                {profile?.style || "Adicionar"}
              </span>
              <span className="field-row-arrow">›</span>
            </div>
          </div>
        </div>

        {/* Plano */}
        <div className="perfil-section-title">Plano</div>
        <div className="plan-card">
          <div className="plan-left">
            <div className="plan-icon">✦</div>
            <div>
              <div className="plan-name">
                {profile?.plan === "pro" ? "Plano Pro" : "Plano Free"}
              </div>
              <div className="plan-desc">
                {profile?.plan === "pro"
                  ? "Acesso ilimitado"
                  : "20 msgs Mia · 5 outfits · 3 análises por mês"}
              </div>
            </div>
          </div>
          <div className="plan-badge">
            {profile?.plan === "pro" ? "Pro" : "Free"}
          </div>
        </div>

        {profile?.plan === 'free' && (
          <button
            className="upgrade-btn"
            onClick={() => {
              // TODO: redirecionar para checkout Stripe
              alert('Em breve! Estamos implementando o pagamento.')
            }}
          >
            ⚡ Fazer upgrade para Pro — R$19/mês
          </button>
        )}

        {/* Logout */}
        <button className="logout-btn" onClick={handleLogout}>
          Sair da conta
        </button>
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