'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Download, Edit2, Eye, AlertCircle, CheckCircle, XCircle, Ban, CreditCard, Info, FileText, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Subscriber } from '@/types/subscriber'
import { InsuranceCard, IssueCardPayload, UpdateCardStatusPayload, CardStatus, Enrollment, CardInstruction } from '@/types/card'
import { fetchCardsByEnrollment, issueCard, updateCardStatus, fetchCardInstructions } from '@/lib/api/cards'
import { fetchEnrollments } from '@/lib/api/enrollments'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'

const CARD_STATUS_OPTIONS: { value: CardStatus; label: string; icon: typeof AlertCircle }[] = [
    { value: 'ACTIVE', label: 'Active', icon: CheckCircle },
    { value: 'INACTIVE', label: 'Inactive', icon: XCircle },
    { value: 'EXPIRED', label: 'Expired', icon: AlertCircle },
    { value: 'BLOCKED', label: 'Blocked', icon: Ban },
    { value: 'LOST', label: 'Lost', icon: AlertCircle },
    { value: 'REPLACED', label: 'Replaced', icon: CheckCircle },
    { value: 'CANCELLED', label: 'Cancelled', icon: XCircle },
]

interface InsuranceCardsTabProps {
    subscriber: Subscriber
    onUpdate?: () => void
}

function formatDate(date: InsuranceCard['issueDate'] | InsuranceCard['expiryDate']): string {
    if (!date) return '-'
    if (Array.isArray(date)) {
        return `${date[2]}/${date[1]}/${date[0]}`
    }
    if (typeof date === 'string') {
        return new Date(date).toLocaleDateString()
    }
    return '-'
}

