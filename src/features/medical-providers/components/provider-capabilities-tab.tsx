'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { fetchProviderCapabilities, saveProviderCapabilities } from '@/lib/api/provider-capabilities'
import { ProviderCapabilities } from '@/types/provider'

interface ProviderCapabilitiesTabProps {
    providerId: number
}

export function ProviderCapabilitiesTab({ providerId }: ProviderCapabilitiesTabProps) {
    const [capabilities, setCapabilities] = useState<ProviderCapabilities | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        void loadCapabilities()
    }, [providerId])

    const loadCapabilities = async () => {
        setIsLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const data = await fetchProviderCapabilities(providerId)
            setCapabilities(data)
        } catch (err) {
            console.error('Failed to load capabilities', err)
            setError(err instanceof Error ? err.message : 'Unable to load provider capabilities')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!capabilities) return

        setIsSaving(true)
        setError(null)
        setSuccess(null)
        try {
            await saveProviderCapabilities({
                providerId: capabilities.providerId,
                hasEmergency: capabilities.hasEmergency,
                hasIcu: capabilities.hasIcu,
                hasNicU: capabilities.hasNicU,
                hasOrRooms: capabilities.hasOrRooms,
                hasLab: capabilities.hasLab,
                hasRadiology: capabilities.hasRadiology,
                hasMri: capabilities.hasMri,
                hasCt: capabilities.hasCt,
                hasXray: capabilities.hasXray,
                hasUltrasound: capabilities.hasUltrasound,
                canPrescribeMedication: capabilities.canPrescribeMedication,
                canAdmitPatients: capabilities.canAdmitPatients,
                requiresReferral: capabilities.requiresReferral,
                notes: capabilities.notes,
            })
            setSuccess('Capabilities saved successfully')
            void loadCapabilities()
        } catch (err) {
            console.error('Failed to save capabilities', err)
            setError(err instanceof Error ? err.message : 'Unable to save provider capabilities')
        } finally {
            setIsSaving(false)
        }
    }

    const updateCapability = (field: keyof ProviderCapabilities, value: boolean | string | null) => {
        if (!capabilities) return
        setCapabilities({ ...capabilities, [field]: value })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-gray-600">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Loading capabilities...
                </div>
            </div>
        )
    }

    if (!capabilities) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-600">Unable to load capabilities</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="text-lg font-semibold">Provider Capabilities</h3>
                    <p className="text-sm text-gray-600">Configure the services and facilities available at this provider</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadCapabilities} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-tpa-primary hover:bg-tpa-accent">
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600">{success}</p>
                </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <div>
                    <h4 className="text-md font-semibold mb-4 text-gray-800">Emergency & Critical Care</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasEmergency" className="cursor-pointer">
                                Emergency Department
                            </Label>
                            <Switch
                                id="hasEmergency"
                                checked={capabilities.hasEmergency}
                                onCheckedChange={(checked) => updateCapability('hasEmergency', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasIcu" className="cursor-pointer">
                                ICU (Intensive Care Unit)
                            </Label>
                            <Switch
                                id="hasIcu"
                                checked={capabilities.hasIcu}
                                onCheckedChange={(checked) => updateCapability('hasIcu', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasNicU" className="cursor-pointer">
                                NICU (Neonatal ICU)
                            </Label>
                            <Switch
                                id="hasNicU"
                                checked={capabilities.hasNicU}
                                onCheckedChange={(checked) => updateCapability('hasNicU', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasOrRooms" className="cursor-pointer">
                                Operating Rooms
                            </Label>
                            <Switch
                                id="hasOrRooms"
                                checked={capabilities.hasOrRooms}
                                onCheckedChange={(checked) => updateCapability('hasOrRooms', checked)}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold mb-4 text-gray-800">Diagnostic Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasLab" className="cursor-pointer">
                                Laboratory
                            </Label>
                            <Switch
                                id="hasLab"
                                checked={capabilities.hasLab}
                                onCheckedChange={(checked) => updateCapability('hasLab', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasRadiology" className="cursor-pointer">
                                Radiology Department
                            </Label>
                            <Switch
                                id="hasRadiology"
                                checked={capabilities.hasRadiology}
                                onCheckedChange={(checked) => updateCapability('hasRadiology', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasMri" className="cursor-pointer">
                                MRI
                            </Label>
                            <Switch
                                id="hasMri"
                                checked={capabilities.hasMri}
                                onCheckedChange={(checked) => updateCapability('hasMri', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasCt" className="cursor-pointer">
                                CT Scan
                            </Label>
                            <Switch
                                id="hasCt"
                                checked={capabilities.hasCt}
                                onCheckedChange={(checked) => updateCapability('hasCt', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasXray" className="cursor-pointer">
                                X-Ray
                            </Label>
                            <Switch
                                id="hasXray"
                                checked={capabilities.hasXray}
                                onCheckedChange={(checked) => updateCapability('hasXray', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="hasUltrasound" className="cursor-pointer">
                                Ultrasound
                            </Label>
                            <Switch
                                id="hasUltrasound"
                                checked={capabilities.hasUltrasound}
                                onCheckedChange={(checked) => updateCapability('hasUltrasound', checked)}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold mb-4 text-gray-800">Medical Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="canPrescribeMedication" className="cursor-pointer">
                                Can Prescribe Medication
                            </Label>
                            <Switch
                                id="canPrescribeMedication"
                                checked={capabilities.canPrescribeMedication}
                                onCheckedChange={(checked) => updateCapability('canPrescribeMedication', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="canAdmitPatients" className="cursor-pointer">
                                Can Admit Patients
                            </Label>
                            <Switch
                                id="canAdmitPatients"
                                checked={capabilities.canAdmitPatients}
                                onCheckedChange={(checked) => updateCapability('canAdmitPatients', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <Label htmlFor="requiresReferral" className="cursor-pointer">
                                Requires Referral
                            </Label>
                            <Switch
                                id="requiresReferral"
                                checked={capabilities.requiresReferral}
                                onCheckedChange={(checked) => updateCapability('requiresReferral', checked)}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold mb-4 text-gray-800">Additional Notes</h4>
                    <Textarea
                        value={capabilities.notes || ''}
                        onChange={(e) => updateCapability('notes', e.target.value || null)}
                        placeholder="Enter any additional notes about provider capabilities..."
                        className="min-h-[100px]"
                    />
                </div>
            </div>
        </div>
    )
}

