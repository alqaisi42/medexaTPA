'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Layout, Eye, Palette } from 'lucide-react'
import { CardTemplateListTab } from '../card-templates/card-template-list-tab'
import { CardTemplateEditorTab } from '../card-templates/card-template-editor-tab'
import { CardTemplatePreviewTab } from '../card-templates/card-template-preview-tab'
import { CardTemplate, LayoutDefinition } from '@/types/card-template'

interface PlanCardTemplatesTabProps {
    planId: number
}

export function PlanCardTemplatesTab({ planId }: PlanCardTemplatesTabProps) {
    const [activeTab, setActiveTab] = useState('templates')
    const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null)
    const [editingLayout, setEditingLayout] = useState<LayoutDefinition | null>(null)

    const handleEditTemplate = (template: CardTemplate) => {
        setSelectedTemplate(template)
        setEditingLayout(template.layoutDefinition)
        setActiveTab('editor')
    }

    const handlePreviewTemplate = (template: CardTemplate) => {
        setSelectedTemplate(template)
        setActiveTab('preview')
    }

    const handleSaveLayout = (layout: LayoutDefinition) => {
        setEditingLayout(layout)
        // The actual save will be handled by the editor component
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Card Templates Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="templates" className="flex items-center gap-2">
                                <Layout className="h-4 w-4" />
                                Template List
                            </TabsTrigger>
                            <TabsTrigger value="editor" className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Drag & Drop Editor
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Preview
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="templates" className="mt-6">
                            <CardTemplateListTab
                                planId={planId}
                                onEditTemplate={handleEditTemplate}
                                onPreviewTemplate={handlePreviewTemplate}
                            />
                        </TabsContent>

                        <TabsContent value="editor" className="mt-6">
                            <CardTemplateEditorTab
                                planId={planId}
                                template={selectedTemplate}
                                layout={editingLayout}
                                onSaveLayout={handleSaveLayout}
                                onBackToList={() => setActiveTab('templates')}
                            />
                        </TabsContent>

                        <TabsContent value="preview" className="mt-6">
                            <CardTemplatePreviewTab
                                template={selectedTemplate}
                                layout={editingLayout}
                                onBackToList={() => setActiveTab('templates')}
                                onEditTemplate={() => setActiveTab('editor')}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}