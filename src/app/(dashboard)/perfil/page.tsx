'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AvatarCrop from '@/components/ui/AvatarCrop'
import { PLAN_LIMITS, getUsagePercent, getUsageClass } from '@/lib/plan-limits'
import { PRECO_PRO_MENSAL } from '@/lib/pricing'
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
  usage_mia_generations: number | null
  usage_outfit_generations: number | null
  usage_pieces_analyzed: number | null
  usage_studio_generations: number | null
}

type LastPiece = {
  id: string
  name: string
  photo_url: string | null
}

type LastOutfit = {
  id: string
  name: string
  photo_url: string | null
}

const USAGE_ITEMS = [
  { label: 'Análises de peças', column: 'usage_pieces_analyzed' as const, limitKey: 'pieces_analyze' as const },
  { label: 'Outfits gerados', column: 'usage_outfit_generations' as const, limitKey: 'outfit_generate' as const },
  { label: 'Chat com a Mia', column: 'usage_mia_generations' as const, limitKey: 'mia_chat' as const },
  { label: 'Fotos de estúdio', column: 'usage_studio_generations' as const, limitKey: 'studio_generate' as const },
]

function getTrialDaysLeft(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function parseStyles(style: string | null): { selected: string[]; custom: string } {
  const current = style?.split('/').map(s => s.trim()) || []
  return {
    selected: current.filter(s => STYLES.includes(s)),
    custom: current.filter(s => !STYLES.includes(s)).join(''),
  }
}

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [piecesCount, setPiecesCount] = useState(0)
  const [outfitsCount, setOutfitsCount] = useState(0)
  const [lastPiece, setLastPiece] = useState<LastPiece | null>(null)
  const [lastOutfit, setLastOutfit] = useState<LastOutfit | null>(null)
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [inlineField, setInlineField] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [editStyles, setEditStyles] = useState<string[]>([])
  const [editCustomStyle, setEditCustomStyle] = useState('')
  const [saving, setSaving] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [manageLoading, setManageLoading] = useState(false)
  const [avatarVersion] = useState(() => Date.now())

  const inlineInputRef = useRef<HTMLInputElement>(null)

  function syncFormFromProfile(p: Profile) {
    setName(p.name || '')
    setHeight(p.height?.toString() || '')
    setWeight(p.weight?.toString() || '')
    const { selected, custom } = parseStyles(p.style)
    setEditStyles(selected)
    setEditCustomStyle(custom)
  }

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

    const { data: lastPieceData } = await supabase
      .from('pieces')
      .select('id, name, photo_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: lastOutfitData } = await supabase
      .from('outfits')
      .select('id, name, pieces')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let lastOutfitPhoto: string | null = null
    if (lastOutfitData?.pieces?.[0]) {
      const { data: coverPiece } = await supabase
        .from('pieces')
        .select('photo_url')
        .eq('id', lastOutfitData.pieces[0])
        .eq('user_id', user.id)
        .maybeSingle()
      lastOutfitPhoto = coverPiece?.photo_url ?? null
    }

    if (profileData) {
      setProfile(profileData)
      syncFormFromProfile(profileData)
    }
    setPiecesCount(pieces || 0)
    setOutfitsCount(outfits || 0)
    setLastPiece(lastPieceData)
    if (lastOutfitData) {
      setLastOutfit({ id: lastOutfitData.id, name: lastOutfitData.name, photo_url: lastOutfitPhoto })
    } else {
      setLastOutfit(null)
    }
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

  useEffect(() => {
    if (inlineField && inlineInputRef.current) {
      inlineInputRef.current.focus()
    }
  }, [inlineField])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function startEditing() {
    if (profile) syncFormFromProfile(profile)
    setEditing(true)
    setInlineField(null)
  }

  function buildStyleValue(): string | null {
    const all = [...editStyles]
    if (editCustomStyle.trim()) all.push(editCustomStyle.trim())
    return all.length > 0 ? all.join(' / ') : null
  }

  async function saveProfile(updateData: ProfileUpdate) {
    if (!profile) return false
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setProfile(data)
        syncFormFromProfile(data)
      }
      return true
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      alert('Erro ao salvar. Tente novamente.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAll() {
    const ok = await saveProfile({
      name: name || undefined,
      height: parseInt(height) || null,
      weight: parseFloat(weight) || null,
      style: buildStyleValue(),
    })
    if (ok) {
      setEditing(false)
      setInlineField(null)
    }
  }

  async function saveInlineField(field: string) {
    if (!profile) return

    const updateData: ProfileUpdate = {}
    if (field === 'name') updateData.name = name || undefined
    if (field === 'height') updateData.height = parseInt(height) || null
    if (field === 'weight') updateData.weight = parseFloat(weight) || null
    if (field === 'style') updateData.style = buildStyleValue()

    const ok = await saveProfile(updateData)
    if (ok) setInlineField(null)
  }

  function openInlineField(field: string) {
    if (editing || !profile) return
    syncFormFromProfile(profile)
    setInlineField(field)
  }

  async function handleUpgrade() {
    setUpgradeLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }

      alert(
        res.status === 400 && data.error
          ? data.error
          : 'Não foi possível iniciar o pagamento agora. Tente novamente em instantes.'
      )
    } catch {
      alert('Não foi possível iniciar o pagamento agora. Tente novamente em instantes.')
    } finally {
      setUpgradeLoading(false)
    }
  }

  async function handleManageSubscription() {
    setManageLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }

      if (res.status === 400) {
        alert(
          'Não encontramos uma assinatura ativa vinculada à sua conta. Se você acabou de assinar, aguarde alguns minutos.'
        )
        return
      }

      alert('Não foi possível abrir o gerenciamento de assinatura agora. Tente novamente em instantes.')
    } catch {
      alert('Não foi possível abrir o gerenciamento de assinatura agora. Tente novamente em instantes.')
    } finally {
      setManageLoading(false)
    }
  }

  async function handleAvatarSave(url: string) {
    if (!profile) return

    try {
      await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', profile.id)

      setCropOpen(false)
      window.location.reload()
    } catch (err) {
      console.error('Erro ao salvar avatar:', err)
      alert('Erro ao salvar foto. Tente novamente.')
    }
  }

  const stylesCount = profile?.style
    ? profile.style.split('/').filter(Boolean).length
    : 0

  const trialDaysLeft = getTrialDaysLeft(profile?.trial_ends_at ?? null)
  const isPro = profile?.plan === 'pro'
  const isUnlimited = isPro || trialDaysLeft > 0
  const planKey = isPro ? 'pro' : 'free'

  const avatarInitial = (profile?.name || email || 'U').charAt(0).toUpperCase()

  if (loading) {
    return <div className="perfil-loading">Carregando...</div>
  }

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <h1 className="perfil-title">Perfil</h1>
        {editing ? (
          <button
            type="button"
            className="perfil-save-btn"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        ) : (
          <button type="button" className="perfil-edit-btn" onClick={startEditing}>
            Editar
          </button>
        )}
      </header>

      <div className="perfil-avatar-section">
        <div className="perfil-avatar-wrap">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="perfil-avatar"
              src={`${profile.avatar_url}?v=${avatarVersion}`}
              alt="Avatar"
            />
          ) : (
            <div className="perfil-avatar-placeholder">
              <span className="perfil-avatar-initial">{avatarInitial}</span>
            </div>
          )}
          <button
            type="button"
            className="perfil-avatar-edit"
            onClick={() => setCropOpen(true)}
            aria-label="Editar foto"
          >
            ✎
          </button>
        </div>
        <span className="perfil-user-name">{profile?.name || 'Usuário'}</span>
        <span className="perfil-user-email">{email}</span>
      </div>

      <div className="perfil-stats">
        <button type="button" className="perfil-stat" onClick={() => router.push('/closet')}>
          <span className="perfil-stat-num">{piecesCount}</span>
          <span className="perfil-stat-label">Peças</span>
        </button>
        <button type="button" className="perfil-stat" onClick={() => router.push('/lookbook')}>
          <span className="perfil-stat-num">{outfitsCount}</span>
          <span className="perfil-stat-label">Outfits</span>
        </button>
        <div className="perfil-stat perfil-stat--static">
          <span className="perfil-stat-num">{stylesCount}</span>
          <span className="perfil-stat-label">Estilos</span>
        </div>
      </div>

      <section className="perfil-section">
        <span className="perfil-section-label">Destaques</span>
        <div className="perfil-highlights">
          {lastPiece ? (
            <button
              type="button"
              className="perfil-highlight"
              onClick={() => router.push(`/closet/${lastPiece.id}`)}
            >
              {lastPiece.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="perfil-highlight-img" src={lastPiece.photo_url} alt={lastPiece.name} />
              ) : (
                <div className="perfil-highlight-img perfil-highlight-img--empty">👕</div>
              )}
              <div className="perfil-highlight-info">
                <span className="perfil-highlight-type">Última peça</span>
                <span className="perfil-highlight-name">{lastPiece.name}</span>
              </div>
            </button>
          ) : (
            <div className="perfil-highlight perfil-highlight--empty">
              <div className="perfil-highlight-img perfil-highlight-img--empty">—</div>
              <div className="perfil-highlight-info">
                <span className="perfil-highlight-type">Última peça</span>
                <span className="perfil-highlight-name">Nenhuma peça</span>
              </div>
            </div>
          )}

          {lastOutfit ? (
            <button
              type="button"
              className="perfil-highlight"
              onClick={() => router.push(`/lookbook/${lastOutfit.id}`)}
            >
              {lastOutfit.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="perfil-highlight-img" src={lastOutfit.photo_url} alt={lastOutfit.name} />
              ) : (
                <div className="perfil-highlight-img perfil-highlight-img--empty">✦</div>
              )}
              <div className="perfil-highlight-info">
                <span className="perfil-highlight-type">Último outfit</span>
                <span className="perfil-highlight-name">{lastOutfit.name}</span>
              </div>
            </button>
          ) : (
            <div className="perfil-highlight perfil-highlight--empty">
              <div className="perfil-highlight-img perfil-highlight-img--empty">—</div>
              <div className="perfil-highlight-info">
                <span className="perfil-highlight-type">Último outfit</span>
                <span className="perfil-highlight-name">Nenhum outfit</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="perfil-section">
        <span className="perfil-section-label">Dados pessoais</span>
        <div className="perfil-fields">
          {/* Nome */}
          <div
            className={`perfil-field ${(editing || inlineField === 'name') ? 'perfil-field--editing' : ''}`}
            onClick={() => !editing && openInlineField('name')}
          >
            <span className="perfil-field-label">Nome</span>
            {(editing || inlineField === 'name') ? (
              <input
                ref={inlineField === 'name' ? inlineInputRef : undefined}
                className="perfil-field-input"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inlineField === 'name') saveInlineField('name')
                }}
                onBlur={() => {
                  if (inlineField === 'name') saveInlineField('name')
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div className="perfil-field-right">
                <span className={`perfil-field-value ${!profile?.name ? 'empty' : ''}`}>
                  {profile?.name || 'Adicionar'}
                </span>
                <span className="perfil-field-arrow">›</span>
              </div>
            )}
          </div>

          {/* Altura */}
          <div
            className={`perfil-field ${(editing || inlineField === 'height') ? 'perfil-field--editing' : ''}`}
            onClick={() => !editing && openInlineField('height')}
          >
            <span className="perfil-field-label">Altura</span>
            {(editing || inlineField === 'height') ? (
              <input
                ref={inlineField === 'height' ? inlineInputRef : undefined}
                className="perfil-field-input"
                value={height}
                onChange={e => setHeight(e.target.value)}
                type="number"
                placeholder="cm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && inlineField === 'height') saveInlineField('height')
                }}
                onBlur={() => {
                  if (inlineField === 'height') saveInlineField('height')
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div className="perfil-field-right">
                <span className={`perfil-field-value ${!profile?.height ? 'empty' : ''}`}>
                  {profile?.height ? `${profile.height}cm` : 'Adicionar'}
                </span>
                <span className="perfil-field-arrow">›</span>
              </div>
            )}
          </div>

          {/* Peso */}
          <div
            className={`perfil-field ${(editing || inlineField === 'weight') ? 'perfil-field--editing' : ''}`}
            onClick={() => !editing && openInlineField('weight')}
          >
            <span className="perfil-field-label">Peso</span>
            {(editing || inlineField === 'weight') ? (
              <input
                ref={inlineField === 'weight' ? inlineInputRef : undefined}
                className="perfil-field-input"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                type="number"
                placeholder="kg"
                onKeyDown={e => {
                  if (e.key === 'Enter' && inlineField === 'weight') saveInlineField('weight')
                }}
                onBlur={() => {
                  if (inlineField === 'weight') saveInlineField('weight')
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div className="perfil-field-right">
                <span className={`perfil-field-value ${!profile?.weight ? 'empty' : ''}`}>
                  {profile?.weight ? `${profile.weight}kg` : 'Adicionar'}
                </span>
                <span className="perfil-field-arrow">›</span>
              </div>
            )}
          </div>

          {/* Estilo */}
          <div
            className={`perfil-field ${(editing || inlineField === 'style') ? 'perfil-field--editing' : ''}`}
            onClick={() => !editing && openInlineField('style')}
          >
            <span className="perfil-field-label">Estilo</span>
            {(editing || inlineField === 'style') ? (
              <>
                <div className="style-chips" onClick={e => e.stopPropagation()}>
                  {STYLES.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`style-chip ${editStyles.includes(s) ? 'active' : ''}`}
                      onClick={() => {
                        setEditStyles(prev =>
                          prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                        )
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  className="perfil-style-custom"
                  placeholder="Outro estilo (opcional)"
                  value={editCustomStyle}
                  onChange={e => setEditCustomStyle(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onBlur={() => {
                    if (inlineField === 'style') saveInlineField('style')
                  }}
                />
              </>
            ) : (
              <div className="perfil-field-right">
                <span className={`perfil-field-value ${!profile?.style ? 'empty' : ''}`}>
                  {profile?.style || 'Adicionar'}
                </span>
                <span className="perfil-field-arrow">›</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="perfil-section">
        <span className="perfil-section-label">Plano</span>
        <div className="perfil-plan-card">
          <div className="perfil-plan-top">
            <div>
              <div className="perfil-plan-name">
                {isPro ? 'Plano Pro' : trialDaysLeft > 0 ? 'Período de teste' : 'Plano Free'}
              </div>
              <div className="perfil-plan-sub">
                {isPro
                  ? 'Acesso ilimitado'
                  : trialDaysLeft > 0
                    ? `${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''} restante${trialDaysLeft !== 1 ? 's' : ''} — acesso completo`
                    : trialDaysLeft === 0 && profile?.trial_ends_at
                      ? 'Período de teste encerrado'
                      : 'Limites mensais de uso'}
              </div>
            </div>
            <span className={`perfil-plan-badge ${!isPro && !trialDaysLeft ? 'perfil-plan-badge--free' : ''}`}>
              {isPro ? 'PRO' : trialDaysLeft > 0 ? 'TRIAL' : 'FREE'}
            </span>
          </div>

          <div className="perfil-usage">
            {USAGE_ITEMS.map(item => {
              const used = profile?.[item.column] ?? 0
              const limit = isUnlimited ? 999 : PLAN_LIMITS[planKey][item.limitKey]
              const pct = getUsagePercent(used, limit)
              const fillClass = getUsageClass(used, limit)

              return (
                <div key={item.column} className="perfil-usage-row">
                  <div className="perfil-usage-meta">
                    <span className="perfil-usage-name">{item.label}</span>
                    <span className="perfil-usage-count">
                      {limit >= 999 ? used : `${used} / ${limit}`}
                    </span>
                  </div>
                  <div className="perfil-usage-bar">
                    <div
                      className={`perfil-usage-fill ${fillClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {isPro ? (
            <button
              type="button"
              className="perfil-manage-btn"
              onClick={handleManageSubscription}
              disabled={manageLoading}
            >
              {manageLoading ? 'Abrindo...' : 'Gerenciar assinatura'}
            </button>
          ) : (
            <button
              type="button"
              className="perfil-upgrade-btn"
              onClick={handleUpgrade}
              disabled={upgradeLoading}
            >
              {upgradeLoading ? 'Redirecionando...' : `Assinar Pro — ${PRECO_PRO_MENSAL}`}
            </button>
          )}
        </div>
      </section>

      <footer className="perfil-footer">
        <button type="button" className="perfil-logout" onClick={handleLogout}>
          Sair da conta
        </button>
        <nav className="perfil-links">
          <a href="/sobre" className="perfil-link">Sobre a Mia Outfit AI</a>
          <a href="/faq" className="perfil-link">FAQ</a>
          <a href="/termos" className="perfil-link">Termos</a>
          <a href="/privacidade" className="perfil-link">Privacidade</a>
        </nav>
      </footer>

      {cropOpen && profile && (
        <AvatarCrop
          userId={profile.id}
          onSave={handleAvatarSave}
          onClose={() => setCropOpen(false)}
        />
      )}
    </div>
  )
}
