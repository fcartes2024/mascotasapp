'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState<boolean>(defaultChecked ?? false)
    const isControlled = checked !== undefined
    const isChecked = isControlled ? checked! : internalChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked)
      }
      onChange?.(e)
    }

    const id = React.useId()
    const inputId = props.id ?? `checkbox-${id}`

    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          className={cn(
            'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-lg border-2 border-[#dfe2dc] bg-[#fffaf5] transition-all',
            'hover:border-[#52705a]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e56c4c]/20 focus-visible:ring-offset-2',
            'checked:bg-[#52705a] checked:border-[#52705a]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

interface CheckboxWithLabelProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode
  labelClassName?: string
}

const CheckboxWithLabel = React.forwardRef<HTMLInputElement, CheckboxWithLabelProps>(
  ({ label, labelClassName, className, id, checked, defaultChecked, onChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState<boolean>(defaultChecked ?? false)
    const isControlled = checked !== undefined
    const isChecked = isControlled ? checked! : internalChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked)
      }
      onChange?.(e)
    }

    const autoId = React.useId()
    const inputId = id ?? `checkbox-label-${autoId}`

    return (
      <div className="flex items-center gap-3">
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={isChecked}
            onChange={handleChange}
            className={cn(
              'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-lg border-2 border-[#dfe2dc] bg-[#fffaf5] transition-all',
              'hover:border-[#52705a]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e56c4c]/20 focus-visible:ring-offset-2',
              'checked:bg-[#52705a] checked:border-[#52705a]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm text-[#25302b] cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            labelClassName
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
CheckboxWithLabel.displayName = 'CheckboxWithLabel'

export { Checkbox, CheckboxWithLabel }
