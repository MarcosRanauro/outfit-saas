import { describe, expect, it, vi } from 'vitest'
import { deleteAccount, type DeleteAccountDeps } from '@/lib/delete-account'

function makeDeps(overrides: Partial<DeleteAccountDeps> = {}) {
  const calls: string[] = []
  const deps: DeleteAccountDeps = {
    cancelSubscription: vi.fn(async () => { calls.push('stripe') }),
    removeStorageFiles: vi.fn(async () => { calls.push('storage') }),
    deleteAuthUser: vi.fn(async () => { calls.push('auth') }),
    ...overrides,
  }
  return { deps, calls }
}

describe('deleteAccount', () => {
  it('com assinatura → Stripe, depois Storage, depois Auth', async () => {
    const { deps, calls } = makeDeps()

    await deleteAccount('user-1', 'sub_123', deps)

    expect(deps.cancelSubscription).toHaveBeenCalledWith('sub_123')
    expect(calls).toEqual(['stripe', 'storage', 'auth'])
  })

  it('sem assinatura → não chama o Stripe', async () => {
    const { deps, calls } = makeDeps()

    await deleteAccount('user-1', null, deps)

    expect(deps.cancelSubscription).not.toHaveBeenCalled()
    expect(calls).toEqual(['storage', 'auth'])
  })

  it('Stripe falha → aborta sem apagar nada', async () => {
    const { deps } = makeDeps({
      cancelSubscription: vi.fn(async () => { throw new Error('stripe fora') }),
    })

    await expect(deleteAccount('user-1', 'sub_123', deps)).rejects.toThrow('stripe fora')
    expect(deps.removeStorageFiles).not.toHaveBeenCalled()
    expect(deps.deleteAuthUser).not.toHaveBeenCalled()
  })

  it('Storage falha → não apaga o usuário do Auth', async () => {
    const { deps } = makeDeps({
      removeStorageFiles: vi.fn(async () => { throw new Error('storage fora') }),
    })

    await expect(deleteAccount('user-1', null, deps)).rejects.toThrow('storage fora')
    expect(deps.deleteAuthUser).not.toHaveBeenCalled()
  })
})
