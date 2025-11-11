'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Download, Upload, Settings, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { LookupType, LookupCategory } from '@/types'
import { generateId } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

export function LookupManagementPage() {
    const language = useAppStore(state => state.language)
    const [lookupTypes, setLookupTypes] = useState<LookupType[]>([])
    const [filteredLookups, setFilteredLookups] = useState<LookupType[]>([])
    const [selectedLookup, setSelectedLookup] = useState<LookupType | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<LookupCategory>('procedure_category')

    // Lookup Form State
    const [formData, setFormData] = useState<Partial<LookupType>>({
        type: 'procedure_category',
        code: '',
        nameEn: '',
        nameAr: '',
        description: '',
        active: true,
        sortOrder: 0
    })

    // Lookup Categories Definition
    const lookupCategories: { value: LookupCategory; label: string; description: string }[] = [
        { value: 'procedure_category', label: 'Procedure Categories', description: 'Categories for medical procedures' },
        { value: 'icd_category', label: 'ICD Categories', description: 'Categories for ICD codes' },
        { value: 'relation_type', label: 'Relation Types', description: 'Types of relations between entities' },
        { value: 'specialty', label: 'Specialties', description: 'Medical specialties' },
        { value: 'unit', label: 'Units', description: 'Units of measure' },
        { value: 'price_list', label: 'Price Lists', description: 'Types of price lists' },
        { value: 'factor', label: 'Factors', description: 'Pricing and rule factors' },
        { value: 'provider_type', label: 'Provider Types', description: 'Types of healthcare providers' },
        { value: 'insurance_degree', label: 'Insurance Degrees', description: 'Insurance coverage levels' },
        { value: 'gender', label: 'Gender', description: 'Gender options' },
        { value: 'claim_type', label: 'Claim Types', description: 'Types of insurance claims' },
        { value: 'visit_type', label: 'Visit Types', description: 'Types of medical visits' }
    ]

    // Sample data generation
    useEffect(() => {
        const sampleData: LookupType[] = [
            // Procedure Categories
            { id: '1', type: 'procedure_category', code: 'SURG', nameEn: 'Surgery', nameAr: 'جراحة', active: true, sortOrder: 1 },
            { id: '2', type: 'procedure_category', code: 'LAB', nameEn: 'Laboratory', nameAr: 'مختبر', active: true, sortOrder: 2 },
            { id: '3', type: 'procedure_category', code: 'IMG', nameEn: 'Imaging', nameAr: 'تصوير', active: true, sortOrder: 3 },
            { id: '4', type: 'procedure_category', code: 'CONS', nameEn: 'Consultation', nameAr: 'استشارة', active: true, sortOrder: 4 },

            // Specialties
            { id: '5', type: 'specialty', code: 'ORTH', nameEn: 'Orthopedics', nameAr: 'جراحة العظام', active: true, sortOrder: 1 },
            { id: '6', type: 'specialty', code: 'CARD', nameEn: 'Cardiology', nameAr: 'أمراض القلب', active: true, sortOrder: 2 },
            { id: '7', type: 'specialty', code: 'NEUR', nameEn: 'Neurology', nameAr: 'الأعصاب', active: true, sortOrder: 3 },

            // Provider Types
            { id: '8', type: 'provider_type', code: 'HOSP', nameEn: 'Hospital', nameAr: 'مستشفى', active: true, sortOrder: 1 },
            { id: '9', type: 'provider_type', code: 'CLIN', nameEn: 'Clinic', nameAr: 'عيادة', active: true, sortOrder: 2 },
            { id: '10', type: 'provider_type', code: 'LAB', nameEn: 'Laboratory', nameAr: 'مختبر', active: true, sortOrder: 3 },

            // Insurance Degrees
            { id: '11', type: 'insurance_degree', code: 'GOLD', nameEn: 'Gold', nameAr: 'ذهبي', description: 'Premium coverage', active: true, sortOrder: 1 },
            { id: '12', type: 'insurance_degree', code: 'SILV', nameEn: 'Silver', nameAr: 'فضي', description: 'Standard coverage', active: true, sortOrder: 2 },
            { id: '13', type: 'insurance_degree', code: 'BRNZ', nameEn: 'Bronze', nameAr: 'برونزي', description: 'Basic coverage', active: true, sortOrder: 3 },

            // Claim Types
            { id: '14', type: 'claim_type', code: 'CASH', nameEn: 'Cashless', nameAr: 'بدون نقد', active: true, sortOrder: 1 },
            { id: '15', type: 'claim_type', code: 'REIMB', nameEn: 'Reimbursement', nameAr: 'استرداد', active: true, sortOrder: 2 },

            // Units
            { id: '16', type: 'unit', code: 'PROC', nameEn: 'Procedure', nameAr: 'إجراء', active: true, sortOrder: 1 },
            { id: '17', type: 'unit', code: 'VISIT', nameEn: 'Visit', nameAr: 'زيارة', active: true, sortOrder: 2 },
            { id: '18', type: 'unit', code: 'TEST', nameEn: 'Test', nameAr: 'فحص', active: true, sortOrder: 3 },
            { id: '19', type: 'unit', code: 'DAY', nameEn: 'Day', nameAr: 'يوم', active: true, sortOrder: 4 }
        ]

        setLookupTypes(sampleData)
    }, [])

    // Filter lookups by selected category
    useEffect(() => {
        let filtered = lookupTypes.filter(lookup => lookup.type === selectedCategory)

        if (searchTerm) {
            filtered = filtered.filter(lookup =>
                lookup.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lookup.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lookup.nameAr.includes(searchTerm)
            )
        }

        setFilteredLookups(filtered)
    }, [selectedCategory, searchTerm, lookupTypes])

    const handleAdd = () => {
        setIsEditMode(false)
        setFormData({
            type: selectedCategory,
            code: '',
            nameEn: '',
            nameAr: '',
            description: '',
            active: true,
            sortOrder: filteredLookups.length + 1
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (lookup: LookupType) => {
        setIsEditMode(true)
        setSelectedLookup(lookup)
        setFormData(lookup)
        setIsDialogOpen(true)
    }

    const handleDelete = (lookup: LookupType) => {
        if (confirm(`Are you sure you want to delete "${lookup.nameEn}"?`)) {
            setLookupTypes(prev => prev.filter(l => l.id !== lookup.id))
        }
    }

    const handleSave = () => {
        if (!formData.code || !formData.nameEn) {
            alert('Please fill in required fields')
            return
        }

        if (isEditMode && selectedLookup) {
            setLookupTypes(prev => prev.map(l =>
                l.id === selectedLookup.id
                    ? { ...l, ...formData } as LookupType
                    : l
            ))
        } else {
            const newLookup: LookupType = {
                ...formData as LookupType,
                id: generateId(),
                type: selectedCategory
            }
            setLookupTypes(prev => [...prev, newLookup])
        }

        setIsDialogOpen(false)
    }

    const currentCategory = lookupCategories.find(cat => cat.value === selectedCategory)

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Lookup Management</h1>
                <p className="text-gray-600">Manage system reference data and master lists</p>
            </div>

            {/* Category Selector */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Database className="h-6 w-6 text-tpa-primary" />
                        <div>
                            <h2 className="text-lg font-semibold">{currentCategory?.label}</h2>
                            <p className="text-sm text-gray-600">{currentCategory?.description}</p>
                        </div>
                    </div>
                    <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as LookupCategory)}>
                        <SelectTrigger className="w-64">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {lookupCategories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={`Search ${currentCategory?.label}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button onClick={handleAdd} className="bg-tpa-primary hover:bg-tpa-accent">
                            <Plus className="h-4 w-4 mr-2" />
                            Add {currentCategory?.label.slice(0, -1)}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input type="checkbox" className="rounded" />
                            </TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead>Name (AR)</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-24">Sort Order</TableHead>
                            <TableHead className="w-24">Status</TableHead>
                            <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLookups.map((lookup) => (
                            <TableRow key={lookup.id} className="hover:bg-gray-50">
                                <TableCell>
                                    <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-medium">{lookup.code}</TableCell>
                                <TableCell>{lookup.nameEn}</TableCell>
                                <TableCell className="text-right" dir="rtl">{lookup.nameAr}</TableCell>
                                <TableCell>{lookup.description || '-'}</TableCell>
                                <TableCell className="text-center">{lookup.sortOrder || '-'}</TableCell>
                                <TableCell>
                  <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      lookup.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                  )}>
                    {lookup.active ? 'Active' : 'Inactive'}
                  </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(lookup)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(lookup)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {filteredLookups.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No {currentCategory?.label.toLowerCase()} found
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit' : 'Add New'} {currentCategory?.label.slice(0, -1)}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Update the information below' : 'Enter the details below'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="Enter code"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">Sort Order</Label>
                                <Input
                                    id="sortOrder"
                                    type="number"
                                    value={formData.sortOrder || ''}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input
                                    id="nameEn"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                    placeholder="Enter English name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameAr">Name (Arabic)</Label>
                                <Input
                                    id="nameAr"
                                    value={formData.nameAr}
                                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                    placeholder="أدخل الاسم بالعربية"
                                    dir="rtl"
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter description (optional)"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, active: checked })
                                    }
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-tpa-primary hover:bg-tpa-accent">
                            {isEditMode ? 'Update' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}