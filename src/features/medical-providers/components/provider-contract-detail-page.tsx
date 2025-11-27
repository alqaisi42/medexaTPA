'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, FileText, DollarSign, Settings, Shield, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchProviderContract } from '@/lib/api/provider-contracts'
import { ProviderContract } from '@/types/provider-contract'
import { ContractInfoTab } from './contract-detail-tabs/contract-info-tab'
import { FinancialTermsTab } from './contract-detail-tabs/financial-terms-tab'
import { ContractPricesTab } from './contract-detail-tabs/contract-prices-tab'
import { DenyPolicyTab } from './contract-detail-tabs/deny-policy-tab'
import { AuditTrailTab } from './contract-detail-tabs/audit-trail-tab'

export function ProviderContractDetailPage() {
    const router = useRouter()
    const params = useParams()
    const contractId = params?.contractId ? Number(params.contractId) : null

    const [contract, setContract] = useState<ProviderContract | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!contractId) {
            setError('Contract ID is required')
            return
        }

        const loadContract = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchProviderContract(contractId)
                setContract(data)
            } catch (err) {
                console.error('Failed to load contract', err)
                setError(err instanceof Error ? err.message : 'Unable to load contract details')
            } finally {
                setLoading(false)
            }
        }

        void loadContract()
    }, [contractId])

    const handleContractUpdate = async () => {
        if (!contractId) return
        try {
            const data = await fetchProviderContract(contractId)
            setContract(data)
        } catch (err) {
            console.error('Failed to refresh contract', err)
        }
    }

    if (!contractId) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    Invalid contract ID
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Loading contract details...</p>
                </div>
            </div>
        )
    }

    if (error || !contract) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error || 'Contract not found'}
                </div>
                <Button variant="outline" onClick={() => router.push('/provider-contracts')} className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Contracts
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/provider-contracts')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{contract.nameEn}</h1>
                        <p className="text-sm text-gray-600">
                            Contract Code: <span className="font-mono">{contract.contractCode}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="info" className="bg-white rounded-lg shadow border border-gray-100">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="info" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Contract Info
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financial Terms
                    </TabsTrigger>
                    <TabsTrigger value="prices" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Contract Prices
                    </TabsTrigger>
                    <TabsTrigger value="deny-policy" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Deny Policies
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Audit Trail
                    </TabsTrigger>
                </TabsList>
                <div className="p-6">
                    <TabsContent value="info" className="mt-0">
                        <ContractInfoTab contract={contract} onUpdate={handleContractUpdate} />
                    </TabsContent>
                    <TabsContent value="financial" className="mt-0">
                        <FinancialTermsTab contract={contract} onUpdate={handleContractUpdate} />
                    </TabsContent>
                    <TabsContent value="prices" className="mt-0">
                        <ContractPricesTab contractId={contract.id} providerId={contract.providerId} />
                    </TabsContent>
                    <TabsContent value="deny-policy" className="mt-0">
                        <DenyPolicyTab contract={contract} onUpdate={handleContractUpdate} />
                    </TabsContent>
                    <TabsContent value="audit" className="mt-0">
                        <AuditTrailTab contract={contract} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

