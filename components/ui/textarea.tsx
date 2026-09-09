'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        rows={rows}
        className={cn(
          'rounded-xl border-[#dfe2dc] border bg-[#fffaf5] px-4 py-3 text-sm outline-none focus:border-[#e56c4c] focus:ring-2 focus:ring-[#e56c4c]/20 resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
