'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Eye, 
    Star, 
    StarOff, 
    Copy,
    CreditCard,
    Palette,
    Monitor,
    Smartphone
} from 'lucide-react'
import { CardTemplate, TEMPLATE_TYPES } from '@/types/card-template'
import { 
    fetchCardTemplates, 
    deleteCardTemplate, 
    setDefaultTemplate 
} from '@/lib/api/card-templates'
import { CardTemplateFormDialog } from './card-template-form-dialog'

interface CardTemplateListTabProps {
    planId: number
    onEditTemplate: (template: CardTemplate) => void
    onPreviewTemplate: (template: CardTemplate) => void
}

export function CardTemplateListTab({ 
    planId, 
    onEditTemplate, 
    onPreviewTemplate 
}: CardTemplateListTabProps) {
    const [templates, setTemplates] = useState<CardTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null)

    const loadTemplates = async () => {
        try {
            setLoading(true)
            const data = await fetchCardTemplates(planId, { size: 100 })
            setTemplates(data)
        } catch (error) {
            console.error('Failed to load card templates:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTemplates()
    }, [planId])

    const handleDeleteTemplate = async (templateId: number) => {
        if (!confirm('Are you sure you want to delete this template?')) {
            return
        }

        try {
            await deleteCardTemplate(planId, templateId)
            await loadTemplates()
        } catch (error) {
            console.error('Failed to delete template:', error)
            alert('Failed to delete template')
        }
    }

    const handleSetDefault = async (templateId: number) => {
        try {
            await setDefaultTemplate(planId, templateId)
            await loadTemplates()
        } catch (error) {
            console.error('Failed to set default template:', error)
            alert('Failed to set default template')
        }
    }

    const handleEditTemplateClick = (template: CardTemplate) => {
        setEditingTemplate(template)
        setIsFormDialogOpen(true)
    }

    const handleAddTemplate = () => {
        setEditingTemplate(null)
        setIsFormDialogOpen(true)
    }

    const handleFormClose = () => {
        setIsFormDialogOpen(false)
        setEditingTemplate(null)
        loadTemplates()
    }

    const handleDuplicateTemplate = (template: CardTemplate) => {
        const duplicatedTemplate = {
            ...template,
            id: 0, // Will be assigned by backend
            templateCode: `${template.templateCode}_COPY`,
            nameEn: `${template.nameEn} (Copy)`,
            nameAr: `${template.nameAr} (نسخة)`,
            isDefault: false,
        }
        setEditingTemplate(duplicatedTemplate)
        setIsFormDialogOpen(true)
    }

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = 
            (template.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (template.nameAr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (template.templateCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (template.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesSearch
    })

    const getTemplateTypeIcon = (type: string) => {
        switch (type) {
            case 'PHYSICAL':
                return <CreditCard className="h-4 w-4" />
            case 'DIGITAL':
                return <Smartphone className="h-4 w-4" />
            case 'BOTH':
                return <Monitor className="h-4 w-4" />
            default:
                return <CreditCard className="h-4 w-4" />
        }
    }

    const getTemplateTypeColor = (type: string) => {
        switch (type) {
            case 'PHYSICAL':
                return 'bg-blue-100 text-blue-800'
            case 'DIGITAL':
                return 'bg-green-100 text-green-800'
            case 'BOTH':
                return 'bg-purple-100 text-purple-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const templateStats = {
        total: templates.length,
        active: templates.filter(t => t.isActive).length,
        inactive: templates.filter(t => !t.isActive).length,
        default: templates.find(t => t.isDefault)?.nameEn || 'None'
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                                <p className="text-2xl font-bold">{templateStats.total}</p>
                            </div>
                            <Palette className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-2xl font-bold text-green-600">{templateStats.active}</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Inactive</p>
                                <p className="text-2xl font-bold text-red-600">{templateStats.inactive}</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Default Template</p>
                                <p className="text-sm font-bold truncate" title={templateStats.default}>
                                    {templateStats.default}
                                </p>
                            </div>
                            <Star className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Card Templates</CardTitle>
                        <Button onClick={handleAddTemplate} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search templates by name, code, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Templates Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Template</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            Loading templates...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTemplates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            {searchTerm 
                                                ? 'No templates match your search' 
                                                : 'No templates found. Create your first template to get started.'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTemplates.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{template.nameEn}</div>
                                                    <div className="text-sm text-gray-500">{template.nameAr}</div>
                                                    {template.description && (
                                                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                                            {template.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {template.templateCode}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getTemplateTypeColor(template.templateType)}>
                                                    <span className="flex items-center gap-1">
                                                        {getTemplateTypeIcon(template.templateType)}
                                                        {TEMPLATE_TYPES.find(t => t.value === template.templateType)?.label || template.templateType}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                                                    {template.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {template.isDefault ? (
                                                    <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Default
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSetDefault(template.id)}
                                                        className="text-gray-400 hover:text-yellow-600"
                                                    >
                                                        <StarOff className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {new Date(template.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onPreviewTemplate(template)}
                                                        title="Preview"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onEditTemplate(template)}
                                                        title="Edit Design"
                                                    >
                                                        <Palette className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditTemplateClick(template)}
                                                        title="Edit Details"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDuplicateTemplate(template)}
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteTemplate(template.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <CardTemplateFormDialog
                open={isFormDialogOpen}
                onClose={handleFormClose}
                planId={planId}
                template={editingTemplate}
            />
        </div>
    )
}
