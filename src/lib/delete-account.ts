export type DeleteAccountDeps = {
  /** Cancela a assinatura no Stripe; deve lançar erro se falhar. */
  cancelSubscription: (subscriptionId: string) => Promise<void>
  /** Remove todos os arquivos do usuário nos buckets. */
  removeStorageFiles: (userId: string) => Promise<void>
  /** Apaga o usuário no Auth (o banco apaga o resto via cascade). */
  deleteAuthUser: (userId: string) => Promise<void>
}

/**
 * Ordem importa: o Stripe vem primeiro, para que uma falha deixe tudo intacto
 * e o usuário possa tentar de novo; o Auth vem por último porque é irreversível.
 */
export async function deleteAccount(
  userId: string,
  subscriptionId: string | null,
  deps: DeleteAccountDeps
): Promise<void> {
  if (subscriptionId) await deps.cancelSubscription(subscriptionId)
  await deps.removeStorageFiles(userId)
  await deps.deleteAuthUser(userId)
}
