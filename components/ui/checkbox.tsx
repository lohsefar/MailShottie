"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentProps<"input"> {
  label?: string
  onCheckedChange?: (checked: boolean) => void
}

function Checkbox({ className, label, id, checked, onCheckedChange, ...props }: CheckboxProps) {
  const checkboxId = id || React.useId()
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked)
    }
    // Also call original onChange if provided
    if (props.onChange) {
      props.onChange(e)
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={handleChange}
        className={cn(
          "h-4 w-4 rounded-none border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
    </div>
  )
}

export { Checkbox }

