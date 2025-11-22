'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, ClipboardList, Loader2, Settings, Stethoscope } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProviderDepartmentsTab } from './provider-departments-tab'
import { ProviderDoctorsTab } from './provider-doctors-tab'
import { ProviderBranchesPageClient } from './provider-branches-page-client'
import { ProviderCapabilitiesTab } from './provider-capabilities-tab'
import { getProvider } from '../services/provider-service'
import { ProviderRecord } from '@/types/provider'

interface ProviderDetailsPageProps {
    providerId: number
}

export function ProviderDetailsPage({ providerId }: ProviderDetailsPageProps) {
    const router = useRouter()
    const [provider, setProvider] = useState<ProviderRecord | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadProvider = async () => {
            if (!providerId || isNaN(providerId) || providerId <= 0) {
                setError('Invalid provider ID')
                return
            }
            setIsLoading(true)
            setError(null)
            try {
                const record = await getProvider(providerId)
                setProvider(record)
            } catch (err) {
                console.error('Failed to load provider', err)
                setError(err instanceof Error ? err.message : 'Unable to load provider details')
            } finally {
                setIsLoading(false)
            }
        }

        void loadProvider()
    }, [providerId])

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/medical-providers')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Provider Details</h1>
                        <p className="text-gray-600">Manage departments and doctors linked to this provider.</p>
                    </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading provider info...
                    </div>
                ) : provider ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-semibold">{provider.nameEn}</p>
                            <p className="text-sm text-gray-600">{provider.nameAr}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Code / Type</p>
                            <p className="font-semibold">{provider.code}</p>
                            <p className="text-sm text-gray-600">{provider.providerType.nameEn}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    provider.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-700'
                                        : provider.status === 'SUSPENDED'
                                          ? 'bg-amber-100 text-amber-700'
                                          : provider.status === 'BLACKLISTED'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {provider.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ownership</p>
                            <p className="font-semibold">{provider.ownershipType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">License</p>
                            <p className="font-semibold">{provider.licenseNumber || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tax Number</p>
                            <p className="font-semibold">{provider.taxNumber || '-'}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">No provider information available.</p>
                )}
            </div>

            <Tabs defaultValue="departments" className="bg-white rounded-lg shadow border border-gray-100">
                <TabsList className="grid grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="departments" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> Departments
                    </TabsTrigger>
                    <TabsTrigger value="doctors" className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" /> Assigned Doctors
                    </TabsTrigger>
                    <TabsTrigger value="branches" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Branches
                    </TabsTrigger>
                    <TabsTrigger value="capabilities" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Capabilities
                    </TabsTrigger>
                </TabsList>
                <div className="p-4">
                    <TabsContent value="departments">
                        <ProviderDepartmentsTab providerId={providerId} />
                    </TabsContent>
                    <TabsContent value="doctors">
                        <ProviderDoctorsTab providerId={providerId} />
                    </TabsContent>
                    <TabsContent value="branches">
                        <ProviderBranchesPageClient providerId={providerId} embedded={true} />
                    </TabsContent>
                    <TabsContent value="capabilities">
                        <ProviderCapabilitiesTab providerId={providerId} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
