'use client'

import React, { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { DiagnosisCategoriesManager } from './diagnosis-categories-manager'
import { IcdCategoryMappingManager } from './icd-category-mapping-manager'
import { IcdCodesManager } from './icd-codes-manager'

export function IcdManagementPage() {
    const [activeTab, setActiveTab] = useState('icd-codes')

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">International Classifications</h1>
                <p className="text-gray-600">
                    Maintain ICD master data, curate diagnosis categories, and manage the relationships between both
                    repositories from one streamlined workspace.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-0">
                    <TabsTrigger value="icd-codes">ICD Catalogue</TabsTrigger>
                    <TabsTrigger value="diagnosis-categories">Diagnosis Categories</TabsTrigger>
                    <TabsTrigger value="icd-category-mappings">ICD ↔ Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="icd-codes" className="space-y-6">
                    <IcdCodesManager />
                </TabsContent>

                <TabsContent value="diagnosis-categories" className="space-y-6">
                    <DiagnosisCategoriesManager />
                </TabsContent>

                <TabsContent value="icd-category-mappings" className="space-y-6">
                    <IcdCategoryMappingManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}
