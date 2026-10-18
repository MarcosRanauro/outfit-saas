/**
 * Virtual Try-On (FASHN `tryon-v1.6`) pausado antes do lançamento: sem UI, sem tabela
 * `tryon_predictions` em produção (migration 0001) e sem limite de uso por plano.
 * Para retomar: aplicar a migration, regenerar os tipos, criar a tela, adicionar
 * o limite em `plan-limits.ts` e mudar a flag para `true`.
 */
export const TRYON_ENABLED = false
