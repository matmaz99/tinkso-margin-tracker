"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string | null
  onValueChange?: (date: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: string | null
  maxDate?: string | null
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedDate = value ? new Date(value) : undefined
  const minDateObj = minDate ? new Date(minDate) : undefined
  const maxDateObj = maxDate ? new Date(maxDate) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onValueChange?.(date.toISOString().split('T')[0])
    } else {
      onValueChange?.(null)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-8",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "MMM dd, yyyy")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDateObj && date < minDateObj) return true
            if (maxDateObj && date > maxDateObj) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}