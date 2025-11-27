'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NetworksManagementTab } from './networks-management-tab'
import { PlanNetworkMappingTab } from './plan-network-mapping-tab'
import { InsurancePlansTab } from './insurance-plans-tab'
import { ProviderNetworkMappingTab } from './provider-network-mapping-tab'
import { Network as NetworkIcon, Link2, FileText, Building2 } from 'lucide-react'

export function NetworksPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-tpa-primary/10 p-3 text-tpa-primary">
                    <NetworkIcon className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Networks</h1>
                    <p className="text-sm text-gray-600">Manage provider networks, insurance plans, and link them together.</p>
                </div>
            </div>

            <Tabs defaultValue="networks" className="bg-white rounded-lg shadow border border-gray-100">
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="networks" className="flex items-center gap-2">
                        <NetworkIcon className="h-4 w-4" />
                        Networks
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Insurance Plans
                    </TabsTrigger>
                    <TabsTrigger value="plan-mapping" className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Plan-Network Mapping
                    </TabsTrigger>
                    <TabsTrigger value="provider-mapping" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Provider-Network Mapping
                    </TabsTrigger>
                </TabsList>
                <div className="p-6">
                    <TabsContent value="networks" className="mt-0">
                        <NetworksManagementTab />
                    </TabsContent>
                    <TabsContent value="plans" className="mt-0">
                        <InsurancePlansTab />
                    </TabsContent>
                    <TabsContent value="plan-mapping" className="mt-0">
                        <PlanNetworkMappingTab />
                    </TabsContent>
                    <TabsContent value="provider-mapping" className="mt-0">
                        <ProviderNetworkMappingTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

