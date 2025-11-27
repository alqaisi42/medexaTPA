'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Subscriber, SubscriberPayload } from '@/types/subscriber'
import { createSubscriber, updateSubscriber, fetchSubscribers } from '@/lib/api/subscribers'

const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
]

const MARITAL_STATUS_OPTIONS = [
    { value: 'SINGLE', label: 'Single' },
    { value: 'MARRIED', label: 'Married' },
    { value: 'DIVORCED', label: 'Divorced' },
    { value: 'WIDOWED', label: 'Widowed' },
]

const RELATION_TYPE_OPTIONS = [
    { value: 'SELF', label: 'Self' },
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'CHILD', label: 'Child' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'SIBLING', label: 'Sibling' },
]

const ELIGIBILITY_STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'TERMINATED', label: 'Terminated' },
]

const CARD_STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'BLOCKED', label: 'Blocked' },
]

interface SubscriberFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subscriber: Subscriber | null
    onSuccess: () => void
}

function mapSubscriberToPayload(subscriber: Subscriber | null): Partial<SubscriberPayload> {
    if (!subscriber) {
        return {
            nationalId: '',
            fullNameEn: '',
            gender: 'M',
            dateOfBirth: '',
            isAlive: true,
        }
    }

    let dateOfBirth = ''
    if (subscriber.dateOfBirth) {
        if (Array.isArray(subscriber.dateOfBirth)) {
            const [year, month, day] = subscriber.dateOfBirth
            dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        } else if (typeof subscriber.dateOfBirth === 'string') {
            dateOfBirth = subscriber.dateOfBirth.split('T')[0]
        }
    }

    return {
        nationalId: subscriber.nationalId || '',
        fullNameEn: subscriber.fullNameEn || '',
        fullNameAr: subscriber.fullNameAr || null,
        gender: subscriber.gender || 'M',
        dateOfBirth: dateOfBirth || '',
        maritalStatus: subscriber.maritalStatus || null,
        isAlive: subscriber.isAlive ?? true,
        deathDate: subscriber.deathDate || null,
        passportNo: subscriber.passportNo || null,
        insuranceId: subscriber.insuranceId || null,
        firstNameEn: subscriber.firstNameEn || null,
        middleNameEn: subscriber.middleNameEn || null,
        lastNameEn: subscriber.lastNameEn || null,
        firstNameAr: subscriber.firstNameAr || null,
        middleNameAr: subscriber.middleNameAr || null,
        lastNameAr: subscriber.lastNameAr || null,
        phoneNumber: subscriber.phoneNumber || null,
        mobileNumber: subscriber.mobileNumber || null,
        email: subscriber.email || null,
        country: subscriber.country || null,
        city: subscriber.city || null,
        addressLine: subscriber.addressLine || null,
        employerName: subscriber.employerName || null,
        employeeNumber: subscriber.employeeNumber || null,
        nationality: subscriber.nationality || null,
        employerId: subscriber.employerId || null,
        relationType: subscriber.relationType || null,
        isHeadOfFamily: subscriber.isHeadOfFamily || false,
        hofId: subscriber.hofId || null,
        hasChronicConditions: subscriber.hasChronicConditions || false,
        hasPreexisting: subscriber.hasPreexisting || false,
        preexistingNotes: subscriber.preexistingNotes || null,
        eligibilityStatus: subscriber.eligibilityStatus || null,
        eligibilityStart: subscriber.eligibilityStart || null,
        eligibilityEnd: subscriber.eligibilityEnd || null,
        currentPolicyId: subscriber.currentPolicyId || null,
        currentEnrollmentId: subscriber.currentEnrollmentId || null,
        currentCardStatus: subscriber.currentCardStatus || null,
        currentCardVersion: subscriber.currentCardVersion || null,
    }
}