function getStatusColor(status: CardStatus): string {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-100 text-green-700'
        case 'INACTIVE':
            return 'bg-gray-100 text-gray-700'
        case 'EXPIRED':
            return 'bg-yellow-100 text-yellow-700'
        case 'BLOCKED':
        case 'LOST':
        case 'CANCELLED':
            return 'bg-red-100 text-red-700'
        case 'REPLACED':
            return 'bg-blue-100 text-blue-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

export function InsuranceCardsTab({ subscriber, onUpdate }: InsuranceCardsTabProps) {
    const [cards, setCards] = useState<InsuranceCard[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showIssueDialog, setShowIssueDialog] = useState(false)
    const [showStatusDialog, setShowStatusDialog] = useState(false)
    const [selectedCard, setSelectedCard] = useState<InsuranceCard | null>(null)
    const [issuing, setIssuing] = useState(false)
    const [updating, setUpdating] = useState(false)

    const [enrollmentId, setEnrollmentId] = useState<number | null>(subscriber.currentEnrollmentId)
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [loadingEnrollments, setLoadingEnrollments] = useState(false)
    const [frontTemplateCode, setFrontTemplateCode] = useState<string>('')
    const [backTemplateCode, setBackTemplateCode] = useState<string>('')
    const [statusChange, setStatusChange] = useState<CardStatus>('INACTIVE')
    const [statusNotes, setStatusNotes] = useState<string>('')
    
    // Card Instructions state
    const [instructions, setInstructions] = useState<CardInstruction[]>([])
    const [loadingInstructions, setLoadingInstructions] = useState(false)

    const loadEnrollments = useCallback(async () => {
        // Both subscriberId and policyId are required
        if (!subscriber.currentPolicyId) {
            setError('No policy ID found for this subscriber')
            setLoadingEnrollments(false)
            return
        }

        setLoadingEnrollments(true)
        try {
            const response = await fetchEnrollments({
                subscriberId: subscriber.id,
                policyId: subscriber.currentPolicyId,
                page: 0,
                size: 1000,
            })
            setEnrollments(response.content)
            // Set default enrollment if currentEnrollmentId exists and is in the list
            if (subscriber.currentEnrollmentId) {
                const currentEnrollment = response.content.find(e => e.id === subscriber.currentEnrollmentId)
                if (currentEnrollment) {
                    setEnrollmentId(subscriber.currentEnrollmentId)
                } else if (response.content.length > 0) {
                    // If current enrollment not found, use first available
                    setEnrollmentId(response.content[0].id)
                }
            } else if (response.content.length > 0) {
                // No current enrollment, use first available
                setEnrollmentId(response.content[0].id)
            }
        } catch (err) {
            console.error('Failed to load enrollments', err)
            setError(err instanceof Error ? err.message : 'Unable to load enrollments')
        } finally {
            setLoadingEnrollments(false)
        }
    }, [subscriber.id, subscriber.currentPolicyId, subscriber.currentEnrollmentId])

    const loadCards = useCallback(async () => {
        if (!enrollmentId) return

        setLoading(true)
        setError(null)
        try {
            const data = await fetchCardsByEnrollment(enrollmentId)
            setCards(data)
        } catch (err) {
            console.error('Failed to load cards', err)
            setError(err instanceof Error ? err.message : 'Unable to load insurance cards')
        } finally {
            setLoading(false)
        }
    }, [enrollmentId])

    useEffect(() => {
        void loadEnrollments()
    }, [loadEnrollments])

    const loadInstructions = useCallback(async () => {
        if (!enrollmentId) return

        setLoadingInstructions(true)
        try {
            // Fetch instructions from all scopes: GLOBAL, POLICY, and ENROLLMENT
            const [globalInstructions, policyInstructions, enrollmentInstructions] = await Promise.all([
                // GLOBAL scope - no scopeId needed
                fetchCardInstructions({
                    scopeType: 'GLOBAL',
                }).catch(() => []),
                // POLICY scope - use policyId from enrollment
                (() => {
                    const enrollment = enrollments.find((e) => e.id === enrollmentId)
                    if (!enrollment?.policyId) return Promise.resolve([])
                    return fetchCardInstructions({
                        scopeType: 'POLICY',
                        scopeId: enrollment.policyId,
                    }).catch(() => [])
                })(),
                // ENROLLMENT scope
                fetchCardInstructions({
                    scopeType: 'ENROLLMENT',
                    scopeId: enrollmentId,
                }).catch(() => []),
            ])

            // Combine all instructions and remove duplicates by ID
            const allInstructions = [...globalInstructions, ...policyInstructions, ...enrollmentInstructions]
            const uniqueInstructions = Array.from(
                new Map(allInstructions.map((inst) => [inst.id, inst])).values()
            )
            setInstructions(uniqueInstructions)
        } catch (err) {
            console.error('Failed to load card instructions', err)
        } finally {
            setLoadingInstructions(false)
        }
    }, [enrollmentId, enrollments])

    useEffect(() => {
        if (enrollmentId) {
            void loadCards()
            void loadInstructions()
        }
    }, [loadCards, loadInstructions, enrollmentId])

    const formatEnrollmentLabel = (enrollment: Enrollment): string => {
        const policyNumber = enrollment.policy?.policyNumber || `Policy #${enrollment.policyId}`
        const relationType = enrollment.relationType || 'N/A'
        return `Enrollment #${enrollment.id} - ${policyNumber} (${relationType})`
    }

    const handleIssueCard = async () => {
        if (!enrollmentId) {
            setError('Enrollment ID is required')
            return
        }

        setIssuing(true)
        setError(null)
        try {
            const payload: IssueCardPayload = {
                enrollmentId,
                frontTemplateCode: frontTemplateCode.trim() || null,
                backTemplateCode: backTemplateCode.trim() || null,
            }
            await issueCard(payload)
            setShowIssueDialog(false)
            setFrontTemplateCode('')
            setBackTemplateCode('')
            setError(null)
            await loadCards()
            await loadInstructions()
            onUpdate?.()
        } catch (err) {
            console.error('Failed to issue card', err)
            setError(err instanceof Error ? err.message : 'Unable to issue card')
        } finally {
            setIssuing(false)
        }
    }

    const handleUpdateStatus = async () => {
        if (!selectedCard) return

        setUpdating(true)
        setError(null)
        try {
            const payload: UpdateCardStatusPayload = {
                status: statusChange,
                notes: statusNotes || null,
            }
            await updateCardStatus(selectedCard.id, payload)
            setShowStatusDialog(false)
            setSelectedCard(null)
            setStatusChange('INACTIVE')
            setStatusNotes('')
            setError(null)
            await loadCards()
            onUpdate?.()
        } catch (err) {
            console.error('Failed to update card status', err)
            setError(err instanceof Error ? err.message : 'Unable to update card status')
        } finally {
            setUpdating(false)
        }
    }

    const handleOpenStatusDialog = (card: InsuranceCard) => {
        setSelectedCard(card)
        setStatusChange(card.status)
        setStatusNotes('')
        setShowStatusDialog(true)
    }

    const handleDownloadPdf = (card: InsuranceCard) => {
        if (card.pdfUrl) {
            window.open(card.pdfUrl, '_blank')
        } else {
            setError('PDF URL not available for this card')
        }
    }

    const handleViewImage = (card: InsuranceCard) => {
        if (card.imageUrl) {
            window.open(card.imageUrl, '_blank')
        } else {
            setError('Image URL not available for this card')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        Insurance Cards
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage insurance cards and instructions for {subscriber.fullNameEn}
                    </p>
                </div>
            </div>

            {/* Enrollment Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Select Enrollment</CardTitle>
                    <CardDescription>Choose an enrollment to view and manage insurance cards</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                            <Label htmlFor="enrollmentId" className="text-sm whitespace-nowrap font-medium">Enrollment:</Label>
                            <div className="flex-1">
                                <SearchableSelect
                                    options={enrollments.map((enrollment) => ({
                                        id: enrollment.id,
                                        label: formatEnrollmentLabel(enrollment),
                                        subLabel: enrollment.policy?.policyNumber
                                            ? `Policy: ${enrollment.policy.policyNumber} | Status: ${enrollment.status || 'N/A'}`
                                            : `Enrollment ID: ${enrollment.id}`,
                                    }))}
                                    value={enrollmentId || undefined}
                                    onValueChange={(value) => setEnrollmentId(value ? Number(value) : null)}
                                    placeholder="Select enrollment..."
                                    searchPlaceholder="Search by enrollment ID, policy number..."
                                    emptyMessage="No enrollments found"
                                    loading={loadingEnrollments}
                                    disabled={!subscriber.currentPolicyId}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        {enrollmentId && (
                            <Button onClick={() => setShowIssueDialog(true)} disabled={issuing || loading} size="lg">
                                <Plus className="h-4 w-4 mr-2" />
                                Issue New Card
                            </Button>
                        )}
                        {enrollmentId && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    void loadCards()
                                    void loadInstructions()
                                }}
                                disabled={loading || loadingInstructions}
                                size="lg"
                            >
                                <RefreshCw className={cn('h-4 w-4 mr-2', (loading || loadingInstructions) && 'animate-spin')} />
                                Refresh
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </CardContent>
                </Card>
            ) : !subscriber.currentPolicyId ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium text-gray-900">No Policy ID Found</p>
                        <p className="text-sm mt-2 text-gray-500">This subscriber does not have an active policy. Please assign a policy first.</p>
                    </CardContent>
                </Card>
            ) : !enrollmentId ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium text-gray-900">Select an Enrollment</p>
                        <p className="text-sm mt-2 text-gray-500">Please select an enrollment from above to view and manage insurance cards</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Insurance Cards Section */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Insurance Cards</CardTitle>
                                    <CardDescription>
                                        {cards.length > 0 
                                            ? `${cards.length} card${cards.length === 1 ? '' : 's'} found for this enrollment`
                                            : 'No cards issued yet'}
                                    </CardDescription>
                                </div>
                                {cards.length === 0 && (
                                    <Button onClick={() => setShowIssueDialog(true)} disabled={issuing || loading}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Issue First Card
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {cards.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">No Insurance Cards</p>
                                    <p className="text-sm text-gray-500 mb-4">No insurance cards have been issued for this enrollment yet.</p>
                                    <Button onClick={() => setShowIssueDialog(true)} disabled={issuing || loading}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Issue New Card
                                    </Button>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Card Number</TableHead>
                                                <TableHead>Version</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Issue Date</TableHead>
                                                <TableHead>Expiry Date</TableHead>
                                                <TableHead>Policy</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cards.map((card) => (
                                                <TableRow key={card.id}>
                                                    <TableCell className="font-mono font-medium">{card.cardNumber}</TableCell>
                                                    <TableCell>v{card.versionNo}</TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                                                getStatusColor(card.status),
                                                            )}
                                                        >
                                                            {card.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{formatDate(card.issueDate)}</TableCell>
                                                    <TableCell className="text-sm">{formatDate(card.expiryDate)}</TableCell>
                                                    <TableCell className="text-sm">
                                                        {card.enrollment?.policy?.policyNumber || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {card.pdfUrl && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDownloadPdf(card)}
                                                                    title="Download PDF"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {card.imageUrl && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleViewImage(card)}
                                                                    title="View Image"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleOpenStatusDialog(card)}
                                                                title="Update Status"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card Instructions Section */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Card Instructions
                                    </CardTitle>
                                    <CardDescription>
                                        Important instructions and guidelines from GLOBAL, POLICY, and ENROLLMENT scopes
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingInstructions ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                </div>
                            ) : instructions.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <Info className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-900 mb-1">No Instructions Available</p>
                                    <p className="text-xs text-gray-500">There are no card instructions configured at GLOBAL, POLICY, or ENROLLMENT levels.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {instructions
                                        .filter((inst) => inst.isActive)
                                        .sort((a, b) => b.priority - a.priority)
                                        .map((instruction) => {
                                            const getScopeColor = (scopeType: string) => {
                                                switch (scopeType) {
                                                    case 'GLOBAL':
                                                        return 'bg-purple-100 text-purple-700 border-purple-200'
                                                    case 'POLICY':
                                                        return 'bg-green-100 text-green-700 border-green-200'
                                                    case 'ENROLLMENT':
                                                        return 'bg-blue-100 text-blue-700 border-blue-200'
                                                    default:
                                                        return 'bg-gray-100 text-gray-700 border-gray-200'
                                                }
                                            }
                                            return (
                                                <div
                                                    key={instruction.id}
                                                    className="border rounded-lg p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <h4 className="font-semibold text-gray-900">{instruction.title}</h4>
                                                                <span
                                                                    className={cn(
                                                                        'text-xs px-2 py-0.5 rounded border font-medium',
                                                                        getScopeColor(instruction.scopeType),
                                                                    )}
                                                                >
                                                                    {instruction.scopeType}
                                                                </span>
                                                                {instruction.language && (
                                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                                                        {instruction.language.toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{instruction.body}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Issue Card Dialog */}
            <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <CreditCard className="h-5 w-5" />
                            Issue New Insurance Card
                        </DialogTitle>
                        <DialogDescription>
                            Create a new insurance card for this enrollment. The card will be generated based on the selected enrollment details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Enrollment Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Enrollment Details</span>
                            </div>
                            <div className="text-sm text-blue-700 space-y-1">
                                {enrollmentId && enrollments.find((e) => e.id === enrollmentId) && (
                                    <>
                                        <p>
                                            <span className="font-medium">Enrollment ID:</span> {enrollmentId}
                                        </p>
                                        {enrollments.find((e) => e.id === enrollmentId)?.policy?.policyNumber && (
                                            <p>
                                                <span className="font-medium">Policy:</span>{' '}
                                                {enrollments.find((e) => e.id === enrollmentId)?.policy?.policyNumber}
                                            </p>
                                        )}
                                        {enrollments.find((e) => e.id === enrollmentId)?.relationType && (
                                            <p>
                                                <span className="font-medium">Relation:</span>{' '}
                                                {enrollments.find((e) => e.id === enrollmentId)?.relationType}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-4">Card Templates (Optional)</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Specify custom templates for the card front and back. Leave blank to use default templates.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="frontTemplateCode" className="text-sm font-medium">
                                        Front Template Code
                                    </Label>
                                    <Input
                                        id="frontTemplateCode"
                                        value={frontTemplateCode}
                                        onChange={(e) => setFrontTemplateCode(e.target.value)}
                                        placeholder="e.g., TEMPLATE_FRONT_01"
                                        className="font-mono"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Template code for the front side of the insurance card
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="backTemplateCode" className="text-sm font-medium">
                                        Back Template Code
                                    </Label>
                                    <Input
                                        id="backTemplateCode"
                                        value={backTemplateCode}
                                        onChange={(e) => setBackTemplateCode(e.target.value)}
                                        placeholder="e.g., TEMPLATE_BACK_01"
                                        className="font-mono"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Template code for the back side of the insurance card
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowIssueDialog(false)} disabled={issuing}>
                            Cancel
                        </Button>
                        <Button onClick={handleIssueCard} disabled={issuing || !enrollmentId} className="min-w-[120px]">
                            {issuing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Issuing...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Issue Card
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Card Status</DialogTitle>
                        <DialogDescription>
                            Update the status for card: {selectedCard?.cardNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select value={statusChange} onValueChange={(value) => setStatusChange(value as CardStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CARD_STATUS_OPTIONS.map((option) => {
                                        const Icon = option.icon
                                        return (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                placeholder="Add notes about the status change..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={updating}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={updating}>
                            {updating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

