'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Download, Upload, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { ICD, ICDRelation } from '@/types'
import { generateId } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

export function IcdManagementPage() {
    const language = useAppStore(state => state.language)
    const [icds, setIcds] = useState<ICD[]>([])
    const [filteredIcds, setFilteredIcds] = useState<ICD[]>([])
    const [selectedIcd, setSelectedIcd] = useState<ICD | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    // ICD Form State
    const NO_PARENT_ICD_VALUE = '__none__'

    const [formData, setFormData] = useState<Partial<ICD>>({
        code: '',
        nameEn: '',
        nameAr: '',
        description: '',
        category: '',
        parentIcd: undefined,
        relatedIcds: [],
        status: 'active',
        notes: ''
    })

    // Sample data
    useEffect(() => {
        const sampleData: ICD[] = [
            {
                id: '1',
                code: 'A00.0',
                nameEn: 'Cholera due to Vibrio cholerae 01',
                nameAr: 'الكوليرا بسبب ضمة الكوليرا 01',
                description: 'Classical cholera',
                category: 'Infectious diseases',
                status: 'active',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: '2',
                code: 'A00.1',
                nameEn: 'Cholera due to Vibrio cholerae 01, biovar eltor',
                nameAr: 'الكوليرا بسبب ضمة الكوليرا 01، النمط الحيوي التور',
                description: 'El Tor cholera',
                category: 'Infectious diseases',
                status: 'active',
                parentIcd: '1',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: '3',
                code: 'B00.1',
                nameEn: 'Herpesviral vesicular dermatitis',
                nameAr: 'التهاب الجلد الحويصلي الفيروسي',
                description: 'Herpes simplex dermatitis',
                category: 'Viral infections',
                status: 'active',
                createdAt: new Date('2024-01-02'),
                updatedAt: new Date('2024-01-02')
            },
            {
                id: '4',
                code: 'C00.0',
                nameEn: 'Malignant neoplasm of external upper lip',
                nameAr: 'ورم خبيث في الشفة العلوية الخارجية',
                description: 'Cancer of upper lip',
                category: 'Neoplasms',
                status: 'active',
                createdAt: new Date('2024-01-03'),
                updatedAt: new Date('2024-01-03')
            },
            {
                id: '5',
                code: 'D50.0',
                nameEn: 'Iron deficiency anaemia secondary to blood loss',
                nameAr: 'فقر الدم بنقص الحديد الثانوي لفقدان الدم',
                description: 'Chronic posthemorrhagic anaemia',
                category: 'Blood disorders',
                status: 'inactive',
                createdAt: new Date('2024-01-04'),
                updatedAt: new Date('2024-01-04')
            }
        ]
        setIcds(sampleData)
        setFilteredIcds(sampleData)
    }, [])

    // Filter ICDs
    useEffect(() => {
        let filtered = icds

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(icd =>
                icd.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                icd.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                icd.nameAr.includes(searchTerm)
            )
        }

        // Category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(icd => icd.category === filterCategory)
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(icd => icd.status === filterStatus)
        }

        setFilteredIcds(filtered)
    }, [searchTerm, filterCategory, filterStatus, icds])

    const handleAdd = () => {
        setIsEditMode(false)
        setFormData({
            code: '',
            nameEn: '',
            nameAr: '',
            description: '',
            category: '',
            parentIcd: undefined,
            relatedIcds: [],
            status: 'active',
            notes: ''
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (icd: ICD) => {
        setIsEditMode(true)
        setSelectedIcd(icd)
        setFormData(icd)
        setIsDialogOpen(true)
    }

    const handleDelete = (icd: ICD) => {
        if (confirm(`Are you sure you want to delete ICD ${icd.code}?`)) {
            setIcds(prev => prev.filter(i => i.id !== icd.id))
        }
    }

    const handleSave = () => {
        if (!formData.code || !formData.nameEn) {
            alert('Please fill in required fields')
            return
        }

        if (isEditMode && selectedIcd) {
            setIcds(prev => prev.map(i =>
                i.id === selectedIcd.id
                    ? { ...i, ...formData, updatedAt: new Date() } as ICD
                    : i
            ))
        } else {
            const newIcd: ICD = {
                ...formData as ICD,
                id: generateId(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
            setIcds(prev => [...prev, newIcd])
        }

        setIsDialogOpen(false)
    }

    const categories = ['Infectious diseases', 'Neoplasms', 'Blood disorders', 'Viral infections', 'Mental disorders']

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">ICD Management</h1>
                <p className="text-gray-600">Manage International Classification of Diseases</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search ICD codes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>

                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
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
                            Add ICD
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
                            <TableHead>ICD Code</TableHead>
                            <TableHead>Name (EN)</TableHead>
                            <TableHead>Name (AR)</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Parent ICD</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredIcds.map((icd) => (
                            <TableRow key={icd.id} className="hover:bg-gray-50">
                                <TableCell>
                                    <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-medium">{icd.code}</TableCell>
                                <TableCell>{icd.nameEn}</TableCell>
                                <TableCell className="text-right" dir="rtl">{icd.nameAr}</TableCell>
                                <TableCell>{icd.category}</TableCell>
                                <TableCell>{icd.parentIcd || '-'}</TableCell>
                                <TableCell>
                  <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      icd.status === 'active'
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                  )}>
                    {icd.status}
                  </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(icd)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(icd)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                        >
                                            <Link2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit ICD' : 'Add New ICD'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Update ICD information' : 'Enter ICD details'}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="relations">Relations</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">ICD Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., A00.0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter description"
                                    />
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea
                                        id="notes"
                                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="status"
                                        checked={formData.status === 'active'}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                                        }
                                    />
                                    <Label htmlFor="status">Active</Label>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="relations" className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="parentIcd">Parent ICD</Label>
                                    <Select
                                        value={formData.parentIcd || NO_PARENT_ICD_VALUE}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                parentIcd:
                                                    value === NO_PARENT_ICD_VALUE ? undefined : value
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select parent ICD" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NO_PARENT_ICD_VALUE}>None</SelectItem>
                                            {icds.filter(i => i.id !== formData.id).map(icd => (
                                                <SelectItem key={icd.id} value={icd.id}>
                                                    {icd.code} - {icd.nameEn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Related ICDs</Label>
                                    <div className="border rounded-md p-4">
                                        <p className="text-sm text-gray-600 mb-3">
                                            Add relationships with other ICD codes
                                        </p>
                                        <Button variant="outline" size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Relation
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

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