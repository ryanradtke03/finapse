import { useQuery } from '@tanstack/react-query'
import { getItems } from '../api/plaid'

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: getItems,
    staleTime: Infinity,
  })
}