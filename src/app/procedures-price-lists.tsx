'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Download, Upload, DollarSign, Calendar, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { PriceList, PriceListItem } from '@/types'
import { generateId, formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

interface ProcedurePriceData {
    id: string
    procedureCode: string
    procedureName: string
    insuranceDegree: string
    pointMin: number
    pointMax: number
    activeDate: Date
    providerName?: string
    doctorExperience?: number
    specialistPercentage?: number
    generalPercentage?: number
    discountType?: string
    discountValue?: number
}

export function ProceduresPriceListsPage() {
    const language = useAppStore(state => state.language)
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null)
    const [priceListItems, setPriceListItems] = useState<ProcedurePriceData[]>([])
    const [filteredItems, setFilteredItems] = useState<ProcedurePriceData[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isPriceDetailOpen, setIsPriceDetailOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeView, setActiveView] = useState<'list' | 'procedures' | 'discount'>('list')

    // Form States
    const [priceListForm, setPriceListForm] = useState<Partial<PriceList>>({
        name: '',
        description: '',
        effectiveDate: new Date(),
        region: '',
        providerType: '',
        active: true
    })

    const [priceForm, setPriceForm] = useState<Partial<ProcedurePriceData>>({
        procedureCode: '',
        procedureName: '',
        insuranceDegree: '',
        pointMin: 0,
        pointMax: 0,
        activeDate: new Date(),
        doctorExperience: 0,
        specialistPercentage: 0,
        generalPercentage: 0
    })

    // Sample data - matching the screenshots
    useEffect(() => {
        const samplePriceLists: PriceList[] = [
            {
                id: '26',
                name: 'List Price 2024',
                description: 'Default price list for 2024',
                effectiveDate: new Date('2024-01-01'),
                region: '12',
                active: true
            },
            {
                id: '25',
                name: 'Deduction List',
                description: 'Deduction price list',
                effectiveDate: new Date('2024-01-01'),
                active: true
            },
            {
                id: '24',
                name: 'Medical Center Services Price List',
                description: 'Prices for medical center services',
                effectiveDate: new Date('2024-01-01'),
                active: true
            },
            {
                id: '23',
                name: 'Hospital Service - Tunisia',
                description: 'Tunisia hospital service prices',
                effectiveDate: new Date('2024-01-01'),
                active: true
            },
            {
                id: '22',
                name: 'Doctor List Price - Tunisia',
                description: 'Doctor prices in Tunisia',
                effectiveDate: new Date('2024-01-01'),
                active: true
            },
            {
                id: '20',
                name: 'Audiology Services List Price',
                description: 'Prices for audiology services',
                effectiveDate: new Date('2024-01-01'),
                active: true
            },
            {
                id: '19',
                name: 'Dental Treatment Prices 1999',
                description: 'Historical dental prices from 1999',
                effectiveDate: new Date('1999-01-01'),
                active: false
            },
            {
                id: '18',
                name: 'Hospital Service - Syria',
                description: 'Syria hospital service prices',
                effectiveDate: new Date('2024-01-01'),
                active: true
            },
            {
                id: '17',
                name: 'Dental Prices - Syria',
                description: 'Dental prices in Syria',
                effectiveDate: new Date('2024-01-01'),
                active: true
            }
        ]

        const samplePriceItems: ProcedurePriceData[] = [
            {
                id: '1',
                procedureCode: '17476',
                procedureName: 'Short Arm Cast',
                insuranceDegree: 'Third Degree',
                pointMin: 2.800,
                pointMax: 3.500,
                activeDate: new Date('2025-06-15'),
                providerName: 'Islamic Hospital - Amman',
                doctorExperience: 0,
                specialistPercentage: 0,
                generalPercentage: 0
            },
            {
                id: '2',
                procedureCode: '17457',
                procedureName: 'Metacarpal Fracture Mua And Pinning',
                insuranceDegree: 'Second Degree',
                pointMin: 2.800,
                pointMax: 3.500,
                activeDate: new Date('2025-06-15'),
                providerName: 'Shmeisani Hospital',
                doctorExperience: 0,
                specialistPercentage: 0,
                generalPercentage: 0
            },
            {
                id: '3',
                procedureCode: '17455',
                procedureName: 'Extensor Tendon 1by Repair',
                insuranceDegree: 'First Degree',
                pointMin: 2.800,
                pointMax: 3.500,
                activeDate: new Date('2025-06-15'),
                providerName: 'The Arab Medical Center Hospital',
                doctorExperience: 0,
                specialistPercentage: 0,
                generalPercentage: 0
            },
            {
                id: '4',
                procedureCode: '2964',
                procedureName: 'Doctor Examination',
                insuranceDegree: 'Private Degree',
                pointMin: 2.800,
                pointMax: 3.500,
                activeDate: new Date('2025-06-15'),
                doctorExperience: 0,
                specialistPercentage: 0,
                generalPercentage: 0
            }
        ]

        setPriceLists(samplePriceLists)
        setSelectedPriceList(samplePriceLists[0])
        setPriceListItems(samplePriceItems)
        setFilteredItems(samplePriceItems)
    }, [])

    // Filter items
    useEffect(() => {
        let filtered = priceListItems

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.procedureCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.procedureName.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredItems(filtered)
    }, [searchTerm, priceListItems])

    const handleSelectPriceList = (priceList: PriceList) => {
        setSelectedPriceList(priceList)
        setActiveView('procedures')
    }

    const handleAddPriceList = () => {
        setIsEditMode(false)
        setPriceListForm({
            name: '',
            description: '',
            effectiveDate: new Date(),
            region: '',
            providerType: '',
            active: true
        })
        setIsDialogOpen(true)
    }

    const handleEditProcedurePrice = (item: ProcedurePriceData) => {
        setIsEditMode(true)
        setPriceForm(item)
        setIsPriceDetailOpen(true)
    }

    const handleSavePriceList = () => {
        if (!priceListForm.name) {
            alert('Please enter a name for the price list')
            return
        }

        const newPriceList: PriceList = {
            ...priceListForm as PriceList,
            id: generateId()
        }

        setPriceLists(prev => [...prev, newPriceList])
        setIsDialogOpen(false)
    }

    const handleSavePrice = () => {
        if (!priceForm.procedureCode) {
            alert('Please select a procedure')
            return
        }

        if (isEditMode) {
            setPriceListItems(prev => prev.map(item =>
                item.id === priceForm.id ? { ...item, ...priceForm } as ProcedurePriceData : item
            ))
        } else {
            const newItem: ProcedurePriceData = {
                ...priceForm as ProcedurePriceData,
                id: generateId()
            }
            setPriceListItems(prev => [...prev, newItem])
        }

        setIsPriceDetailOpen(false)
    }

    const providers = [
        'Islamic Hospital - Amman',
        'Shmeisani Hospital',
        'The Arab Medical Center Hospital'
    ]

    const insuranceDegrees = ['Third Degree', 'Second Degree', 'First Degree', 'Private Degree']

    const regions = [
        { value: '12', label: 'Hashemet Kingdom Of Jordan' },
        { value: '13', label: 'Amman' },
        { value: '14', label: 'Irbid' },
        { value: '15', label: 'Zarqa' }
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Header Bar */}
            <div className="bg-tpa-header text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="font-bold">MEDEXA</span>
                    <span className="text-sm">Serena Al Lama</span>
                </div>
                <h2 className="text-lg font-semibold">Procedures Price Lists</h2>
                <div className="text-sm">
                    Health Insurance TPA System
                    <br />
                    Tuesday 11-11-2025
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Panel - Price Lists */}
                <div className="w-80 bg-white border-r">
                    <div className="p-2 border-b bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                            <Label>Provider Type</Label>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Providers</SelectItem>
                                    <SelectItem value="hospital">Hospital</SelectItem>
                                    <SelectItem value="clinic">Clinic</SelectItem>
                                    <SelectItem value="lab">Laboratory</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Region</Label>
                            <Select defaultValue="12">
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {regions.map(region => (
                                        <SelectItem key={region.value} value={region.value}>
                                            {region.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-2">
                        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="list">Prices List</TabsTrigger>
                                <TabsTrigger value="procedures">Procedures</TabsTrigger>
                            </TabsList>

                            <TabsContent value="list" className="mt-2">
                                <div className="space-y-1">
                                    <div className="mb-2">
                                        <Input
                                            placeholder="Search price lists..."
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="text-left p-1">ID</th>
                                                <th className="text-left p-1">Price List</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {priceLists.map(list => (
                                                <tr
                                                    key={list.id}
                                                    className={`cursor-pointer hover:bg-blue-50 ${selectedPriceList?.id === list.id ? 'bg-blue-100' : ''}`}
                                                    onClick={() => handleSelectPriceList(list)}
                                                >
                                                    <td className="p-1">{list.id}</td>
                                                    <td className="p-1">{list.name}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="procedures" className="mt-2">
                                <div className="space-y-1">
                                    <div className="mb-2">
                                        <Input
                                            placeholder="Search procedures..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="text-left p-1">ID</th>
                                                <th className="text-left p-1">Procedure</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filteredItems.map(item => (
                                                <tr
                                                    key={item.id}
                                                    className="cursor-pointer hover:bg-blue-50"
                                                    onClick={() => handleEditProcedurePrice(item)}
                                                >
                                                    <td className="p-1">{item.procedureCode}</td>
                                                    <td className="p-1">{item.procedureName}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Right Panel - Details */}
                <div className="flex-1 bg-gray-50 p-4">
                    {selectedPriceList ? (
                        <div className="bg-white rounded shadow p-4">
                            {/* Tab Bar */}
                            <Tabs defaultValue="info" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="info">Prices List Info</TabsTrigger>
                                    <TabsTrigger value="level">Price List Level</TabsTrigger>
                                    <TabsTrigger value="prices">Procedure's Prices</TabsTrigger>
                                    <TabsTrigger value="percentage">Procedure Price Percentage</TabsTrigger>
                                    <TabsTrigger value="discount">Procedure Price Discount</TabsTrigger>
                                </TabsList>

                                <TabsContent value="info">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-2 text-sm">
                                            <div>Price List ID: <strong>{selectedPriceList.id}</strong></div>
                                            <div>Description - English: <strong>{selectedPriceList.name}</strong></div>
                                            <div>Description - Arabic: <strong>قائمة الأسعار {selectedPriceList.id}</strong></div>
                                            <div>Region: <strong>{regions.find(r => r.value === selectedPriceList.region)?.label}</strong></div>
                                            <div>Medical Provider Type: <strong>Clinic</strong></div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={true} readOnly />
                                            <Label>Default Price List</Label>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="level">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-2 text-sm">
                                            <div>Default Price List Level</div>
                                            <div className="mt-2">
                                                <strong>Medical Provider: Islamic Hospital - Amman, Start Date: 01/11/2018 00:00:00, Doctor Experience: 0, Specialist Physician Percentage: 0</strong>
                                            </div>
                                            <div>Medical Provider: Shmeisani Hospital</div>
                                            <div>Medical Provider: The Arab Medical Center Hospital</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="id">Id</Label>
                                                <Input id="id" value="677" readOnly />
                                            </div>
                                            <div className="col-span-2">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Insurance Degree</TableHead>
                                                            <TableHead>Point Min. Price</TableHead>
                                                            <TableHead>Point Max. Price</TableHead>
                                                            <TableHead>Active Date</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell>Third Degree</TableCell>
                                                            <TableCell>2.800</TableCell>
                                                            <TableCell>3.500</TableCell>
                                                            <TableCell>15/06/2025</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>Second Degree</TableCell>
                                                            <TableCell>2.800</TableCell>
                                                            <TableCell>3.500</TableCell>
                                                            <TableCell>15/06/2025</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>First Degree</TableCell>
                                                            <TableCell>2.800</TableCell>
                                                            <TableCell>3.500</TableCell>
                                                            <TableCell>15/06/2025</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>Private Degree</TableCell>
                                                            <TableCell>2.800</TableCell>
                                                            <TableCell>3.500</TableCell>
                                                            <TableCell>15/06/2025</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="prices">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-2 text-sm">
                                            <div>Procedure: <strong>Doctor Examination</strong></div>
                                            <div>Price Level: Default Price List Level</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Price Type</Label>
                                                <Select defaultValue="fixed">
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Fixed</SelectItem>
                                                        <SelectItem value="percentage">Percentage</SelectItem>
                                                        <SelectItem value="points">Points</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input type="date" defaultValue="2025-06-15" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input type="date" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Min. Price</Label>
                                                <Input type="number" defaultValue="30.000" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Max. Price</Label>
                                                <Input type="number" defaultValue="15.000" />
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button className="bg-tpa-primary hover:bg-tpa-accent">
                                                Update Price
                                            </Button>
                                            <Button variant="outline">
                                                History
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="percentage">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-2 text-sm">
                                            <div>Procedure's Price Specialty Type: Specialist Doctor, Specialty Id: Internist Doctor, Doctor Experience: 0, Specialist Physician Percentage: 0</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Specialty Type</Label>
                                                <Select defaultValue="general">
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="general">General Doctor</SelectItem>
                                                        <SelectItem value="specialist">Specialist Doctor</SelectItem>
                                                        <SelectItem value="consultant">Consultant</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Doctor Experience</Label>
                                                <Input type="number" defaultValue="0" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Specialist Physician Percentage</Label>
                                                <Input type="number" defaultValue="0" suffix="%" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>General Physician Percentage</Label>
                                                <Input type="number" defaultValue="0" suffix="%" />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="discount">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-2 text-sm">
                                            <div>Procedure's Price Specialty Type: Specialist Doctor, Specialty Id: Internist Doctor, Doctor Experience: 0, Specialist Physician Percentage: 0</div>
                                        </div>

                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Id</TableHead>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead>Period Type</TableHead>
                                                    <TableHead>Discount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>730</TableCell>
                                                    <TableCell>10</TableCell>
                                                    <TableCell>Day</TableCell>
                                                    <TableCell>50</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>729</TableCell>
                                                    <TableCell>5</TableCell>
                                                    <TableCell>Day</TableCell>
                                                    <TableCell>100</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>

                                        <div className="border-t pt-4">
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Id</Label>
                                                    <Input type="number" defaultValue="730" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Period</Label>
                                                    <Input type="number" defaultValue="10" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Period Type</Label>
                                                    <Select defaultValue="day">
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="day">Day</SelectItem>
                                                            <SelectItem value="week">Week</SelectItem>
                                                            <SelectItem value="month">Month</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Discount %</Label>
                                                    <Input type="number" defaultValue="50.000" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a price list to view details
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="bg-gray-200 border-t px-4 py-2 flex items-center justify-between">
                <div className="flex gap-2">
                    <Button size="sm" variant="outline">Add</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Delete</Button>
                    <Button size="sm" variant="outline">Save</Button>
                    <Button size="sm" variant="outline">Print</Button>
                    <Button size="sm" variant="outline">Search</Button>
                    <Button size="sm" variant="outline">Exe Search</Button>
                    <Button size="sm" variant="outline">Cancel</Button>
                    <Button size="sm" variant="outline">Exit</Button>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <span>Record: 1/7</span>
                </div>
            </div>
        </div>
    )
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}