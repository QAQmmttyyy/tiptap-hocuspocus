'use client'

import { QueryProvider } from '@/components/providers/query-provider'
import ResponsiveLayout from '@/components/layout/responsive-layout'

export default function DocumentsLayout() {
  return (
    <QueryProvider>
      <ResponsiveLayout />
    </QueryProvider>
  )
} 