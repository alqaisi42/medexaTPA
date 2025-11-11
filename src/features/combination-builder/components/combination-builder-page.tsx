'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Download, Upload, Grid3X3, Copy, Settings, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { CombinationRule, CombinationType, CombinationFactor } from '@/types'
import { generateId, formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

export function CombinationBuilderPage() {
    const language = useAppStore(state => state.language)
    const [combinations, setCombinations] = useState<CombinationRule[]>([])
    const [filteredCombinations, setFilteredCombinations] = useState<CombinationRule[]>([])
    const [selectedCombination, setSelectedCombination] = useState<CombinationRule | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [combinationType, setCombinationType] = useState<CombinationType>('procedure_pricing')
    const [isMatrixView, setIsMatrixView] = useState(false)

    // Combination Form State
    const [formData, setFormData] = useState<Partial<CombinationRule>>({
        type: 'procedure_pricing',
        factors: [],
        value: 0,
        isDefault: false,
        effectiveDate: new Date(),
        priority: 1
    })

    const ANY_OPTION_VALUE = 'any'

    const [selectedFactors, setSelectedFactors] = useState<{
        provider?: string
        procedure?: string
        insuranceDegree?: string
        icd?: string
        gender?: string
        ageRange?: string
    }>({})

    const updateSelectedFactor = <K extends keyof typeof selectedFactors>(
        factor: K,
        value: string
    ) => {
        setSelectedFactors(prev => {
            const next = { ...prev }

            if (value === ANY_OPTION_VALUE) {
                delete next[factor]
            } else {
                next[factor] = value
            }

            return next
        })
    }

    // Sample data
    useEffect(() => {
        const sampleData: CombinationRule[] = [
            {
                id: '1',
                type: 'procedure_pricing',
                factors: [
                    { factorType: 'provider', factorValue: 'Islamic Hospital - Amman' },
                    { factorType: 'procedure', factorValue: '2964' },
                    { factorType: 'insurance_degree', factorValue: 'Third Degree' }
                ],
                value: 30.000,
                isDefault: false,
                effectiveDate: new Date('2025-06-15'),
                priority: 1
            },
            {
                id: '2',
                type: 'procedure_pricing',
                factors: [
                    { factorType: 'provider', factorValue: 'Shmeisani Hospital' },
                    { factorType: 'procedure', factorValue: '2964' },
                    { factorType: 'insurance_degree', factorValue: 'Second Degree' }
                ],
                value: 35.500,
                isDefault: false,
                effectiveDate: new Date('2025-06-15'),
                priority: 1
            },
            {
                id: '3',
                type: 'procedure_pricing',
                factors: [
                    { factorType: 'provider', factorValue: 'The Arab Medical Center Hospital' },
                    { factorType: 'procedure', factorValue: '2964' },
                    { factorType: 'insurance_degree', factorValue: 'First Degree' }
                ],
                value: 45.500,
                isDefault: false,
                effectiveDate: new Date('2025-06-15'),
                priority: 1
            },
            {
                id: '4',
                type: 'authorization_rule',
                factors: [
                    { factorType: 'procedure', factorValue: '17476' },
                    { factorType: 'icd', factorValue: 'S62.0' }
                ],
                value: true, // Auth required
                isDefault: false,
                effectiveDate: new Date('2025-01-01'),
                priority: 2
            },
            {
                id: '5',
                type: 'limit_rule',
                factors: [
                    { factorType: 'procedure', factorValue: '80061' },
                    { factorType: 'insurance_degree', factorValue: 'Bronze' }
                ],
                value: 2, // Max 2 per year
                isDefault: false,
                effectiveDate: new Date('2025-01-01'),
                priority: 3
            }
        ]
        setCombinations(sampleData)
        setFilteredCombinations(sampleData)
    }, [])

    // Filter combinations
    useEffect(() => {
        let filtered = combinations.filter(c => c.type === combinationType)

        if (searchTerm) {
            filtered = filtered.filter(combination =>
                combination.factors.some(f =>
                    f.factorValue.toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
        }

        setFilteredCombinations(filtered)
    }, [searchTerm, combinationType, combinations])

    const handleAdd = () => {
        setIsEditMode(false)
        setFormData({
            type: combinationType,
            factors: [],
            value: 0,
            isDefault: false,
            effectiveDate: new Date(),
            priority: 1
        })
        setSelectedFactors({})
        setIsDialogOpen(true)
    }

    const handleEdit = (combination: CombinationRule) => {
        setIsEditMode(true)
        setSelectedCombination(combination)
        setFormData(combination)

        // Parse factors back to selected factors
        const factors: any = {}
        combination.factors.forEach(f => {
            factors[f.factorType] = f.factorValue
        })
        setSelectedFactors(factors)

        setIsDialogOpen(true)
    }

    const handleDelete = (combination: CombinationRule) => {
        if (confirm('Are you sure you want to delete this combination?')) {
            setCombinations(prev => prev.filter(c => c.id !== combination.id))
        }
    }

    const handleSave = () => {
        const factors: CombinationFactor[] = Object.entries(selectedFactors)
            .filter(([_, value]) => value)
            .map(([type, value]) => ({
                factorType: type,
                factorValue: value as string
            }))

        if (factors.length === 0) {
            alert('Please select at least one factor')
            return
        }

        const newCombination: CombinationRule = {
            ...formData as CombinationRule,
            id: isEditMode ? selectedCombination!.id : generateId(),
            factors,
            type: combinationType
        }

        if (isEditMode) {
            setCombinations(prev => prev.map(c =>
                c.id === selectedCombination!.id ? newCombination : c
            ))
        } else {
            setCombinations(prev => [...prev, newCombination])
        }

        setIsDialogOpen(false)
    }

    const generateCrossProduct = () => {
        // This would generate all possible combinations
        alert('Cross-product generation would create all possible combinations based on selected factors')
    }

    const renderFactorPills = (factors: CombinationFactor[]) => {
        return factors.map((factor, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1">
        {factor.factorType}: {factor.factorValue}
      </span>
        ))
    }

    const renderValue = (combination: CombinationRule) => {
        switch (combination.type) {
            case 'procedure_pricing':
                return formatCurrency(combination.value as number)
            case 'authorization_rule':
                return combination.value ? 'Required' : 'Not Required'
            case 'limit_rule':
                return `${combination.value} per year`
            case 'coverage_rule':
                return `${combination.value}%`
            default:
                return combination.value
        }
    }

    // Sample data for dropdowns
    const providers = [
        'Islamic Hospital - Amman',
        'Shmeisani Hospital',
        'The Arab Medical Center Hospital',
        'Jordan Hospital',
        'Al-Khalidi Medical Center'
    ]

    const procedures = [
        { code: '2964', name: 'Doctor Examination' },
        { code: '17476', name: 'Short Arm Cast' },
        { code: '17457', name: 'Metacarpal Fracture MUA' },
        { code: '80061', name: 'Lipid Panel' },
        { code: '71020', name: 'Chest X-Ray' }
    ]

    const insuranceDegrees = ['First Degree', 'Second Degree', 'Third Degree', 'Private Degree']

    const icds = ['S62.0', 'S62.1', 'S62.3', 'E78.0', 'J18.9']

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Combination Builder</h1>
                <p className="text-gray-600">Define dynamic rules and pricing combinations using cross-product matrix</p>
            </div>

            {/* Combination Type Selector */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Grid3X3 className="h-6 w-6 text-tpa-primary" />
                        <Select value={combinationType} onValueChange={(value) => setCombinationType(value as CombinationType)}>
                            <SelectTrigger className="w-64">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="procedure_pricing">Procedure Pricing</SelectItem>
                                <SelectItem value="authorization_rule">Authorization Rules</SelectItem>
                                <SelectItem value="limit_rule">Limit Rules</SelectItem>
                                <SelectItem value="coverage_rule">Coverage Rules</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMatrixView(!isMatrixView)}
                        >
                            <Calculator className="h-4 w-4 mr-2" />
                            {isMatrixView ? 'Table View' : 'Matrix View'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateCrossProduct}
                        >
                            <Grid3X3 className="h-4 w-4 mr-2" />
                            Generate Cross Product
                        </Button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search combinations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </Button>
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
                            Add Combination
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data View */}
            {!isMatrixView ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <input type="checkbox" className="rounded" />
                                </TableHead>
                                <TableHead>Factors</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Default</TableHead>
                                <TableHead>Effective Date</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCombinations.map((combination) => (
                                <TableRow key={combination.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <input type="checkbox" className="rounded" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {renderFactorPills(combination.factors)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {renderValue(combination)}
                                    </TableCell>
                                    <TableCell>
                                        {combination.isDefault && (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Default
                      </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(combination.effectiveDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{combination.priority}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(combination)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(combination)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                // Matrix View
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="overflow-auto">
                        <table className="min-w-full border">
                            <thead>
                            <tr className="bg-gray-50">
                                <th className="border p-2 text-left">Provider</th>
                                <th className="border p-2 text-left">Procedure</th>
                                <th className="border p-2 text-center">First Degree</th>
                                <th className="border p-2 text-center">Second Degree</th>
                                <th className="border p-2 text-center">Third Degree</th>
                                <th className="border p-2 text-center">Private Degree</th>
                            </tr>
                            </thead>
                            <tbody>
                            {providers.slice(0, 3).map(provider => (
                                procedures.slice(0, 3).map(procedure => (
                                    <tr key={`${provider}-${procedure.code}`} className="hover:bg-gray-50">
                                        <td className="border p-2">{provider}</td>
                                        <td className="border p-2">{procedure.code} - {procedure.name}</td>
                                        {insuranceDegrees.map(degree => {
                                            const combination = combinations.find(c =>
                                                c.factors.some(f => f.factorValue === provider) &&
                                                c.factors.some(f => f.factorValue === procedure.code) &&
                                                c.factors.some(f => f.factorValue === degree)
                                            )
                                            return (
                                                <td key={degree} className="border p-2 text-center">
                                                    {combination ? formatCurrency(combination.value as number) : '-'}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                        <p>Matrix view shows cross-product of selected factors. Click cells to edit values directly.</p>
                    </div>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit Combination' : 'Add New Combination'}
                        </DialogTitle>
                        <DialogDescription>
                            Define factors and values for this combination rule
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="factors" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="factors">Factors</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="factors" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provider</Label>
                                    <Select
                                        value={selectedFactors.provider ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('provider', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {providers.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="procedure">Procedure</Label>
                                    <Select
                                        value={selectedFactors.procedure ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('procedure', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select procedure" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {procedures.map(p => (
                                                <SelectItem key={p.code} value={p.code}>
                                                    {p.code} - {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="insuranceDegree">Insurance Degree</Label>
                                    <Select
                                        value={selectedFactors.insuranceDegree ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('insuranceDegree', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select degree" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {insuranceDegrees.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="icd">ICD Code</Label>
                                    <Select
                                        value={selectedFactors.icd ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('icd', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ICD" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            {icds.map(icd => (
                                                <SelectItem key={icd} value={icd}>{icd}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={selectedFactors.gender ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('gender', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ageRange">Age Range</Label>
                                    <Select
                                        value={selectedFactors.ageRange ?? ANY_OPTION_VALUE}
                                        onValueChange={(value) => updateSelectedFactor('ageRange', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select age range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ANY_OPTION_VALUE}>Any</SelectItem>
                                            <SelectItem value="0-18">0-18 years</SelectItem>
                                            <SelectItem value="19-35">19-35 years</SelectItem>
                                            <SelectItem value="36-60">36-60 years</SelectItem>
                                            <SelectItem value="60+">60+ years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <Label className="text-sm text-gray-600">Selected Factors:</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {Object.entries(selectedFactors)
                                        .filter(([_, value]) => value)
                                        .map(([type, value]) => (
                                            <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {type}: {value}
                      </span>
                                        ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="value">
                                        {combinationType === 'procedure_pricing' ? 'Price' :
                                            combinationType === 'authorization_rule' ? 'Authorization Required' :
                                                combinationType === 'limit_rule' ? 'Limit Value' :
                                                    'Coverage Percentage'}
                                    </Label>
                                    {combinationType === 'authorization_rule' ? (
                                        <Select
                                            value={formData.value?.toString()}
                                            onValueChange={(value) => setFormData({ ...formData, value: value === 'true' })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">Required</SelectItem>
                                                <SelectItem value="false">Not Required</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="value"
                                            type="number"
                                            value={formData.value as number}
                                            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                            placeholder="0.00"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                        placeholder="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="effectiveDate">Effective Date</Label>
                                    <Input
                                        id="effectiveDate"
                                        type="date"
                                        value={formData.effectiveDate ? new Date(formData.effectiveDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, effectiveDate: new Date(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                                    <Input
                                        id="expiryDate"
                                        type="date"
                                        value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value ? new Date(e.target.value) : undefined })}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isDefault"
                                        checked={formData.isDefault}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isDefault: checked })
                                        }
                                    />
                                    <Label htmlFor="isDefault">Set as Default</Label>
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