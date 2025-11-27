'use client'

import { useState } from 'react'
import { Loader2, Pencil, Save, X, Download, Users, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Subscriber, SubscriberPayload } from '@/types/subscriber'
import { updateSubscriber } from '@/lib/api/subscribers'
import { cn } from '@/lib/utils'
import { exportSubscriberToPDF } from '../../utils/pdf-export'

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

interface PersonalDetailsTabProps {
    subscriber: Subscriber
    onUpdate: () => void
}

function calculateAge(dateOfBirth: Subscriber['dateOfBirth']): number | null {
    if (!dateOfBirth) return null
    let birthDate: Date
    if (Array.isArray(dateOfBirth)) {
        birthDate = new Date(dateOfBirth[0], dateOfBirth[1] - 1, dateOfBirth[2])
    } else if (typeof dateOfBirth === 'string') {
        birthDate = new Date(dateOfBirth)
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

function formatDate(date: Subscriber['dateOfBirth']): string {
    if (!date) return ''
    if (Array.isArray(date)) {
        return `${date[0]}-${String(date[1]).padStart(2, '0')}-${String(date[2]).padStart(2, '0')}`
    }
    if (typeof date === 'string') {
        return date.split('T')[0]
    }
    return ''
}

export function PersonalDetailsTab({ subscriber, onUpdate }: PersonalDetailsTabProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<Partial<SubscriberPayload>>({
        fullNameEn: subscriber.fullNameEn || '',
        fullNameAr: subscriber.fullNameAr || null,
        gender: subscriber.gender || 'M',
        dateOfBirth: formatDate(subscriber.dateOfBirth),
        maritalStatus: subscriber.maritalStatus || null,
        isAlive: subscriber.isAlive ?? true,
        deathDate: subscriber.deathDate || null,
        phoneNumber: subscriber.phoneNumber || null,
        mobileNumber: subscriber.mobileNumber || null,
        email: subscriber.email || null,
        country: subscriber.country || null,
        city: subscriber.city || null,
        addressLine: subscriber.addressLine || null,
    })

    const age = calculateAge(subscriber.dateOfBirth)

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            const payload: SubscriberPayload = {
                nationalId: subscriber.nationalId,
                fullNameEn: formData.fullNameEn?.trim() || subscriber.fullNameEn,
                fullNameAr: formData.fullNameAr?.trim() || null,
                gender: formData.gender || subscriber.gender,
                dateOfBirth: formData.dateOfBirth || formatDate(subscriber.dateOfBirth) || '',
                maritalStatus: formData.maritalStatus || null,
                isAlive: formData.isAlive ?? subscriber.isAlive,
                deathDate: formData.deathDate || null,
                phoneNumber: formData.phoneNumber?.trim() || null,
                mobileNumber: formData.mobileNumber?.trim() || null,
                email: formData.email?.trim() || null,
                country: formData.country?.trim() || null,
                city: formData.city?.trim() || null,
                addressLine: formData.addressLine?.trim() || null,
                passportNo: subscriber.passportNo || null,
                insuranceId: subscriber.insuranceId || null,
                firstNameEn: subscriber.firstNameEn || null,
                middleNameEn: subscriber.middleNameEn || null,
                lastNameEn: subscriber.lastNameEn || null,
                firstNameAr: subscriber.firstNameAr || null,
                middleNameAr: subscriber.middleNameAr || null,
                lastNameAr: subscriber.lastNameAr || null,
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

            await updateSubscriber(subscriber.id, payload)
            setIsEditing(false)
            await onUpdate()
        } catch (saveError) {
            console.error(saveError)
            setError(saveError instanceof Error ? saveError.message : 'Unable to update subscriber')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            fullNameEn: subscriber.fullNameEn || '',
            fullNameAr: subscriber.fullNameAr || null,
            gender: subscriber.gender || 'M',
            dateOfBirth: formatDate(subscriber.dateOfBirth),
            maritalStatus: subscriber.maritalStatus || null,
            isAlive: subscriber.isAlive ?? true,
            deathDate: subscriber.deathDate || null,
            phoneNumber: subscriber.phoneNumber || null,
            mobileNumber: subscriber.mobileNumber || null,
            email: subscriber.email || null,
            country: subscriber.country || null,
            city: subscriber.city || null,
            addressLine: subscriber.addressLine || null,
        })
        setIsEditing(false)
        setError(null)
    }

    const handleMarkDeceased = async () => {
        setFormData({
            ...formData,
            isAlive: false,
            deathDate: new Date().toISOString().split('T')[0],
        })
        await handleSave()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={handleCancel} disabled={saving}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            {subscriber.isAlive && (
                                <Button variant="outline" onClick={handleMarkDeceased}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Mark as Deceased
                                </Button>
                            )}
                            <Button variant="outline">
                                <Users className="h-4 w-4 mr-2" />
                                Merge Duplicate
                            </Button>
                            <Button variant="outline" onClick={() => exportSubscriberToPDF(subscriber)}>
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>National ID</Label>
                    <Input value={subscriber.nationalId} disabled />
                </div>

                <div className="space-y-2">
                    <Label>Full Name (English) *</Label>
                    {isEditing ? (
                        <Input
                            value={formData.fullNameEn || ''}
                            onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
                            disabled={saving}
                        />
                    ) : (
                        <Input value={subscriber.fullNameEn} disabled />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Full Name (Arabic)</Label>
                    {isEditing ? (
                        <Input
                            value={formData.fullNameAr || ''}
                            onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                            disabled={saving}
                            dir="rtl"
                        />
                    ) : (
                        <Input value={subscriber.fullNameAr || '-'} disabled dir="rtl" />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Gender *</Label>
                    {isEditing ? (
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
                    ) : (
                        <Input
                            value={
                                subscriber.gender === 'M'
                                    ? 'Male'
                                    : subscriber.gender === 'F'
                                      ? 'Female'
                                      : subscriber.gender === 'O'
                                        ? 'Other'
                                        : subscriber.gender
                            }
                            disabled
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    {isEditing ? (
                        <Input
                            type="date"
                            value={formData.dateOfBirth || ''}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            disabled={saving}
                        />
                    ) : (
                        <Input
                            value={`${formatDate(subscriber.dateOfBirth)}${age !== null ? ` (Age: ${age} years)` : ''}`}
                            disabled
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Marital Status</Label>
                    {isEditing ? (
                        <Select
                            value={formData.maritalStatus || 'ALL'}
                            onValueChange={(value) =>
                                setFormData({ ...formData, maritalStatus: value === 'ALL' ? null : value })
                            }
                            disabled={saving}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Not Specified" />
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
                    ) : (
                        <Input
                            value={
                                subscriber.maritalStatus
                                    ? MARITAL_STATUS_OPTIONS.find((opt) => opt.value === subscriber.maritalStatus)?.label ||
                                      subscriber.maritalStatus
                                    : '-'
                            }
                            disabled
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Phone</Label>
                    {isEditing ? (
                        <Input
                            value={formData.phoneNumber || ''}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            disabled={saving}
                        />
                    ) : (
                        <Input value={subscriber.phoneNumber || '-'} disabled />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Mobile</Label>
                    {isEditing ? (
                        <Input
                            value={formData.mobileNumber || ''}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                            disabled={saving}
                        />
                    ) : (
                        <Input value={subscriber.mobileNumber || '-'} disabled />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Email</Label>
                    {isEditing ? (
                        <Input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={saving}
                        />
                    ) : (
                        <Input value={subscriber.email || '-'} disabled />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Is Alive</Label>
                    {isEditing ? (
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.isAlive ?? true}
                                onCheckedChange={(checked) => setFormData({ ...formData, isAlive: checked })}
                                disabled={saving}
                            />
                            <Label>{formData.isAlive ? 'Yes' : 'No'}</Label>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
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
                        </div>
                    )}
                </div>

                {(!formData.isAlive || !subscriber.isAlive) && (
                    <div className="space-y-2">
                        <Label>Death Date</Label>
                        {isEditing ? (
                            <Input
                                type="date"
                                value={formData.deathDate || ''}
                                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                                disabled={saving}
                            />
                        ) : (
                            <Input value={subscriber.deathDate || '-'} disabled />
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Country</Label>
                    {isEditing ? (
                        <Input
                            value={formData.country || ''}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            disabled={saving}
                        />
                    ) : (
                        <Input value={subscriber.country || '-'} disabled />
                    )}
                </div>

                <div className="space-y-2">
                    <Label>City</Label>
                    {isEditing ? (
                        <Input
                            value={formData.city || ''}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            disabled={saving}
                        />
                    ) : (
                        <Input value={subscriber.city || '-'} disabled />
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    {isEditing ? (
                        <Textarea
                            value={formData.addressLine || ''}
                            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                            disabled={saving}
                            rows={2}
                        />
                    ) : (
                        <Input value={subscriber.addressLine || '-'} disabled />
                    )}
                </div>
            </div>
        </div>
    )
}

