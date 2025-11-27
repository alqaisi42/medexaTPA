'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    User,
    Eye,
    Filter,
    X,
    Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Subscriber, SubscriberSearchFilters } from '@/types/subscriber'
import {
    createSubscriber,
    deleteSubscriber,
    fetchSubscribers,
    fetchSubscriber,
    updateSubscriber,
} from '@/lib/api/subscribers'
import { SubscriberFormDialog } from './subscriber-form-dialog'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
]

export function SubscribersListPage() {
    const router = useRouter()
    const [subscribers, setSubscribers] = useState<Subscriber[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [genderFilter, setGenderFilter] = useState<string>('ALL')
    const [isAliveFilter, setIsAliveFilter] = useState<'ALL' | boolean>('ALL')
    const [ageMin, setAgeMin] = useState<string>('')
    const [ageMax, setAgeMax] = useState<string>('')
    const [hasActivePolicyFilter, setHasActivePolicyFilter] = useState<'ALL' | boolean>('ALL')
    const [hasActiveCardFilter, setHasActiveCardFilter] = useState<'ALL' | boolean>('ALL')
    const [filtersOpen, setFiltersOpen] = useState(false)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null)
    const [nameLanguage, setNameLanguage] = useState<'EN' | 'AR'>('EN')

    const loadSubscribers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const filters: SubscriberSearchFilters = {
                page,
                size: pageSize,
            }
            if (searchTerm.trim()) {
                filters.query = searchTerm.trim()
            }
            if (genderFilter !== 'ALL') {
                filters.gender = genderFilter
            }
            if (isAliveFilter !== 'ALL') {
                filters.isAlive = isAliveFilter
            }
            if (ageMin) {
                filters.ageMin = Number(ageMin)
            }
            if (ageMax) {
                filters.ageMax = Number(ageMax)
            }
            if (hasActivePolicyFilter !== 'ALL') {
                filters.hasActivePolicy = hasActivePolicyFilter
            }
            if (hasActiveCardFilter !== 'ALL') {
                filters.hasActiveCard = hasActiveCardFilter
            }

            const response = await fetchSubscribers(filters)
            setSubscribers(response.content)
            setTotalPages(Math.max(response.totalPages || 1, 1))
            setTotalElements(response.totalElements || 0)
        } catch (requestError) {
            console.error(requestError)
            setError(requestError instanceof Error ? requestError.message : 'Unable to load subscribers')
            setSubscribers([])
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, searchTerm, genderFilter, isAliveFilter, ageMin, ageMax, hasActivePolicyFilter, hasActiveCardFilter])

    useEffect(() => {
        void loadSubscribers()
    }, [loadSubscribers])

    const calculateAge = (dob: Subscriber['dateOfBirth']): number | null => {
        if (!dob) return null
        let birthDate: Date
        if (Array.isArray(dob)) {
            birthDate = new Date(dob[0], dob[1] - 1, dob[2])
        } else if (typeof dob === 'string') {
            birthDate = new Date(dob)
        } else {
            return null
        }
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    const formatDate = (date: Subscriber['dateOfBirth']): string => {
        if (!date) return '-'
        if (Array.isArray(date)) {
            return `${date[0]}-${String(date[1]).padStart(2, '0')}-${String(date[2]).padStart(2, '0')}`
        }
        if (typeof date === 'string') {
            return new Date(date).toLocaleDateString()
        }
        return '-'
    }

    const formatTimestamp = (timestamp: number | string | null): string => {
        if (!timestamp) return '-'
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
        return date.toLocaleDateString()
    }

    const handleCreate = () => {
        setEditingSubscriber(null)
        setIsFormOpen(true)
    }

    const handleEdit = async (subscriber: Subscriber) => {
        try {
            const freshSubscriber = await fetchSubscriber(subscriber.id)
            setEditingSubscriber(freshSubscriber)
            setIsFormOpen(true)
        } catch (editError) {
            console.error(editError)
            setError(editError instanceof Error ? editError.message : 'Unable to load subscriber data for editing')
        }
    }

    const handleFormSubmit = async () => {
        // Form submission is handled in SubscriberFormDialog
        setIsFormOpen(false)
        setEditingSubscriber(null)
        await loadSubscribers()
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeletingId(deleteTarget.id)
        try {
            await deleteSubscriber(deleteTarget.id)
            setDeleteTarget(null)
            await loadSubscribers()
        } catch (deleteError) {
            console.error(deleteError)
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete subscriber')
        } finally {
            setDeletingId(null)
        }
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
    }

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize)
        setPage(0)
    }

    const handleView = (subscriber: Subscriber) => {
        router.push(`/subscribers/${subscriber.id}`)
    }

    const handleClearFilters = () => {
        setGenderFilter('ALL')
        setIsAliveFilter('ALL')
        setAgeMin('')
        setAgeMax('')
        setHasActivePolicyFilter('ALL')
        setHasActiveCardFilter('ALL')
        setPage(0)
    }

    const activeFiltersCount = [
        genderFilter !== 'ALL',
        isAliveFilter !== 'ALL',
        ageMin || ageMax,
        hasActivePolicyFilter !== 'ALL',
        hasActiveCardFilter !== 'ALL',
    ].filter(Boolean).length

    const actionInProgress = loading || saving || deletingId !== null

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Subscribers</h1>
                        <p className="text-sm text-gray-600">Manage subscribers and their information.</p>
                    </div>
                </div>
                <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={handleCreate} disabled={actionInProgress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subscriber
                </Button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        className="pl-9"
                        placeholder="Search by National ID, Name, or Phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setPage(0)
                                void loadSubscribers()
                            }
                        }}
                    />
                </div>
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="relative">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="ml-2 rounded-full bg-tpa-primary text-white text-xs px-2 py-0.5">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[300px] sm:w-[400px]">
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select value={genderFilter} onValueChange={setGenderFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Genders" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Genders</SelectItem>
                                        {GENDER_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Is Alive</Label>
                                <Select
                                    value={isAliveFilter === 'ALL' ? 'ALL' : isAliveFilter ? 'YES' : 'NO'}
                                    onValueChange={(value) => {
                                        if (value === 'ALL') {
                                            setIsAliveFilter('ALL')
                                        } else {
                                            setIsAliveFilter(value === 'YES')
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="YES">Yes</SelectItem>
                                        <SelectItem value="NO">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Age Range</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="Min"
                                        value={ageMin}
                                        onChange={(e) => setAgeMin(e.target.value)}
                                        className="w-full"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="Max"
                                        value={ageMax}
                                        onChange={(e) => setAgeMax(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Has Active Policy</Label>
                                <Select
                                    value={hasActivePolicyFilter === 'ALL' ? 'ALL' : hasActivePolicyFilter ? 'YES' : 'NO'}
                                    onValueChange={(value) => {
                                        if (value === 'ALL') {
                                            setHasActivePolicyFilter('ALL')
                                        } else {
                                            setHasActivePolicyFilter(value === 'YES')
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="YES">Yes</SelectItem>
                                        <SelectItem value="NO">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Has Active Card</Label>
                                <Select
                                    value={hasActiveCardFilter === 'ALL' ? 'ALL' : hasActiveCardFilter ? 'YES' : 'NO'}
                                    onValueChange={(value) => {
                                        if (value === 'ALL') {
                                            setHasActiveCardFilter('ALL')
                                        } else {
                                            setHasActiveCardFilter(value === 'YES')
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="YES">Yes</SelectItem>
                                        <SelectItem value="NO">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                                <Button
                                    onClick={() => {
                                        setPage(0)
                                        void loadSubscribers()
                                        setFiltersOpen(false)
                                    }}
                                    className="flex-1"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <Button variant="outline" onClick={() => {
                    setPage(0)
                    void loadSubscribers()
                }} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                </Button>
                <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Name:</Label>
                    <Button
                        variant={nameLanguage === 'EN' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNameLanguage('EN')}
                    >
                        EN
                    </Button>
                    <Button
                        variant={nameLanguage === 'AR' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNameLanguage('AR')}
                    >
                        AR
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">National ID</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead className="w-20">Type</TableHead>
                            <TableHead className="w-20">Gender</TableHead>
                            <TableHead className="w-28">Date of Birth</TableHead>
                            <TableHead className="w-24">Status</TableHead>
                            <TableHead className="w-20">Policies</TableHead>
                            <TableHead className="w-24">Dependents</TableHead>
                            <TableHead>Last Update</TableHead>
                            <TableHead className="w-40 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </TableCell>
                                </TableRow>
                            ) : subscribers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                        No subscribers found
                                    </TableCell>
                                </TableRow>
                        ) : (
                            subscribers.map((subscriber) => {
                                const age = calculateAge(subscriber.dateOfBirth)
                                return (
                                    <TableRow 
                                        key={subscriber.id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleView(subscriber)}
                                    >
                                        <TableCell className="font-mono text-sm">{subscriber.nationalId}</TableCell>
                                        <TableCell className="font-medium">
                                            {nameLanguage === 'EN' 
                                                ? subscriber.fullNameEn 
                                                : subscriber.fullNameAr || subscriber.fullNameEn}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                    subscriber.isHeadOfFamily
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700',
                                                )}
                                            >
                                                {subscriber.isHeadOfFamily ? 'HOF' : 'Dependent'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {subscriber.gender === 'M' ? 'Male' : 
                                             subscriber.gender === 'F' ? 'Female' : 
                                             subscriber.gender === 'O' ? 'Other' : subscriber.gender}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(subscriber.dateOfBirth)}
                                            {age !== null && (
                                                <span className="text-gray-400 ml-1">({age} yrs)</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                    subscriber.isAlive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700',
                                                )}
                                            >
                                                {subscriber.isAlive ? 'Alive' : 'Deceased'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {subscriber.currentPolicyId ? 'Active' : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">-</TableCell>
                                        <TableCell className="text-sm">
                                            {formatTimestamp(subscriber.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(subscriber)}
                                                    disabled={actionInProgress}
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(subscriber)}
                                                    disabled={actionInProgress}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(subscriber)}
                                                    disabled={actionInProgress || deletingId === subscriber.id}
                                                >
                                                    {deletingId === subscriber.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalElements > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of{' '}
                        {totalElements} subscribers
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => handlePageSizeChange(Number(value))}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(0)}
                                disabled={page === 0 || loading}
                            >
                                First
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0 || loading}
                            >
                                Previous
                            </Button>
                            <span className="px-3 py-1 text-sm">
                                Page {page + 1} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages - 1 || loading}
                            >
                                Next
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(totalPages - 1)}
                                disabled={page >= totalPages - 1 || loading}
                            >
                                Last
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <SubscriberFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) {
                        setEditingSubscriber(null)
                    }
                }}
                subscriber={editingSubscriber}
                onSuccess={handleFormSubmit}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Subscriber</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the subscriber "{deleteTarget?.fullNameEn}"? This action cannot be
                            undone and will only work if the subscriber has no policies.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deletingId !== null}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
                            {deletingId !== null ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

