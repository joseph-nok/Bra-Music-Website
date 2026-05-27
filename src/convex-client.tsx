import { ConvexReactClient } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'

const convexUrl = import.meta.env.VITE_CONVEX_URL

export const convex = new ConvexReactClient(convexUrl)
export const convexQueryClient = new ConvexQueryClient(convex)
export const queryClient = new QueryClient()
