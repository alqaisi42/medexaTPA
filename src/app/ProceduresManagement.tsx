'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Download, Upload, DollarSign, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Procedure, ProcedureCategory, ICD } from '@/types'
import { generateId, formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

export function ProceduresManagementPage() {
    const language = useAppStore(state => state.language)
    const [procedures, setProcedures] = useState<Procedure[]>([])
    const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([])
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterSpecialty, setFilterSpecialty] = useState('all')

    // Procedure Form State
    const [formData, setFormData] = useState<Partial<Procedure>>({
        code: '',
        nameEn: '',
        nameAr: '',
        description: '',
        category: 'consultation',
        specialty: '',
        referencePrice: 0,
        unitOfMeasure: 'session',
        linkedIcds: [],
        genderRestriction: 'both',
        status: 'active'
    })

    // Sample data
    useEffect(() => {
        const sampleData: Procedure[] = [
            {
                id: '1',
                code: '17476',
                nameEn: 'Short Arm Cast',
                nameAr: 'جبيرة ذراع قصيرة',
                description: 'Application of short arm cast',
                category: 'surgery',
                specialty: 'Orthopedics',
                referencePrice: 150.00,
                unitOfMeasure: 'procedure',
                linkedIcds: ['S62.0', 'S62.1'],
                genderRestriction: 'both',
                status: 'active',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: '2',
                code: '17457',
                nameEn: 'Metacarpal Fracture MUA and Pinning',
                nameAr: 'كسر مشط اليد مع التثبيت',
                description: 'Manipulation under anesthesia and pinning for metacarpal fracture',
                category: 'surgery',
                specialty: 'Orthopedics',
                referencePrice: 2800.00,
                unitOfMeasure: 'procedure',
                linkedIcds: ['S62.3'],
                genderRestriction: 'both',
                status: 'active',
                createdAt: new Date('2024-01-02'),
                updatedAt: new Date('2024-01-02')
            },
            {
                id: '3',
                code: '2964',
                nameEn: 'Doctor Examination',
                nameAr: 'فحص الطبيب',
                description: 'General doctor consultation and examination',
                category: 'consultation',
                specialty: 'General Practice',
                referencePrice: 30.00,
                unitOfMeasure: 'visit',
                linkedIcds: [],
                genderRestriction: 'both',
                minAge: 0,
                maxAge: 120,
                status: 'active',
                createdAt: new Date('2024-01-03'),
                updatedAt: new Date('2024-01-03')
            },
            {
                id: '4',
                code: '80061',
                nameEn: 'Lipid Panel',
                nameAr: 'فحص الدهون الشامل',
                description: 'Complete lipid profile test',
                category: 'lab',
                specialty: 'Laboratory',
                referencePrice: 45.00,
                unitOfMeasure: 'test',
                linkedIcds: ['E78.0', 'E78.1', 'E78.5'],
                genderRestriction: 'both',
                status: 'active',
                createdAt: new Date('2024-01-04'),
                updatedAt: new Date('2024-01-04')
            },
            {
                id: '5',
                code: '71020',
                nameEn: 'Chest X-Ray',
                nameAr: 'أشعة الصدر',
                description: 'Radiologic examination of chest',
                category: 'imaging',
                specialty: 'Radiology',
                referencePrice: 75.00,
                unitOfMeasure: 'scan',
                linkedIcds: ['J18.9', 'R06.0'],
                genderRestriction: 'both',
                status: 'active',
                createdAt: new Date('2024-01-05'),
                updatedAt: new Date('2024-01-05')
            }
        ]
        setProcedures(sampleData)
        setFilteredProcedures(sampleData)
    }, [])

    // Filter Procedures
    useEffect(() => {
        let filtered = procedures

        if (searchTerm) {
            filtered = filtered.filter(proc =>
                proc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                proc.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                proc.nameAr.includes(searchTerm)
            )
        }

        if (filterCategory !== 'all') {
            filtered = filtered.filter(proc => proc.category === filterCategory)
        }

        if (filterSpecialty !== 'all') {
            filtered = filtered.filter(proc => proc.specialty === filterSpecialty)
        }

        setFilteredProcedures(filtered)
    }, [searchTerm, filterCategory, filterSpecialty, procedures])

    const handleAdd = () => {
        setIsEditMode(false)
        setFormData({
            code: '',
            nameEn: '',
            nameAr: '',
            description: '',
            category: 'consultation',
            specialty: '',
            referencePrice: 0,
            unitOfMeasure: 'session',
            linkedIcds: [],
            genderRestriction: 'both',
            status: 'active'
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (procedure: Procedure) => {
        setIsEditMode(true)
        setSelectedProcedure(procedure)
        setFormData(procedure)
        setIsDialogOpen(true)
    }

    const handleDelete = (procedure: Procedure) => {
        if (confirm(`Are you sure you want to delete procedure ${procedure.code}?`)) {
            setProcedures(prev => prev.filter(p => p.id !== procedure.id))
        }
    }

    const handleSave = () => {
        if (!formData.code || !formData.nameEn || !formData.specialty) {
            alert('Please fill in required fields')
            return
        }

        if (isEditMode && selectedProcedure) {
            setProcedures(prev => prev.map(p =>
                p.id === selectedProcedure.id
                    ? { ...p, ...formData, updatedAt: new Date() } as Procedure
                    : p
            ))
        } else {
            const newProcedure: Procedure = {
                ...formData as Procedure,
                id: generateId(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
            setProcedures(prev => [...prev, newProcedure])
        }

        setIsDialogOpen(false)
    }

    const categories: ProcedureCategory[] = ['surgery', 'lab', 'imaging', 'consultation', 'therapy', 'emergency']
    const specialties = ['Orthopedics', 'General Practice', 'Laboratory', 'Radiology', 'Cardiology', 'Neurology', 'Pediatrics']
    const units = ['procedure', 'visit', 'test', 'scan', 'session', 'hour', 'day']

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Procedures Management</h1>
                <p className="text-gray-600">Manage medical procedures and services</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search procedures..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>

                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Specialties" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Specialties</SelectItem>
                                {specialties.map(spec => (
                                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                ))}
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
                            Add Procedure
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
                            <TableHead>Category</TableHead>
                            <TableHead>Specialty</TableHead>
                            <TableHead>Reference Price</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProcedures.map((procedure) => (
                            <TableRow key={procedure.id} className="hover:bg-gray-50">
                                <TableCell>
                                    <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-medium">{procedure.code}</TableCell>
                                <TableCell>{procedure.nameEn}</TableCell>
                                <TableCell className="text-right" dir="rtl">{procedure.nameAr}</TableCell>
                                <TableCell>
                                    <span className="capitalize">{procedure.category}</span>
                                </TableCell>
                                <TableCell>{procedure.specialty}</TableCell>
                                <TableCell>{formatCurrency(procedure.referencePrice)}</TableCell>
                                <TableCell>{procedure.unitOfMeasure}</TableCell>
                                <TableCell>
                  <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      procedure.status === 'active'
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                  )}>
                    {procedure.status}
                  </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(procedure)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(procedure)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                        >
                                            <DollarSign className="h-4 w-4" />
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
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Update procedure information' : 'Enter procedure details'}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing & Units</TabsTrigger>
                            <TabsTrigger value="restrictions">Restrictions & Links</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Procedure Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., 17476"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value as ProcedureCategory })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>
                                                    <span className="capitalize">{cat}</span>
                                                </SelectItem>
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

                                <div className="space-y-2">
                                    <Label htmlFor="specialty">Specialty *</Label>
                                    <Select
                                        value={formData.specialty}
                                        onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select specialty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {specialties.map(spec => (
                                                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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

                        <TabsContent value="pricing" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="referencePrice">Reference Price *</Label>
                                    <Input
                                        id="referencePrice"
                                        type="number"
                                        value={formData.referencePrice}
                                        onChange={(e) => setFormData({ ...formData, referencePrice: parseFloat(e.target.value) })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                                    <Select
                                        value={formData.unitOfMeasure}
                                        onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(unit => (
                                                <SelectItem key={unit} value={unit}>
                                                    <span className="capitalize">{unit}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-gray-50">
                                <h4 className="font-medium mb-3">Price List Management</h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    Define different prices for various providers and insurance plans
                                </p>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Price List Entry
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="restrictions" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="genderRestriction">Gender Restriction</Label>
                                    <Select
                                        value={formData.genderRestriction}
                                        onValueChange={(value) => setFormData({ ...formData, genderRestriction: value as 'male' | 'female' | 'both' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="both">Both</SelectItem>
                                            <SelectItem value="male">Male Only</SelectItem>
                                            <SelectItem value="female">Female Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="minAge">Min Age</Label>
                                        <Input
                                            id="minAge"
                                            type="number"
                                            value={formData.minAge || ''}
                                            onChange={(e) => setFormData({ ...formData, minAge: parseInt(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maxAge">Max Age</Label>
                                        <Input
                                            id="maxAge"
                                            type="number"
                                            value={formData.maxAge || ''}
                                            onChange={(e) => setFormData({ ...formData, maxAge: parseInt(e.target.value) })}
                                            placeholder="120"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Linked ICDs</Label>
                                <div className="border rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-3">
                                        Link this procedure with relevant ICD codes
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.linkedIcds?.map((icd, index) => (
                                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {icd}
                                                <button
                                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                                    onClick={() => {
                                                        const newIcds = formData.linkedIcds?.filter((_, i) => i !== index)
                                                        setFormData({ ...formData, linkedIcds: newIcds })
                                                    }}
                                                >
                          ×
                        </button>
                      </span>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Link className="h-4 w-4 mr-2" />
                                        Add ICD Link
                                    </Button>
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