import { useMe } from './useMe'

/**
 * Restituisce true se l'utente loggato ha almeno uno dei ruoli passati.
 * I ruoli sono in forma "NDC_ADMIN", "NDC_VIEWER", "NDC_SERVICE" come emessi dal BFF (/bff/api/me).
 */
export function useHasRole(...roles: string[]): boolean {
  const me = useMe()
  if (!me.data) return false
  return roles.some((r) => me.data!.roles.includes(r))
}

export function useIsAdmin(): boolean {
  return useHasRole('NDC_ADMIN')
}

export function useIsViewer(): boolean {
  return useHasRole('NDC_VIEWER', 'NDC_ADMIN')
}
