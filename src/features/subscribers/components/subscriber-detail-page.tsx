'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, User, UserCircle, CreditCard, FileText, History, Users, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { fetchSubscriber, updateSubscriber, fetchSubscribers } from '@/lib/api/subscribers'
import { Subscriber, SubscriberPayload } from '@/types/subscriber'
import { PersonalDetailsTab } from './subscriber-detail-tabs/personal-details-tab'
import { InsuranceCardsTab } from './subscriber-detail-tabs/insurance-cards-tab'
import { FamilyTreeTab } from './subscriber-detail-tabs/family-tree-tab'
import { SubscriberPoliciesTab } from './subscriber-detail-tabs/subscriber-policies-tab'
import { useAppStore } from '@/store/app-store'

export function SubscriberDetailPage() {
    const router = useRouter()
    const params = useParams()
    const subscriberId = params?.id ? Number(params.id) : null
    const updateTab = useAppStore((state) => state.updateTab)
    const activeTabId = useAppStore((state) => state.activeTabId)

    const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
    const [hofSubscriber, setHofSubscriber] = useState<Subscriber | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingHof, setLoadingHof] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showChangeHofDialog, setShowChangeHofDialog] = useState(false)
    const [hofSubscribers, setHofSubscribers] = useState<Subscriber[]>([])
    const [loadingHofList, setLoadingHofList] = useState(false)
    const [selectedNewHofId, setSelectedNewHofId] = useState<number | null>(null)
    const [savingHof, setSavingHof] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    useEffect(() => {
        if (!subscriberId) {
            setError('Subscriber ID is required')
            return
        }

        const loadSubscriber = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchSubscriber(subscriberId)
                setSubscriber(data)
                
                // Fetch HOF subscriber if hofId exists
                if (data.hofId !== null && data.hofId !== undefined && data.hofId > 0) {
                    console.log('Fetching HOF for subscriber:', data.hofId)
                    setLoadingHof(true)
                    try {
                        const hof = await fetchSubscriber(data.hofId)
                        console.log('HOF fetched:', hof)
                        setHofSubscriber(hof)
                    } catch (hofErr) {
                        console.error('Failed to load HOF subscriber', hofErr)
                        setHofSubscriber(null)
                    } finally {
                        setLoadingHof(false)
                    }
                } else {
                    console.log('No HOF ID for this subscriber')
                    setHofSubscriber(null)
                }
                
                // Update tab title with subscriber name if we're in subscribers tab
                const tabs = useAppStore.getState().tabs
                const currentTab = tabs.find(tab => tab.id === activeTabId)
                if (currentTab && (currentTab.component === '/subscribers' || currentTab.component?.startsWith('/subscribers/'))) {
                    updateTab(activeTabId, {
                        title: `${data.fullNameEn}`,
                        component: `/subscribers/${subscriberId}`,
                    })
                } else if (activeTabId === 'subscribers') {
                    // Fallback: if tab ID is subscribers, update it
                    updateTab(activeTabId, {
                        title: `${data.fullNameEn}`,
                        component: `/subscribers/${subscriberId}`,
                    })
                }
            } catch (err) {
                console.error('Failed to load subscriber', err)
                setError(err instanceof Error ? err.message : 'Unable to load subscriber details')
            } finally {
                setLoading(false)
            }
        }

        void loadSubscriber()
    }, [subscriberId, activeTabId, updateTab])

    const handleSubscriberUpdate = async () => {
        if (!subscriberId) return
        try {
            const data = await fetchSubscriber(subscriberId)
            setSubscriber(data)
            // Refresh HOF if hofId exists
            if (data.hofId !== null && data.hofId !== undefined && data.hofId > 0) {
                try {
                    const hof = await fetchSubscriber(data.hofId)
                    setHofSubscriber(hof)
                } catch (hofErr) {
                    console.error('Failed to load HOF subscriber', hofErr)
                }
            } else {
                setHofSubscriber(null)
            }
        } catch (err) {
            console.error('Failed to refresh subscriber', err)
        }
    }

    const loadHofSubscribers = async () => {
        setLoadingHofList(true)
        try {
            const response = await fetchSubscribers({ page: 0, size: 1000 })
            // Filter for HOF subscribers, excluding current subscriber
            const hofList = response.content.filter(
                s => s.isHeadOfFamily && s.id !== subscriberId && s.id !== subscriber?.hofId
            )
            setHofSubscribers(hofList)
        } catch (err) {
            console.error('Failed to load HOF subscribers', err)
            setError('Failed to load HOF subscribers list')
        } finally {
            setLoadingHofList(false)
        }
    }

    const handleOpenChangeHofDialog = () => {
        setSelectedNewHofId(null)
        setShowChangeHofDialog(true)
        void loadHofSubscribers()
    }

    const handleConfirmChangeHof = async () => {
        if (!subscriber || !selectedNewHofId || !subscriberId) {
            setShowConfirmDialog(false)
            setShowChangeHofDialog(false)
            return
        }

        setSavingHof(true)
        try {
            // Prepare update payload with all subscriber fields
            const payload: SubscriberPayload = {
                nationalId: subscriber.nationalId,
                fullNameEn: subscriber.fullNameEn,
                fullNameAr: subscriber.fullNameAr,
                gender: subscriber.gender,
                dateOfBirth: Array.isArray(subscriber.dateOfBirth)
                    ? `${subscriber.dateOfBirth[0]}-${String(subscriber.dateOfBirth[1]).padStart(2, '0')}-${String(subscriber.dateOfBirth[2]).padStart(2, '0')}`
                    : subscriber.dateOfBirth || '',
                maritalStatus: subscriber.maritalStatus,
                isAlive: subscriber.isAlive,
                deathDate: subscriber.deathDate,
                passportNo: subscriber.passportNo,
                insuranceId: subscriber.insuranceId,
                firstNameEn: subscriber.firstNameEn,
                middleNameEn: subscriber.middleNameEn,
                lastNameEn: subscriber.lastNameEn,
                firstNameAr: subscriber.firstNameAr,
                middleNameAr: subscriber.middleNameAr,
                lastNameAr: subscriber.lastNameAr,
                phoneNumber: subscriber.phoneNumber,
                mobileNumber: subscriber.mobileNumber,
                email: subscriber.email,
                country: subscriber.country,
                city: subscriber.city,
                addressLine: subscriber.addressLine,
                employerName: subscriber.employerName,
                employeeNumber: subscriber.employeeNumber,
                nationality: subscriber.nationality,
                employerId: subscriber.employerId,
                relationType: subscriber.relationType,
                isHeadOfFamily: subscriber.isHeadOfFamily,
                hofId: selectedNewHofId, // Update hofId
                hasChronicConditions: subscriber.hasChronicConditions,
                hasPreexisting: subscriber.hasPreexisting,
                preexistingNotes: subscriber.preexistingNotes,
                eligibilityStatus: subscriber.eligibilityStatus,
                eligibilityStart: subscriber.eligibilityStart,
                eligibilityEnd: subscriber.eligibilityEnd,
                currentPolicyId: subscriber.currentPolicyId,
                currentEnrollmentId: subscriber.currentEnrollmentId,
                currentCardStatus: subscriber.currentCardStatus,
                currentCardVersion: subscriber.currentCardVersion,
            }

            await updateSubscriber(subscriberId, payload)
            setShowConfirmDialog(false)
            setShowChangeHofDialog(false)
            setSelectedNewHofId(null)
            // Refresh subscriber data
            await handleSubscriberUpdate()
        } catch (err) {
            console.error('Failed to change HOF', err)
            setError(err instanceof Error ? err.message : 'Failed to change Head of Family')
        } finally {
            setSavingHof(false)
        }
    }

    if (!subscriberId) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    Invalid subscriber ID
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Loading subscriber details...</p>
                </div>
            </div>
        )
    }

    if (error || !subscriber) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error || 'Subscriber not found'}
                </div>
                <Button variant="outline" onClick={() => router.push('/subscribers')} className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Subscribers
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Update the subscribers tab to point back to list
                            const tabs = useAppStore.getState().tabs
                            const subscribersTab = tabs.find(tab => tab.id === 'subscribers' || tab.component?.startsWith('/subscribers'))
                            if (subscribersTab) {
                                const updateTab = useAppStore.getState().updateTab
                                const setActiveTab = useAppStore.getState().setActiveTab
                                updateTab(subscribersTab.id, {
                                    title: 'Subscribers Info.',
                                    component: '/subscribers',
                                })
                                setActiveTab(subscribersTab.id)
                            }
                            router.push('/subscribers')
                        }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{subscriber.fullNameEn}</h1>
                        <p className="text-sm text-gray-600">
                            National ID: <span className="font-mono">{subscriber.nationalId}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* HOF Information Banner */}
            {(() => {
                const hasHofId = subscriber.hofId !== null && subscriber.hofId !== undefined && Number(subscriber.hofId) > 0
                if (!hasHofId) return null
                
                return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-blue-900">Head of Family (HOF)</div>
                                {loadingHof ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        <span className="text-sm text-blue-700">Loading HOF information...</span>
                                    </div>
                                ) : hofSubscriber ? (
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    router.push(`/subscribers/${hofSubscriber.id}`)
                                                }}
                                                className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                                            >
                                                {hofSubscriber.fullNameEn}
                                            </button>
                                            <span className="text-sm text-blue-600">•</span>
                                            <span className="text-sm text-blue-700 font-mono">ID: {hofSubscriber.nationalId}</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleOpenChangeHofDialog}
                                            className="ml-2"
                                        >
                                            <Edit2 className="h-3 w-3 mr-1" />
                                            Change HOF
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-blue-700 mt-1">
                                        HOF ID: {subscriber.hofId} (Not found or loading failed)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })()}

            <Tabs defaultValue="personal" className="bg-white rounded-lg shadow border border-gray-100">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Personal Details
                    </TabsTrigger>
                    <TabsTrigger value="policies" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Contracts & Policies
                    </TabsTrigger>
                    <TabsTrigger value="dependents" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dependents & Family Tree
                    </TabsTrigger>
                    <TabsTrigger value="cards" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Insurance Cards
                    </TabsTrigger>
                    <TabsTrigger value="events" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Events & Logs
                    </TabsTrigger>
                </TabsList>
                <div className="p-6">
                    <TabsContent value="personal" className="mt-0">
                        <PersonalDetailsTab subscriber={subscriber} onUpdate={handleSubscriberUpdate} />
                    </TabsContent>
                    <TabsContent value="policies" className="mt-0">
                        <SubscriberPoliciesTab subscriber={subscriber} onUpdate={handleSubscriberUpdate} />
                    </TabsContent>
                    <TabsContent value="dependents" className="mt-0">
                        <FamilyTreeTab subscriber={subscriber} onUpdate={handleSubscriberUpdate} />
                    </TabsContent>
                    <TabsContent value="cards" className="mt-0">
                        <InsuranceCardsTab subscriber={subscriber} onUpdate={handleSubscriberUpdate} />
                    </TabsContent>
                    <TabsContent value="events" className="mt-0">
                        <div className="text-center py-12 text-gray-500">
                            Events & Logs tab - Coming soon
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Change HOF Dialog */}
            <Dialog open={showChangeHofDialog} onOpenChange={setShowChangeHofDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Head of Family</DialogTitle>
                        <DialogDescription>
                            Select a new Head of Family (HOF) for this dependent subscriber.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="newHof">Current HOF</Label>
                            {hofSubscriber && (
                                <div className="p-2 bg-gray-50 rounded border">
                                    <div className="font-medium">{hofSubscriber.fullNameEn}</div>
                                    <div className="text-sm text-gray-600 font-mono">ID: {hofSubscriber.nationalId}</div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newHof">New Head of Family *</Label>
                            <SearchableSelect
                                options={hofSubscribers.map((hof) => ({
                                    id: hof.id,
                                    label: hof.fullNameEn,
                                    subLabel: `National ID: ${hof.nationalId}`,
                                }))}
                                value={selectedNewHofId || undefined}
                                onValueChange={(value) => setSelectedNewHofId(value ? Number(value) : null)}
                                placeholder="Select a new Head of Family..."
                                searchPlaceholder="Search by name or national ID..."
                                emptyMessage="No HOF subscribers found"
                                loading={loadingHofList}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowChangeHofDialog(false)} disabled={savingHof}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedNewHofId) {
                                    setShowConfirmDialog(true)
                                }
                            }}
                            disabled={!selectedNewHofId || savingHof}
                        >
                            Next
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm HOF Change</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to change the Head of Family for this subscriber?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Current HOF:</div>
                            {hofSubscriber && (
                                <div className="p-2 bg-gray-50 rounded border text-sm">
                                    {hofSubscriber.fullNameEn} ({hofSubscriber.nationalId})
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">New HOF:</div>
                            {selectedNewHofId && (() => {
                                const newHof = hofSubscribers.find(h => h.id === selectedNewHofId)
                                return newHof ? (
                                    <div className="p-2 bg-blue-50 rounded border text-sm">
                                        {newHof.fullNameEn} ({newHof.nationalId})
                                    </div>
                                ) : (
                                    <div className="p-2 bg-blue-50 rounded border text-sm text-gray-500">
                                        Loading...
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={savingHof}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmChangeHof} disabled={savingHof}>
                            {savingHof ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Confirm Change'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

