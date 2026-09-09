'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-xs font-bold uppercase tracking-[0.18em] text-[#87918a] mb-1.5 block',
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = 'Label'

export { Label }
