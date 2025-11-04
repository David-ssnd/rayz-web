import { memo } from 'react'
import { BowArrow, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface DeviceBadgeProps {
  badge?: string
}

export const DeviceBadge = memo(({ badge }: DeviceBadgeProps) => {
  if (!badge) return null

  const icon =
    badge === 'Target' ? <Target className="h-4 w-4" /> : <BowArrow className="h-4 w-4" />

  return (
    <Badge variant="hardware" className="px-2 py-1">
      {icon}
      <span>{badge}</span>
    </Badge>
  )
})
