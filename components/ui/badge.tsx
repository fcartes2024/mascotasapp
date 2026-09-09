'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider inline-flex items-center',
  {
    variants: {
      variant: {
        default: 'bg-[#e6eee1] text-[#52705a]',
        naranja: 'bg-[#ead9c6] text-[#9a624b]',
        rojo: 'bg-[#fde4dc] text-[#cf593d]',
        obscuro: 'bg-[#25302b] text-[#fffaf5]',
        gris: 'bg-[#efeff2] text-[#68716b]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
