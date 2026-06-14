/** Valor exibido do plano Pro — fonte única (Stripe live: R$ 19,00/mês). */
const PRO_VALOR = '19,00'

/** Preço com espaço após R$ (ex.: TrialExpiredModal). */
export const PRECO_PRO = `R$ ${PRO_VALOR}`

/** Preço compacto sem espaço (ex.: landing). */
export const PRECO_PRO_COMPACTO = `R$${PRO_VALOR}`

/** Preço mensal compacto (ex.: perfil, FAQ, termos). */
export const PRECO_PRO_MENSAL = `${PRECO_PRO_COMPACTO}/mês`
