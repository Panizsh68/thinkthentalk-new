"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<'button'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const Switch = React.forwardRef<
  React.ElementRef<'button'>,
  SwitchProps
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  const dataState = checked ? 'checked' : 'unchecked'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={dataState}
      ref={ref}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border border-gray-400/30 bg-gray-300 transition-colors duration-300 ease-out data-[state=checked]:bg-teal-600 data-[state=unchecked]:bg-gray-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:data-[state=checked]:bg-teal-500 dark:data-[state=unchecked]:bg-gray-600",
        className
      )}
      {...props}
    >
      <span
        data-state={dataState}
        className="pointer-events-none switch-thumb absolute left-0.5 top-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ease-out data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:bg-gray-100"
      ></span>
    </button>
  )
})
Switch.displayName = "Switch"

export { Switch }
