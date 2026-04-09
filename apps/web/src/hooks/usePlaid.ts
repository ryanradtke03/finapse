import { useQuery } from '@tanstack/react-query'
import { getAccounts, getItems } from '../api/plaid'

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: getItems,
    staleTime: Infinity,
  })
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    staleTime: Infinity,
  })
}