export function SubscriberFormDialog({ open, onOpenChange, subscriber, onSuccess }: SubscriberFormDialogProps) {
    const [formData, setFormData] = useState<Partial<SubscriberPayload>>(() => mapSubscriberToPayload(subscriber))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hofSubscribers, setHofSubscribers] = useState<Subscriber[]>([])
    const [loadingHof, setLoadingHof] = useState(false)

    useEffect(() => {
        if (open) {
            setFormData(mapSubscriberToPayload(subscriber))
            setError(null)
            // Load HOF subscribers for dropdown
            loadHofSubscribers()
        }
    }, [open, subscriber])

    const loadHofSubscribers = async () => {
        setLoadingHof(true)
        try {
            // Fetch subscribers where isHeadOfFamily = true
            const response = await fetchSubscribers({ page: 0, size: 1000 })
            const hofList = response.content.filter(s => s.isHeadOfFamily && (!subscriber || s.id !== subscriber.id))
            setHofSubscribers(hofList)
        } catch (err) {
            console.error('Failed to load HOF subscribers', err)
        } finally {
            setLoadingHof(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.nationalId?.trim() || !formData.fullNameEn?.trim() || !formData.dateOfBirth) {
            setError('National ID, Full Name (EN), and Date of Birth are required')
            return
        }

        setSaving(true)
        setError(null)

        try {
            const payload: SubscriberPayload = {
                nationalId: formData.nationalId.trim(),
                fullNameEn: formData.fullNameEn.trim(),
                fullNameAr: formData.fullNameAr?.trim() || null,
                gender: formData.gender || 'M',
                dateOfBirth: formData.dateOfBirth,
                maritalStatus: formData.maritalStatus || null,
                isAlive: formData.isAlive ?? true,
                deathDate: formData.deathDate || null,
                passportNo: formData.passportNo?.trim() || null,
                insuranceId: formData.insuranceId?.trim() || null,
                firstNameEn: formData.firstNameEn?.trim() || null,
                middleNameEn: formData.middleNameEn?.trim() || null,
                lastNameEn: formData.lastNameEn?.trim() || null,
                firstNameAr: formData.firstNameAr?.trim() || null,
                middleNameAr: formData.middleNameAr?.trim() || null,
                lastNameAr: formData.lastNameAr?.trim() || null,
                phoneNumber: formData.phoneNumber?.trim() || null,
                mobileNumber: formData.mobileNumber?.trim() || null,
                email: formData.email?.trim() || null,
                country: formData.country?.trim() || null,
                city: formData.city?.trim() || null,
                addressLine: formData.addressLine?.trim() || null,
                employerName: formData.employerName?.trim() || null,
                employeeNumber: formData.employeeNumber?.trim() || null,
                nationality: formData.nationality?.trim() || null,
                employerId: formData.employerId || null,
                relationType: formData.relationType || null,
                isHeadOfFamily: formData.isHeadOfFamily || false,
                hofId: formData.hofId || null,
                hasChronicConditions: formData.hasChronicConditions || false,
                hasPreexisting: formData.hasPreexisting || false,
                preexistingNotes: formData.preexistingNotes?.trim() || null,
                eligibilityStatus: formData.eligibilityStatus || null,
                eligibilityStart: formData.eligibilityStart || null,
                eligibilityEnd: formData.eligibilityEnd || null,
                currentPolicyId: formData.currentPolicyId || null,
                currentEnrollmentId: formData.currentEnrollmentId || null,
                currentCardStatus: formData.currentCardStatus || null,
                currentCardVersion: formData.currentCardVersion || null,
            }

            if (subscriber) {
                await updateSubscriber(subscriber.id, payload)
            } else {
                await createSubscriber(payload)
            }
            onSuccess()
        } catch (submitError) {
            console.error(submitError)
            setError(submitError instanceof Error ? submitError.message : 'Unable to save subscriber')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{subscriber ? 'Edit Subscriber' : 'Create New Subscriber'}</DialogTitle>
                    <DialogDescription>
                        {subscriber
                            ? 'Update subscriber information below.'
                            : 'Fill in the subscriber details to create a new record.'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <Tabs defaultValue="basic" className="w-full">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <TabsList className="flex h-full w-full flex-col gap-2 rounded-lg bg-gray-50 p-2 md:w-56">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="personal">Personal Details</TabsTrigger>
                            <TabsTrigger value="employment">Employment & Relations</TabsTrigger>
                            <TabsTrigger value="medical">Medical & Eligibility</TabsTrigger>
                        </TabsList>

                        <div className="flex-1">
                            <TabsContent value="basic" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nationalId">National ID *</Label>
                                        <Input
                                            id="nationalId"
                                            value={formData.nationalId || ''}
                                            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                                            placeholder="A1234567"
                                            disabled={saving || !!subscriber}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="insuranceId">Insurance ID</Label>
                                        <Input
                                            id="insuranceId"
                                            value={formData.insuranceId || ''}
                                            onChange={(e) => setFormData({ ...formData, insuranceId: e.target.value })}
                                            placeholder="INS-0001"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullNameEn">Full Name (English) *</Label>
                                        <Input
                                            id="fullNameEn"
                                            value={formData.fullNameEn || ''}
                                            onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
                                            placeholder="John Doe"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fullNameAr">Full Name (Arabic)</Label>
                                        <Input
                                            id="fullNameAr"
                                            value={formData.fullNameAr || ''}
                                            onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                                            placeholder="محمد أحمد"
                                            disabled={saving}
                                            dir="rtl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstNameEn">First Name (EN)</Label>
                                        <Input
                                            id="firstNameEn"
                                            value={formData.firstNameEn || ''}
                                            onChange={(e) => setFormData({ ...formData, firstNameEn: e.target.value })}
                                            placeholder="John"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="middleNameEn">Middle Name (EN)</Label>
                                        <Input
                                            id="middleNameEn"
                                            value={formData.middleNameEn || ''}
                                            onChange={(e) => setFormData({ ...formData, middleNameEn: e.target.value })}
                                            placeholder="Michael"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastNameEn">Last Name (EN)</Label>
                                        <Input
                                            id="lastNameEn"
                                            value={formData.lastNameEn || ''}
                                            onChange={(e) => setFormData({ ...formData, lastNameEn: e.target.value })}
                                            placeholder="Doe"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstNameAr">First Name (AR)</Label>
                                        <Input
                                            id="firstNameAr"
                                            value={formData.firstNameAr || ''}
                                            onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
                                            placeholder="محمد"
                                            disabled={saving}
                                            dir="rtl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="middleNameAr">Middle Name (AR)</Label>
                                        <Input
                                            id="middleNameAr"
                                            value={formData.middleNameAr || ''}
                                            onChange={(e) => setFormData({ ...formData, middleNameAr: e.target.value })}
                                            placeholder="أحمد"
                                            disabled={saving}
                                            dir="rtl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastNameAr">Last Name (AR)</Label>
                                        <Input
                                            id="lastNameAr"
                                            value={formData.lastNameAr || ''}
                                            onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
                                            placeholder="السالم"
                                            disabled={saving}
                                            dir="rtl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender *</Label>
                                        <Select
                                            value={formData.gender || 'M'}
                                            onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                            disabled={saving}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GENDER_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth || ''}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maritalStatus">Marital Status</Label>
                                        <Select
                                            value={formData.maritalStatus || 'ALL'}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, maritalStatus: value === 'ALL' ? null : value })
                                            }
                                            disabled={saving}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Not Specified</SelectItem>
                                                {MARITAL_STATUS_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isAlive"
                                            checked={formData.isAlive ?? true}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isAlive: checked })}
                                            disabled={saving}
                                        />
                                        <Label htmlFor="isAlive" className="cursor-pointer">
                                            Is Alive
                                        </Label>
                                    </div>
                                    {!formData.isAlive && (
                                        <div className="space-y-2">
                                            <Label htmlFor="deathDate">Death Date</Label>
                                            <Input
                                                id="deathDate"
                                                type="date"
                                                value={formData.deathDate || ''}
                                                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                                                disabled={saving}
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="personal" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input
                                            id="phoneNumber"
                                            value={formData.phoneNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="065555555"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                                        <Input
                                            id="mobileNumber"
                                            value={formData.mobileNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                            placeholder="0799999999"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="example@email.com"
                                        disabled={saving}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            value={formData.country || ''}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            placeholder="Jordan"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city || ''}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Amman"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="addressLine">Address Line</Label>
                                    <Input
                                        id="addressLine"
                                        value={formData.addressLine || ''}
                                        onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                                        placeholder="7th Circle"
                                        disabled={saving}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="passportNo">Passport Number</Label>
                                        <Input
                                            id="passportNo"
                                            value={formData.passportNo || ''}
                                            onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                                            placeholder="P123456"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nationality">Nationality</Label>
                                        <Input
                                            id="nationality"
                                            value={formData.nationality || ''}
                                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                            placeholder="Jordanian"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="employment" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="employerName">Employer Name</Label>
                                        <Input
                                            id="employerName"
                                            value={formData.employerName || ''}
                                            onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                                            placeholder="ABC Corp"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="employeeNumber">Employee Number</Label>
                                        <Input
                                            id="employeeNumber"
                                            value={formData.employeeNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                                            placeholder="EMP1001"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employerId">Employer ID</Label>
                                    <Input
                                        id="employerId"
                                        type="number"
                                        value={formData.employerId || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                employerId: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                        placeholder="123"
                                        disabled={saving}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="relationType">Relation Type</Label>
                                        <Select
                                            value={formData.relationType || 'ALL'}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, relationType: value === 'ALL' ? null : value })
                                            }
                                            disabled={saving}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Not Specified</SelectItem>
                                                {RELATION_TYPE_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-8">
                                        <Switch
                                            id="isHeadOfFamily"
                                            checked={formData.isHeadOfFamily || false}
                                            onCheckedChange={(checked) => {
                                                setFormData({ 
                                                    ...formData, 
                                                    isHeadOfFamily: checked,
                                                    // Clear hofId if setting as HOF
                                                    hofId: checked ? null : formData.hofId
                                                })
                                            }}
                                            disabled={saving}
                                        />
                                        <Label htmlFor="isHeadOfFamily" className="cursor-pointer">
                                            Is Head of Family
                                        </Label>
                                    </div>
                                </div>
                                {!formData.isHeadOfFamily && (
                                    <div className="space-y-2">
                                        <Label htmlFor="hofId">Head of Family (HOF)</Label>
                                        <SearchableSelect
                                            options={hofSubscribers.map((hof) => ({
                                                id: hof.id,
                                                label: hof.fullNameEn,
                                                subLabel: `National ID: ${hof.nationalId}`,
                                            }))}
                                            value={formData.hofId || undefined}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, hofId: value ? Number(value) : null })
                                            }
                                            placeholder="Select Head of Family..."
                                            searchPlaceholder="Search by name or national ID..."
                                            emptyMessage="No HOF subscribers found"
                                            loading={loadingHof}
                                            disabled={saving || formData.isHeadOfFamily}
                                        />
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="medical" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="hasChronicConditions"
                                            checked={formData.hasChronicConditions || false}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, hasChronicConditions: checked })
                                            }
                                            disabled={saving}
                                        />
                                        <Label htmlFor="hasChronicConditions" className="cursor-pointer">
                                            Has Chronic Conditions
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="hasPreexisting"
                                            checked={formData.hasPreexisting || false}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, hasPreexisting: checked })
                                            }
                                            disabled={saving}
                                        />
                                        <Label htmlFor="hasPreexisting" className="cursor-pointer">
                                            Has Preexisting Conditions
                                        </Label>
                                    </div>
                                </div>

                                {formData.hasPreexisting && (
                                    <div className="space-y-2">
                                        <Label htmlFor="preexistingNotes">Preexisting Notes</Label>
                                        <Textarea
                                            id="preexistingNotes"
                                            value={formData.preexistingNotes || ''}
                                            onChange={(e) => setFormData({ ...formData, preexistingNotes: e.target.value })}
                                            placeholder="Notes about preexisting conditions..."
                                            disabled={saving}
                                            rows={3}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="eligibilityStatus">Eligibility Status</Label>
                                        <Select
                                            value={formData.eligibilityStatus || 'ALL'}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, eligibilityStatus: value === 'ALL' ? null : value })
                                            }
                                            disabled={saving}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Not Specified</SelectItem>
                                                {ELIGIBILITY_STATUS_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentCardStatus">Card Status</Label>
                                        <Select
                                            value={formData.currentCardStatus || 'ALL'}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, currentCardStatus: value === 'ALL' ? null : value })
                                            }
                                            disabled={saving}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Not Specified</SelectItem>
                                                {CARD_STATUS_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="eligibilityStart">Eligibility Start</Label>
                                        <Input
                                            id="eligibilityStart"
                                            type="date"
                                            value={formData.eligibilityStart || ''}
                                            onChange={(e) => setFormData({ ...formData, eligibilityStart: e.target.value })}
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="eligibilityEnd">Eligibility End</Label>
                                        <Input
                                            id="eligibilityEnd"
                                            type="date"
                                            value={formData.eligibilityEnd || ''}
                                            onChange={(e) => setFormData({ ...formData, eligibilityEnd: e.target.value })}
                                            disabled={saving}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

