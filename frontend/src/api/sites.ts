import { useQuery } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db } from '@/mocks/db'
import type { Site } from '@/types'

export function useSites() {
  return useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: () => mockRequest(() => db.sites),
  })
}
