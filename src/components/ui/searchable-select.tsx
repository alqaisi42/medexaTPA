'use client'

import * as React from 'react'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Button } from './button'

export interface SearchableSelectOption {
    id: number | string
    label: string
    subLabel?: string
    disabled?: boolean
}

export interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value?: string | number
    onValueChange?: (value: string | number | null) => void
    placeholder?: string
    disabled?: boolean
    loading?: boolean
    error?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    renderOption?: (option: SearchableSelectOption) => React.ReactNode
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = 'Select an option',
    disabled = false,
    loading = false,
    error,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found',
    className,
    renderOption,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState('')
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    const selectedOption = React.useMemo(
        () => options.find((opt) => String(opt.id) === String(value)),
        [options, value],
    )

    const filteredOptions = React.useMemo(() => {
        if (!searchTerm.trim()) return options
        const term = searchTerm.toLowerCase()
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(term) ||
                opt.subLabel?.toLowerCase().includes(term) ||
                String(opt.id).toLowerCase().includes(term),
        )
    }, [options, searchTerm])

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearchTerm('')
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            // Focus search input when dropdown opens
            setTimeout(() => {
                searchInputRef.current?.focus()
            }, 100)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleSelect = (option: SearchableSelectOption) => {
        if (option.disabled) return
        onValueChange?.(option.id)
        setIsOpen(false)
        setSearchTerm('')
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onValueChange?.(null)
        setSearchTerm('')
    }

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            <div
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                    'placeholder:text-muted-foreground',
                    'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500',
                    isOpen && 'ring-2 ring-ring ring-offset-2',
                )}
                onClick={() => !disabled && !loading && setIsOpen(true)}
            >
                <div className="flex-1 truncate text-left">
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="font-medium">{selectedOption.label}</span>
                            {selectedOption.subLabel && (
                                <span className="text-xs text-gray-500">{selectedOption.subLabel}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {selectedOption && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                    ) : (
                        <ChevronDown
                            className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')}
                        />
                    )}
                </div>
            </div>

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md',
                        'max-h-[300px] overflow-hidden',
                    )}
                >
                    <div className="border-b p-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                ref={searchInputRef}
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="max-h-[240px] overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = String(option.id) === String(value)
                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className={cn(
                                            'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm',
                                            'outline-none hover:bg-accent hover:text-accent-foreground',
                                            'focus:bg-accent focus:text-accent-foreground',
                                            option.disabled && 'pointer-events-none opacity-50',
                                            isSelected && 'bg-accent text-accent-foreground',
                                        )}
                                    >
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </span>
                                        {renderOption ? (
                                            renderOption(option)
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="font-medium">{option.label}</span>
                                                {option.subLabel && (
                                                    <span className="text-xs text-gray-500">{option.subLabel}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

