'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'rounded-xl border-[#dfe2dc] border bg-[#fffaf5] px-4 py-3 text-sm outline-none focus:border-[#e56c4c] focus:ring-2 focus:ring-[#e56c4c]/20',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
