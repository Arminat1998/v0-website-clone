"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiSelectDropdownProps {
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  className,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search query
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchQuery.toLowerCase()))

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onSelectionChange(selectedValues.filter((v) => v !== option))
    } else {
      onSelectionChange([...selectedValues, option])
    }
  }

  const selectAll = () => {
    onSelectionChange([...options])
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className="text-muted-foreground">
          {selectedValues.length > 0 ? `${selectedValues.length} geselecteerd` : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-ring",
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Select All / Clear All */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border text-xs">
            <button onClick={selectAll} className="text-primary hover:underline">
              Alles selecteren
            </button>
            <button onClick={clearAll} className="text-muted-foreground hover:text-foreground hover:underline">
              Wissen
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">Geen resultaten gevonden</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    )}
                  >
                    {/* Circle Checkbox */}
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/50",
                      )}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <span>{option}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
