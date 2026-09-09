'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'rounded-xl border-[#dfe2dc] border bg-[#fffaf5] px-4 py-3 text-sm outline-none focus:border-[#e56c4c] focus:ring-2 focus:ring-[#e56c4c]/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }
