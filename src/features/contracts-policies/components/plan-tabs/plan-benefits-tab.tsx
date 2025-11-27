'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Plus,
    Search,
    RefreshCw,
    Edit,
    Trash2,
    Shield,
    AlertCircle,
    CheckCircle,
    Clock,
    DollarSign,
    Users,
    Settings,
    ChevronDown,
    ChevronRight,
    Info,
    Calendar,
    UserCheck,
    Ban,
    Eye,
    EyeOff,
    Zap,
    Target,
    Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PlanBenefit, MasterBenefit } from '@/types/plan'
import { fetchPlanBenefits, removeBenefitFromPlan, fetchMasterBenefits } from '@/lib/api/plans'
import { BenefitFormDrawer } from '../benefit-form-drawer'
import { cn } from '@/lib/utils'

interface PlanBenefitsTabProps {
    planId: number
}

function formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

function formatFrequency(frequencyValue: number | null, frequencyUnit: string | null, frequencyDuration: number | null): string {
    if (!frequencyValue || !frequencyUnit) return 'No frequency limit'
    
    const unitMap: Record<string, string> = {
        'DAYS': 'day',
        'WEEKS': 'week', 
        'MONTHS': 'month',
        'YEARS': 'year'
    }
    
    const unit = unitMap[frequencyUnit] || frequencyUnit.toLowerCase()
    const plural = frequencyValue > 1 ? `${unit}s` : unit
    const duration = frequencyDuration ? ` (for ${frequencyDuration} ${unit}${frequencyDuration > 1 ? 's' : ''})` : ''
    
    return `${frequencyValue} time${frequencyValue > 1 ? 's' : ''} per ${plural}${duration}`
}

function formatAgeRange(minAgeMonths: number | null, maxAgeMonths: number | null, maxAgeYears: number | null): string {
    const parts: string[] = []
    
    if (minAgeMonths !== null) {
        const years = Math.floor(minAgeMonths / 12)
        const months = minAgeMonths % 12
        if (years > 0) {
            parts.push(`From ${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`)
        } else {
            parts.push(`From ${months} month${months > 1 ? 's' : ''}`)
        }
    }
    
    if (maxAgeYears !== null) {
        parts.push(`up to ${maxAgeYears} year${maxAgeYears > 1 ? 's' : ''}`)
    } else if (maxAgeMonths !== null) {
        const years = Math.floor(maxAgeMonths / 12)
        const months = maxAgeMonths % 12
        if (years > 0) {
            parts.push(`up to ${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`)
        } else {
            parts.push(`up to ${months} month${months > 1 ? 's' : ''}`)
        }
    }
    
    return parts.length > 0 ? parts.join(' ') : 'All ages eligible'
}

function formatWaitingPeriod(days: number): string {
    if (days === 0) return 'No waiting period'
    if (days === 1) return '1 day waiting period'
    if (days < 30) return `${days} days waiting period`
    
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    
    if (remainingDays === 0) {
        return `${months} month${months > 1 ? 's' : ''} waiting period`
    } else {
        return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''} waiting period`
    }
}

function formatGenderScope(scope: string): string {
    const genderMap: Record<string, string> = {
        'BOTH': 'All genders',
        'MALE': 'Male only',
        'FEMALE': 'Female only'
    }
    return genderMap[scope] || scope
}

function formatSubscriberType(type: string): string {
    const typeMap: Record<string, string> = {
        'ALL': 'All members',
        'SUBSCRIBER_ONLY': 'Primary member only',
        'DEPENDENTS_ONLY': 'Dependents only'
    }
    return typeMap[type] || type
}

function formatCoverageStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'COVERED': 'Covered',
        'NOT_COVERED': 'Not Covered',
        'EXCLUDED': 'Excluded'
    }
    return statusMap[status] || status
}

function formatPreExistingBasis(basis: string): string {
    const basisMap: Record<string, string> = {
        'JOINING_DATE': 'From joining date',
        'POLICY_START': 'From policy start',
        'NEVER': 'Never covered'
    }
    return basisMap[basis] || basis
}

function getUsageFlagIcon(flag: boolean, type: 'copay' | 'limit' | 'coverage') {
    const icons = {
        copay: DollarSign,
        limit: Target,
        coverage: Shield
    }
    const Icon = icons[type]
    return flag ? <Icon className="h-3 w-3 text-green-600" /> : <Icon className="h-3 w-3 text-gray-300" />
}

function getBooleanBadge(value: boolean, trueLabel: string = 'Yes', falseLabel: string = 'No') {
    return (
        <span className={cn(
            'inline-flex px-2 py-1 rounded-full text-xs font-medium',
            value 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
        )}>
            {value ? trueLabel : falseLabel}
        </span>
    )
}

export function PlanBenefitsTab({ planId }: PlanBenefitsTabProps) {
    const [benefits, setBenefits] = useState<PlanBenefit[]>([])
    const [masterBenefits, setMasterBenefits] = useState<MasterBenefit[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showBenefitDrawer, setShowBenefitDrawer] = useState(false)
    const [selectedBenefit, setSelectedBenefit] = useState<PlanBenefit | null>(null)
    const [selectedMasterBenefit, setSelectedMasterBenefit] = useState<MasterBenefit | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

    // Load plan benefits
    const loadBenefits = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchPlanBenefits(planId)
            if (response.success && response.data) {
                setBenefits(response.data.content)
            }
        } catch (err) {
            console.error('Failed to load plan benefits', err)
            setError(err instanceof Error ? err.message : 'Unable to load plan benefits')
        } finally {
            setLoading(false)
        }
    }, [planId])

    // Load master benefits for adding
    const loadMasterBenefits = useCallback(async () => {
        try {
            const response = await fetchMasterBenefits()
            if (response.success && response.data) {
                setMasterBenefits(response.data.content)
            }
        } catch (err) {
            console.error('Failed to load master benefits', err)
        }
    }, [])

    useEffect(() => {
        void loadBenefits()
        void loadMasterBenefits()
    }, [loadBenefits, loadMasterBenefits])

    const handleDeleteBenefit = async () => {
        if (!selectedBenefit) return

        setDeleting(true)
        setError(null)
        try {
            await removeBenefitFromPlan(planId, selectedBenefit.id)
            setShowDeleteDialog(false)
            setSelectedBenefit(null)
            await loadBenefits()
        } catch (err) {
            console.error('Failed to delete benefit', err)
            setError(err instanceof Error ? err.message : 'Unable to delete benefit')
        } finally {
            setDeleting(false)
        }
    }

    const handleAddBenefit = () => {
        setDrawerMode('add')
        setSelectedBenefit(null)
        setSelectedMasterBenefit(null)
        setShowBenefitDrawer(true)
    }

    const handleEditBenefit = (benefit: PlanBenefit) => {
        setDrawerMode('edit')
        setSelectedBenefit(benefit)
        setSelectedMasterBenefit(null)
        setShowBenefitDrawer(true)
    }

    const handleBenefitSaved = () => {
        setShowBenefitDrawer(false)
        void loadBenefits()
    }

    const toggleRowExpansion = (benefitId: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev)
            if (newSet.has(benefitId)) {
                newSet.delete(benefitId)
            } else {
                newSet.add(benefitId)
            }
            return newSet
        })
    }

    const getCoverageStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COVERED':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'NOT_COVERED':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            case 'EXCLUDED':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-400" />
        }
    }

    const getCoverageStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COVERED':
                return 'bg-green-100 text-green-700'
            case 'NOT_COVERED':
                return 'bg-red-100 text-red-700'
            case 'EXCLUDED':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const filteredBenefits = benefits.filter(benefit =>
        benefit.benefitCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        benefit.benefitNameEn.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Plan Benefits
                    </h2>
                    <p className="text-gray-600 mt-1">Manage benefits and coverage for this plan</p>
                </div>
                <Button onClick={handleAddBenefit}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Benefit
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Benefits</p>
                                <p className="text-2xl font-bold">{benefits.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Covered</p>
                                <p className="text-2xl font-bold">
                                    {benefits.filter(b => b.coverage.coverageStatus === 'COVERED').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Settings className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">With Preauth</p>
                                <p className="text-2xl font-bold">
                                    {benefits.filter(b => b.rules.requiresPreauth).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">With Copay</p>
                                <p className="text-2xl font-bold">
                                    {benefits.filter(b => b.copay.copayType && b.copay.copayType !== 'NONE').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Target className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Coverage Drivers</p>
                                <p className="text-2xl font-bold">
                                    {benefits.filter(b => b.rules.isCoverageDriver).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 rounded-lg">
                                <Timer className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">With Frequency</p>
                                <p className="text-2xl font-bold">
                                    {benefits.filter(b => b.rules.frequencyValue && b.rules.frequencyUnit).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search benefits by code or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => void loadBenefits()} disabled={loading}>
                            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Benefits Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Benefits</CardTitle>
                    <CardDescription>
                        {filteredBenefits.length > 0
                            ? `${filteredBenefits.length} benefit${filteredBenefits.length === 1 ? '' : 's'} found`
                            : 'No benefits found'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : filteredBenefits.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">No Benefits Found</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {searchQuery
                                    ? 'Try adjusting your search criteria'
                                    : 'Add benefits to this plan to get started'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleAddBenefit}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Benefit
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Benefit Information</TableHead>
                                        <TableHead>Coverage Status</TableHead>
                                        <TableHead>Waiting Period</TableHead>
                                        <TableHead>Financial Limits</TableHead>
                                        <TableHead>Member Responsibility</TableHead>
                                        <TableHead>Eligibility Rules</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBenefits.map((benefit) => (
                                        <>
                                            <TableRow key={benefit.id} className="hover:bg-gray-50">
                                                {/* Expand/Collapse Button */}
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleRowExpansion(benefit.id)}
                                                        className="p-1 h-6 w-6"
                                                        title="Click to see more details"
                                                    >
                                                        {expandedRows.has(benefit.id) ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>

                                                {/* Benefit Information */}
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-sm text-gray-900">{benefit.benefitNameEn}</div>
                                                        <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            Code: {benefit.benefitCode}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Coverage Status */}
                                                <TableCell>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            {getCoverageStatusIcon(benefit.coverage.coverageStatus)}
                                                            <span className={cn(
                                                                'inline-flex px-3 py-1 rounded-full text-sm font-medium',
                                                                getCoverageStatusColor(benefit.coverage.coverageStatus)
                                                            )}>
                                                                {formatCoverageStatus(benefit.coverage.coverageStatus)}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Pre-existing conditions */}
                                                        <div className="text-xs">
                                                            {benefit.coverage.coverPreExisting ? (
                                                                <div className="flex items-center gap-1 text-green-600">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    <span>Pre-existing covered</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-red-600">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    <span>Pre-existing not covered</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Waiting Period */}
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {benefit.coverage.waitingPeriodDays === 0 ? (
                                                            <div className="flex items-center gap-2 text-green-600">
                                                                <CheckCircle className="h-4 w-4" />
                                                                <span className="text-sm font-medium">Immediate coverage</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-amber-600">
                                                                    <Clock className="h-4 w-4" />
                                                                    <span className="text-sm font-medium">
                                                                        {benefit.coverage.waitingPeriodDays} day{benefit.coverage.waitingPeriodDays > 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {formatWaitingPeriod(benefit.coverage.waitingPeriodDays)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Financial Limits */}
                                                <TableCell>
                                                    <div className="space-y-2">
                                                        {/* Main Limit */}
                                                        {benefit.limits.limitAmount ? (
                                                            <div className="space-y-1">
                                                                <div className="font-semibold text-sm text-gray-900">
                                                                    {formatCurrency(benefit.limits.limitAmount)}
                                                                </div>
                                                                <div className="text-xs text-gray-500 capitalize">
                                                                    {benefit.limits.limitPeriod.replace('_', ' ').toLowerCase()}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle className="h-3 w-3" />
                                                                <span className="text-sm">Unlimited</span>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Session Limit */}
                                                        {benefit.limits.sessionLimit && (
                                                            <div className="text-xs text-gray-600">
                                                                <span className="font-medium">Session limit:</span> {benefit.limits.sessionLimit}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Network-specific limits */}
                                                        {(benefit.limits.limitInNetwork || benefit.limits.limitOutNetwork) && (
                                                            <div className="text-xs space-y-1">
                                                                {benefit.limits.limitInNetwork && (
                                                                    <div className="flex items-center gap-1 text-green-600">
                                                                        <span className="font-medium">In-network:</span> {formatCurrency(benefit.limits.limitInNetwork)}
                                                                    </div>
                                                                )}
                                                                {benefit.limits.limitOutNetwork && (
                                                                    <div className="flex items-center gap-1 text-orange-600">
                                                                        <span className="font-medium">Out-of-network:</span> {formatCurrency(benefit.limits.limitOutNetwork)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Member Responsibility (Copay) */}
                                                <TableCell>
                                                    <div className="space-y-2">
                                                        {benefit.copay.copayType && benefit.copay.copayType !== 'NONE' ? (
                                                            <div className="space-y-1">
                                                                <div className="font-semibold text-sm text-gray-900">
                                                                    {benefit.copay.copayType === 'FIXED' 
                                                                        ? formatCurrency(benefit.copay.copayValue)
                                                                        : `${benefit.copay.copayValue}%`
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-500 capitalize">
                                                                    {benefit.copay.copayType === 'FIXED' ? 'Fixed amount' : 'Percentage'}
                                                                </div>
                                                                
                                                                {/* Copay range */}
                                                                {(benefit.copay.minCopayAmount || benefit.copay.maxCopayAmount) && (
                                                                    <div className="text-xs text-gray-600">
                                                                        {benefit.copay.minCopayAmount && (
                                                                            <div>Min: {formatCurrency(benefit.copay.minCopayAmount)}</div>
                                                                        )}
                                                                        {benefit.copay.maxCopayAmount && (
                                                                            <div>Max: {formatCurrency(benefit.copay.maxCopayAmount)}</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle className="h-3 w-3" />
                                                                <span className="text-sm">No copay required</span>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Network-specific copay */}
                                                        {(benefit.copay.copayInNetwork || benefit.copay.copayOutNetwork) && (
                                                            <div className="text-xs space-y-1">
                                                                {benefit.copay.copayInNetwork && (
                                                                    <div className="flex items-center gap-1 text-green-600">
                                                                        <span className="font-medium">In-network:</span> {formatCurrency(benefit.copay.copayInNetwork)}
                                                                    </div>
                                                                )}
                                                                {benefit.copay.copayOutNetwork && (
                                                                    <div className="flex items-center gap-1 text-orange-600">
                                                                        <span className="font-medium">Out-of-network:</span> {formatCurrency(benefit.copay.copayOutNetwork)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Eligibility Rules */}
                                                <TableCell>
                                                    <div className="space-y-2">
                                                        {/* Gender and Age */}
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {formatGenderScope(benefit.coverage.genderScope)}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {formatAgeRange(benefit.coverage.minAgeMonths, benefit.coverage.maxAgeMonths, benefit.coverage.maxAgeYears)}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Member Type */}
                                                        <div className="text-xs">
                                                            <span className="inline-flex px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                                {formatSubscriberType(benefit.rules.subscriberEligibilityType)}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Preauth requirement */}
                                                        <div className="text-xs">
                                                            {benefit.rules.requiresPreauth ? (
                                                                <div className="flex items-center gap-1 text-amber-600">
                                                                    <Settings className="h-3 w-3" />
                                                                    <span>Pre-authorization required</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-green-600">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    <span>No pre-authorization needed</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditBenefit(benefit)}
                                                            title="Edit this benefit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedBenefit(benefit)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                            title="Remove this benefit"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Row Details */}
                                            {expandedRows.has(benefit.id) && (
                                                <TableRow className="bg-blue-50/30">
                                                    <TableCell colSpan={8}>
                                                        <div className="p-6 space-y-6">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Info className="h-5 w-5 text-blue-600" />
                                                                <h3 className="text-lg font-semibold text-gray-900">
                                                                    Complete Benefit Details - {benefit.benefitNameEn}
                                                                </h3>
                                                            </div>

                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                {/* Left Column */}
                                                                <div className="space-y-6">
                                                                    {/* Coverage Information */}
                                                                    <Card>
                                                                        <CardHeader className="pb-3">
                                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                                <Shield className="h-4 w-4 text-blue-600" />
                                                                                Coverage Information
                                                                            </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-3">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coverage Status</Label>
                                                                                    <div className="mt-1 flex items-center gap-2">
                                                                                        {getCoverageStatusIcon(benefit.coverage.coverageStatus)}
                                                                                        <span className="font-medium">{formatCoverageStatus(benefit.coverage.coverageStatus)}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Waiting Period</Label>
                                                                                    <div className="mt-1 font-medium">
                                                                                        {formatWaitingPeriod(benefit.coverage.waitingPeriodDays)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pre-existing Conditions</Label>
                                                                                    <div className="mt-1">
                                                                                        {benefit.coverage.coverPreExisting ? (
                                                                                            <div className="flex items-center gap-1 text-green-600">
                                                                                                <CheckCircle className="h-4 w-4" />
                                                                                                <span className="font-medium">Covered</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="flex items-center gap-1 text-red-600">
                                                                                                <AlertCircle className="h-4 w-4" />
                                                                                                <span className="font-medium">Not Covered</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {benefit.coverage.coverPreExisting && (
                                                                                    <div>
                                                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pre-existing Basis</Label>
                                                                                        <div className="mt-1 font-medium">
                                                                                            {formatPreExistingBasis(benefit.coverage.preExistingBasis)}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>

                                                                    {/* Financial Limits */}
                                                                    <Card>
                                                                        <CardHeader className="pb-3">
                                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                                <Target className="h-4 w-4 text-purple-600" />
                                                                                Financial Limits & Scope
                                                                            </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-3">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Annual Limit</Label>
                                                                                    <div className="mt-1 font-medium">
                                                                                        {benefit.limits.limitAmount ? formatCurrency(benefit.limits.limitAmount) : 'Unlimited'}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Limit Period</Label>
                                                                                    <div className="mt-1 font-medium capitalize">
                                                                                        {benefit.limits.limitPeriod.replace('_', ' ').toLowerCase()}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount Limit Scope</Label>
                                                                                    <div className="mt-1 font-medium capitalize">
                                                                                        {benefit.limits.amountLimitScope.replace('_', ' ').toLowerCase()}
                                                                                    </div>
                                                                                </div>
                                                                                {benefit.limits.sessionLimit && (
                                                                                    <div>
                                                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Session Limit</Label>
                                                                                        <div className="mt-1 font-medium">
                                                                                            {benefit.limits.sessionLimit} sessions
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Network Limits */}
                                                                            {(benefit.limits.limitInNetwork || benefit.limits.limitOutNetwork) && (
                                                                                <div className="pt-2 border-t">
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Network-Specific Limits</Label>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        {benefit.limits.limitInNetwork && (
                                                                                            <div className="flex items-center gap-2 text-green-600">
                                                                                                <span className="text-sm font-medium">In-Network:</span>
                                                                                                <span className="font-semibold">{formatCurrency(benefit.limits.limitInNetwork)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {benefit.limits.limitOutNetwork && (
                                                                                            <div className="flex items-center gap-2 text-orange-600">
                                                                                                <span className="text-sm font-medium">Out-of-Network:</span>
                                                                                                <span className="font-semibold">{formatCurrency(benefit.limits.limitOutNetwork)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>

                                                                {/* Right Column */}
                                                                <div className="space-y-6">
                                                                    {/* Member Responsibility */}
                                                                    <Card>
                                                                        <CardHeader className="pb-3">
                                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                                                Member Responsibility (Copay)
                                                                            </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-3">
                                                                            {benefit.copay.copayType && benefit.copay.copayType !== 'NONE' ? (
                                                                                <>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Copay Amount</Label>
                                                                                            <div className="mt-1 font-semibold text-lg">
                                                                                                {benefit.copay.copayType === 'FIXED' 
                                                                                                    ? formatCurrency(benefit.copay.copayValue)
                                                                                                    : `${benefit.copay.copayValue}%`
                                                                                                }
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Copay Type</Label>
                                                                                            <div className="mt-1 font-medium capitalize">
                                                                                                {benefit.copay.copayType === 'FIXED' ? 'Fixed Amount' : 'Percentage'}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    {(benefit.copay.minCopayAmount || benefit.copay.maxCopayAmount) && (
                                                                                        <div className="grid grid-cols-2 gap-4">
                                                                                            {benefit.copay.minCopayAmount && (
                                                                                                <div>
                                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Minimum Copay</Label>
                                                                                                    <div className="mt-1 font-medium">{formatCurrency(benefit.copay.minCopayAmount)}</div>
                                                                                                </div>
                                                                                            )}
                                                                                            {benefit.copay.maxCopayAmount && (
                                                                                                <div>
                                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Maximum Copay</Label>
                                                                                                    <div className="mt-1 font-medium">{formatCurrency(benefit.copay.maxCopayAmount)}</div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Network Copays */}
                                                                                    {(benefit.copay.copayInNetwork || benefit.copay.copayOutNetwork) && (
                                                                                        <div className="pt-2 border-t">
                                                                                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Network-Specific Copays</Label>
                                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                                {benefit.copay.copayInNetwork && (
                                                                                                    <div className="flex items-center gap-2 text-green-600">
                                                                                                        <span className="text-sm font-medium">In-Network:</span>
                                                                                                        <span className="font-semibold">{formatCurrency(benefit.copay.copayInNetwork)}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {benefit.copay.copayOutNetwork && (
                                                                                                    <div className="flex items-center gap-2 text-orange-600">
                                                                                                        <span className="text-sm font-medium">Out-of-Network:</span>
                                                                                                        <span className="font-semibold">{formatCurrency(benefit.copay.copayOutNetwork)}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                <div className="flex items-center justify-center py-8 text-green-600">
                                                                                    <div className="text-center">
                                                                                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                                                                                        <div className="font-semibold">No Copay Required</div>
                                                                                        <div className="text-sm text-gray-500">Members pay nothing out of pocket</div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>

                                                                    {/* Eligibility & Rules */}
                                                                    <Card>
                                                                        <CardHeader className="pb-3">
                                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                                <Users className="h-4 w-4 text-indigo-600" />
                                                                                Eligibility & Special Rules
                                                                            </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-3">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender Eligibility</Label>
                                                                                    <div className="mt-1 font-medium">{formatGenderScope(benefit.coverage.genderScope)}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Type</Label>
                                                                                    <div className="mt-1 font-medium">{formatSubscriberType(benefit.rules.subscriberEligibilityType)}</div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div>
                                                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age Eligibility</Label>
                                                                                <div className="mt-1 font-medium">
                                                                                    {formatAgeRange(benefit.coverage.minAgeMonths, benefit.coverage.maxAgeMonths, benefit.coverage.maxAgeYears)}
                                                                                </div>
                                                                            </div>

                                                                            {/* Pre-authorization */}
                                                                            <div className="pt-2 border-t">
                                                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Pre-authorization</Label>
                                                                                <div className="flex items-center gap-2">
                                                                                    {benefit.rules.requiresPreauth ? (
                                                                                        <>
                                                                                            <Settings className="h-4 w-4 text-amber-600" />
                                                                                            <span className="font-medium text-amber-600">Required</span>
                                                                                            {benefit.rules.preauthThresholdAmount && (
                                                                                                <span className="text-sm text-gray-500">
                                                                                                    (above {formatCurrency(benefit.rules.preauthThresholdAmount)})
                                                                                                </span>
                                                                                            )}
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                                                            <span className="font-medium text-green-600">Not Required</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Frequency Rules */}
                                                                            {(benefit.rules.frequencyValue && benefit.rules.frequencyUnit) && (
                                                                                <div className="pt-2 border-t">
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Usage Frequency</Label>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Timer className="h-4 w-4 text-blue-600" />
                                                                                        <span className="font-medium">
                                                                                            {formatFrequency(benefit.rules.frequencyValue, benefit.rules.frequencyUnit, benefit.rules.frequencyDuration)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Additional Rules */}
                                                                            {(benefit.rules.basketId || benefit.rules.requiredDoctorSpecialtyId || benefit.rules.linkToCaseType) && (
                                                                                <div className="pt-2 border-t">
                                                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Additional Requirements</Label>
                                                                                    <div className="space-y-1 text-sm">
                                                                                        {benefit.rules.basketId && (
                                                                                            <div>Medical Basket ID: <span className="font-medium">{benefit.rules.basketId}</span></div>
                                                                                        )}
                                                                                        {benefit.rules.requiredDoctorSpecialtyId && (
                                                                                            <div>Required Specialty ID: <span className="font-medium">{benefit.rules.requiredDoctorSpecialtyId}</span></div>
                                                                                        )}
                                                                                        {benefit.rules.linkToCaseType && (
                                                                                            <div>Case Type: <span className="font-medium">{benefit.rules.linkToCaseType}</span></div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>
                                                            </div>

                                                            {/* System Flags & Drivers */}
                                                            <Card>
                                                                <CardHeader className="pb-3">
                                                                    <CardTitle className="text-base flex items-center gap-2">
                                                                        <Zap className="h-4 w-4 text-yellow-600" />
                                                                        System Configuration & Usage Flags
                                                                    </CardTitle>
                                                                    <CardDescription>
                                                                        These flags control how the system processes this benefit
                                                                    </CardDescription>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        {/* Usage Flags */}
                                                                        <div>
                                                                            <Label className="text-sm font-medium text-gray-700 mb-3 block">Usage Flags</Label>
                                                                            <div className="space-y-2">
                                                                                <div className={cn(
                                                                                    'flex items-center justify-between p-3 rounded-lg border',
                                                                                    benefit.rules.usageFlags.copay 
                                                                                        ? 'bg-green-50 border-green-200'
                                                                                        : 'bg-gray-50 border-gray-200'
                                                                                )}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <DollarSign className="h-4 w-4" />
                                                                                        <span className="font-medium">Copay Usage</span>
                                                                                    </div>
                                                                                    {benefit.rules.usageFlags.copay ? (
                                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                                    ) : (
                                                                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                                                                    )}
                                                                                </div>
                                                                                <div className={cn(
                                                                                    'flex items-center justify-between p-3 rounded-lg border',
                                                                                    benefit.rules.usageFlags.limit 
                                                                                        ? 'bg-green-50 border-green-200'
                                                                                        : 'bg-gray-50 border-gray-200'
                                                                                )}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Target className="h-4 w-4" />
                                                                                        <span className="font-medium">Limit Usage</span>
                                                                                    </div>
                                                                                    {benefit.rules.usageFlags.limit ? (
                                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                                    ) : (
                                                                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                                                                    )}
                                                                                </div>
                                                                                <div className={cn(
                                                                                    'flex items-center justify-between p-3 rounded-lg border',
                                                                                    benefit.rules.usageFlags.coverage 
                                                                                        ? 'bg-green-50 border-green-200'
                                                                                        : 'bg-gray-50 border-gray-200'
                                                                                )}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Shield className="h-4 w-4" />
                                                                                        <span className="font-medium">Coverage Usage</span>
                                                                                    </div>
                                                                                    {benefit.rules.usageFlags.coverage ? (
                                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                                    ) : (
                                                                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Driver Flags */}
                                                                        <div>
                                                                            <Label className="text-sm font-medium text-gray-700 mb-3 block">System Drivers</Label>
                                                                            <div className="space-y-2">
                                                                                <div className={cn(
                                                                                    'flex items-center justify-between p-3 rounded-lg border',
                                                                                    benefit.rules.isCoverageDriver 
                                                                                        ? 'bg-blue-50 border-blue-200'
                                                                                        : 'bg-gray-50 border-gray-200'
                                                                                )}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Shield className="h-4 w-4" />
                                                                                        <span className="font-medium">Coverage Driver</span>
                                                                                    </div>
                                                                                    {getBooleanBadge(benefit.rules.isCoverageDriver, 'Active', 'Inactive')}
                                                                                </div>
                                                                                <div className={cn(
                                                                                    'flex items-center justify-between p-3 rounded-lg border',
                                                                                    benefit.rules.isLimitDriver 
                                                                                        ? 'bg-purple-50 border-purple-200'
                                                                                        : 'bg-gray-50 border-gray-200'
                                                                                )}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Target className="h-4 w-4" />
                                                                                        <span className="font-medium">Limit Driver</span>
                                                                                    </div>
                                                                                    {getBooleanBadge(benefit.rules.isLimitDriver, 'Active', 'Inactive')}
                                                                                </div>
                                                                                <div className={cn(
                                                                                    'flex items-center justify-between p-3 rounded-lg border',
                                                                                    benefit.rules.isExclusionDriver 
                                                                                        ? 'bg-red-50 border-red-200'
                                                                                        : 'bg-gray-50 border-gray-200'
                                                                                )}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Ban className="h-4 w-4" />
                                                                                        <span className="font-medium">Exclusion Driver</span>
                                                                                    </div>
                                                                                    {getBooleanBadge(benefit.rules.isExclusionDriver, 'Active', 'Inactive')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Benefit</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove benefit <strong>{selectedBenefit?.benefitCode}</strong> from this plan? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteBenefit} disabled={deleting} variant="destructive">
                            {deleting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Benefit Form Drawer */}
            <BenefitFormDrawer
                open={showBenefitDrawer}
                onOpenChange={setShowBenefitDrawer}
                planId={planId}
                benefit={selectedBenefit}
                masterBenefits={masterBenefits}
                mode={drawerMode}
                onSaved={handleBenefitSaved}
            />
        </div>
    )
}
