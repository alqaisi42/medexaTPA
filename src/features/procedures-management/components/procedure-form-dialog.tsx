import React, {RefObject} from 'react'
import {Loader2, Search} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Textarea} from '@/components/ui/textarea'
import {cn} from '@/lib/utils'
import {CreateProcedurePayload, ICD, ProcedureCategoryRecord} from '@/types'

const CLINICAL_SEVERITY_OPTIONS = ['LOW', 'MODERATE', 'HIGH'] as const
const CLINICAL_RISK_OPTIONS = ['MINOR', 'MAJOR', 'COMPLEX'] as const
const ANESTHESIA_LEVEL_OPTIONS = ['NONE', 'LOCAL', 'GENERAL'] as const
const OPERATION_TYPE_OPTIONS = ['OPEN', 'LAP', 'ENDO'] as const
const OPERATION_ROOM_OPTIONS = ['MINOR', 'MEDIUM', 'MAJOR'] as const
const GENDER_OPTIONS = ['ANY', 'M', 'F'] as const
const ICD_VALIDATION_OPTIONS = ['STRICT', 'RELAXED'] as const
const YES_NO_OPTIONS = [
    {label: 'Not specified', value: ''},
    {label: 'Yes', value: 'true'},
    {label: 'No', value: 'false'},
]

export interface ProcedureFormDialogProps {
    open: boolean
    mode: 'create' | 'edit'
    formData: CreateProcedurePayload
    formError: string | null
    isSaving: boolean
    icdResults: ICD[]
    icdDropdownOpen: boolean
    icdDropdownRef: RefObject<HTMLDivElement>
    icdSearchError: string | null
    icdSearchLoading: boolean
    icdSearchTerm: string
    clinicalCategoryDropdownOpen: boolean
    clinicalCategoryDropdownRef: RefObject<HTMLDivElement>
    clinicalCategoryQuery: string
    filteredClinicalCategories: ProcedureCategoryRecord[]
    filteredSubCategories: ProcedureCategoryRecord[]
    subCategoryDropdownOpen: boolean
    subCategoryDropdownRef: RefObject<HTMLDivElement>
    subCategoryQuery: string
    onFormDataChange: React.Dispatch<React.SetStateAction<CreateProcedurePayload>>
    onOpenChange: (open: boolean) => void
    onSearchIcds: () => Promise<void> | void
    onIcdSearchTermChange: (value: string) => void
    onIcdDropdownOpenChange: (open: boolean) => void
    onClinicalCategoryDropdownChange: (open: boolean) => void
    onClinicalCategoryQueryChange: (value: string) => void
    onSubCategoryDropdownChange: (open: boolean) => void
    onSubCategoryQueryChange: (value: string) => void
    onSave: () => void
}

export function ProcedureFormDialog({
                                        open,
                                        mode,
                                        formData,
                                        formError,
                                        isSaving,
                                        icdResults,
                                        icdDropdownOpen,
                                        icdDropdownRef,
                                        icdSearchError,
                                        icdSearchLoading,
                                        icdSearchTerm,
                                        clinicalCategoryDropdownOpen,
                                        clinicalCategoryDropdownRef,
                                        clinicalCategoryQuery,
                                        filteredClinicalCategories,
                                        filteredSubCategories,
                                        subCategoryDropdownOpen,
                                        subCategoryDropdownRef,
                                        subCategoryQuery,
                                        onFormDataChange,
                                        onOpenChange,
                                        onSearchIcds,
                                        onIcdSearchTermChange,
                                        onIcdDropdownOpenChange,
                                        onClinicalCategoryDropdownChange,
                                        onClinicalCategoryQueryChange,
                                        onSubCategoryDropdownChange,
                                        onSubCategoryQueryChange,
                                        onSave,
                                    }: ProcedureFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle>
                    <DialogDescription>Provide procedure master data and pricing information.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <TabsList className="flex h-full w-full flex-col gap-2 rounded-lg bg-gray-50 p-2 md:w-56">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="clinical">Clinical Context</TabsTrigger>
                            <TabsTrigger value="pricing">Coverage &amp; Pricing</TabsTrigger>
                            <TabsTrigger value="ownership">Ownership &amp; Audit</TabsTrigger>
                        </TabsList>

                        <div className="flex-1">
                            <TabsContent value="basic" className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="systemCode">System Code *</Label>
                                        <Input
                                            id="systemCode"
                                            value={formData.systemCode}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, systemCode: event.target.value}))
                                            }
                                            placeholder="Enter system code"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Procedure Code *</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, code: event.target.value}))
                                            }
                                            placeholder="Enter procedure code"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="nameEn">Name (English) *</Label>
                                        <Input
                                            id="nameEn"
                                            value={formData.nameEn}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, nameEn: event.target.value}))
                                            }
                                            placeholder="Enter English name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="nameAr">Name (Arabic) *</Label>
                                        <Input
                                            id="nameAr"
                                            value={formData.nameAr}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, nameAr: event.target.value}))
                                            }
                                            placeholder="Enter Arabic name"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                                        <Input
                                            id="unitOfMeasure"
                                            value={formData.unitOfMeasure}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    unitOfMeasure: event.target.value
                                                }))
                                            }
                                            placeholder="E.g. session, visit, unit"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="referencePrice">Reference Price *</Label>
                                        <Input
                                            id="referencePrice"
                                            type="number"
                                            value={formData.referencePrice}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    referencePrice: Number(event.target.value)
                                                }))
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="validFrom">Valid From *</Label>
                                        <Input
                                            id="validFrom"
                                            type="date"
                                            value={formData.validFrom}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, validFrom: event.target.value}))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="validTo">Valid To *</Label>
                                        <Input
                                            id="validTo"
                                            type="date"
                                            value={formData.validTo}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, validTo: event.target.value}))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="minIntervalDays">Min Interval Days</Label>
                                        <Input
                                            id="minIntervalDays"
                                            type="number"
                                            min="0"
                                            value={formData.minIntervalDays}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    minIntervalDays: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxFrequencyPerYear">Max Frequency / Year</Label>
                                        <Input
                                            id="maxFrequencyPerYear"
                                            type="number"
                                            min="0"
                                            value={formData.maxFrequencyPerYear}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    maxFrequencyPerYear: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="standardDurationMinutes">Standard Duration (min)</Label>
                                        <Input
                                            id="standardDurationMinutes"
                                            type="number"
                                            min="0"
                                            value={formData.standardDurationMinutes}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    standardDurationMinutes: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                            <Label htmlFor="isSurgical">Is Surgical</Label>
                                            <p className="text-xs text-gray-500">Mark if procedure is surgical.</p>
                                        </div>
                                        <Switch
                                            id="isSurgical"
                                            checked={formData.isSurgical}
                                            onCheckedChange={(checked) =>
                                                onFormDataChange((prev) => ({...prev, isSurgical: checked}))
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                            <Label htmlFor="requiresAuthorization">Requires Authorization</Label>
                                            <p className="text-xs text-gray-500">Pre-authorization before service</p>
                                        </div>
                                        <Switch
                                            id="requiresAuthorization"
                                            checked={formData.requiresAuthorization}
                                            onCheckedChange={(checked) =>
                                                onFormDataChange((prev) => ({...prev, requiresAuthorization: checked}))
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                            <Label htmlFor="requiresAnesthesia">Requires Anesthesia</Label>
                                            <p className="text-xs text-gray-500">Requires anesthesia support</p>
                                        </div>
                                        <Switch
                                            id="requiresAnesthesia"
                                            checked={formData.requiresAnesthesia}
                                            onCheckedChange={(checked) =>
                                                onFormDataChange((prev) => ({...prev, requiresAnesthesia: checked}))
                                            }
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="clinical" className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicalCategory">Clinical Category</Label>
                                        <div className="relative" ref={clinicalCategoryDropdownRef}>
                                            <Input
                                                id="clinicalCategory"
                                                value={formData.clinicalCategory ?? ''}
                                                onChange={(event) =>
                                                    onFormDataChange((prev) => ({
                                                        ...prev,
                                                        clinicalCategory: event.target.value,
                                                    }))
                                                }
                                                onFocus={() => onClinicalCategoryDropdownChange(true)}
                                                placeholder="Search or select category"
                                            />
                                            <div className="absolute right-2 top-2.5 text-gray-400">
                                                <Search className="h-4 w-4"/>
                                            </div>
                                            {clinicalCategoryDropdownOpen && (
                                                <div
                                                    className="absolute z-10 mt-2 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-lg">
                                                    <div className="p-2">
                                                        <Input
                                                            value={clinicalCategoryQuery}
                                                            onChange={(event) => onClinicalCategoryQueryChange(event.target.value)}
                                                            placeholder="Filter categories"
                                                        />
                                                    </div>
                                                    <div className="divide-y">
                                                        {filteredClinicalCategories.map((category) => (
                                                            <button
                                                                key={category.id}
                                                                type="button"
                                                                className={cn(
                                                                    'flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50',
                                                                    formData.clinicalCategory === category.code && 'bg-gray-100',
                                                                )}
                                                                onClick={() => {
                                                                    onFormDataChange((prev) => ({
                                                                        ...prev,
                                                                        clinicalCategory: category.code,
                                                                    }))
                                                                    onClinicalCategoryQueryChange(category.code ?? '')
                                                                    onClinicalCategoryDropdownChange(false)
                                                                }}
                                                            >
                                                                <span className="flex flex-col">
                                                                    <span className="font-medium">{category.code}</span>
                                                                    <span
                                                                        className="text-xs text-gray-600">{category.nameEn}</span>
                                                                </span>
                                                                <span
                                                                    className="text-xs text-gray-500">{category.procedureCount} procedures</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subCategory">Sub Category</Label>
                                        <div className="relative" ref={subCategoryDropdownRef}>
                                            <Input
                                                id="subCategory"
                                                value={formData.subCategory ?? ''}
                                                onChange={(event) =>
                                                    onFormDataChange((prev) => ({
                                                        ...prev,
                                                        subCategory: event.target.value
                                                    }))
                                                }
                                                onFocus={() => onSubCategoryDropdownChange(true)}
                                                placeholder="Search or select sub-category"
                                            />
                                            <div className="absolute right-2 top-2.5 text-gray-400">
                                                <Search className="h-4 w-4"/>
                                            </div>
                                            {subCategoryDropdownOpen && (
                                                <div
                                                    className="absolute z-10 mt-2 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-lg">
                                                    <div className="p-2">
                                                        <Input
                                                            value={subCategoryQuery}
                                                            onChange={(event) => onSubCategoryQueryChange(event.target.value)}
                                                            placeholder="Filter sub-categories"
                                                        />
                                                    </div>
                                                    <div className="divide-y">
                                                        {filteredSubCategories.map((category) => (
                                                            <button
                                                                key={category.id}
                                                                type="button"
                                                                className={cn(
                                                                    'flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50',
                                                                    formData.subCategory === category.code && 'bg-gray-100',
                                                                )}
                                                                onClick={() => {
                                                                    onFormDataChange((prev) => ({
                                                                        ...prev,
                                                                        subCategory: category.code
                                                                    }))
                                                                    onSubCategoryQueryChange(category.code ?? '')
                                                                    onSubCategoryDropdownChange(false)
                                                                }}
                                                            >
                                                                <span className="flex flex-col">
                                                                    <span className="font-medium">{category.code}</span>
                                                                    <span
                                                                        className="text-xs text-gray-600">{category.nameEn}</span>
                                                                </span>
                                                                <span
                                                                    className="text-xs text-gray-500">{category.procedureCount} procedures</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="bodyRegion">Body Region</Label>
                                        <Input
                                            id="bodyRegion"
                                            value={formData.bodyRegion ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, bodyRegion: event.target.value}))
                                            }
                                            placeholder="E.g. Abdomen, Limb"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="severityLevel">Severity Level</Label>
                                        <Select
                                            value={formData.severityLevel ?? ''}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({...prev, severityLevel: value || null}))
                                            }
                                        >
                                            <SelectTrigger id="severityLevel">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Not specified</SelectItem>
                                                {CLINICAL_SEVERITY_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="riskLevel">Risk Level</Label>
                                        <Select
                                            value={formData.riskLevel ?? ''}
                                            onValueChange={(value) => onFormDataChange((prev) => ({
                                                ...prev,
                                                riskLevel: value || null
                                            }))}
                                        >
                                            <SelectTrigger id="riskLevel">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Not specified</SelectItem>
                                                {CLINICAL_RISK_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="anesthesiaLevel">Anesthesia Level</Label>
                                        <Select
                                            value={formData.anesthesiaLevel ?? ''}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({...prev, anesthesiaLevel: value || null}))
                                            }
                                        >
                                            <SelectTrigger id="anesthesiaLevel">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Not specified</SelectItem>
                                                {ANESTHESIA_LEVEL_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="operationType">Operation Type</Label>
                                        <Select
                                            value={formData.operationType ?? ''}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({...prev, operationType: value || null}))
                                            }
                                        >
                                            <SelectTrigger id="operationType">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Not specified</SelectItem>
                                                {OPERATION_TYPE_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="operationRoomType">Operation Room</Label>
                                        <Select
                                            value={formData.operationRoomType ?? ''}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    operationRoomType: value || null
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="operationRoomType">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Not specified</SelectItem>
                                                {OPERATION_ROOM_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="primaryIcdCode">Primary ICD Code</Label>
                                        <div className="relative" ref={icdDropdownRef}>
                                            <Input
                                                id="primaryIcdCode"
                                                value={formData.primaryIcdCode ?? ''}
                                                onChange={(event) => onIcdSearchTermChange(event.target.value)}
                                                onFocus={() => onIcdDropdownOpenChange(true)}
                                                placeholder="Search ICD codes"
                                            />
                                            <div className="absolute right-2 top-2.5 text-gray-400">
                                                <Search className="h-4 w-4"/>
                                            </div>
                                            {icdDropdownOpen && (
                                                <div
                                                    className="absolute z-10 mt-2 w-full rounded-md border bg-white shadow-lg">
                                                    <div className="p-2">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={icdSearchTerm}
                                                                onChange={(event) => onIcdSearchTermChange(event.target.value)}
                                                                placeholder="Search ICDs"
                                                            />
                                                            <Button variant="outline" size="icon"
                                                                    onClick={() => onSearchIcds()}>
                                                                <Search className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="max-h-56 overflow-auto">
                                                        {icdSearchLoading && (
                                                            <div
                                                                className="flex items-center justify-center py-3 text-sm text-gray-500">
                                                                <Loader2
                                                                    className="mr-2 h-4 w-4 animate-spin"/> Searching...
                                                            </div>
                                                        )}
                                                        {icdSearchError && (
                                                            <div
                                                                className="px-4 py-2 text-xs text-red-600">{icdSearchError}</div>
                                                        )}
                                                        {icdResults.map((icd) => (
                                                            <button
                                                                key={icd.code}
                                                                type="button"
                                                                className="flex w-full flex-col items-start px-4 py-2 text-left text-sm hover:bg-gray-50"
                                                                onClick={() => {
                                                                    onFormDataChange((prev) => ({
                                                                        ...prev,
                                                                        primaryIcdCode: icd.code,
                                                                        primaryIcd: icd.nameEn,
                                                                    }))
                                                                    onIcdSearchTermChange(`${icd.code} · ${icd.nameEn ?? ''}`.trim())
                                                                    onIcdDropdownOpenChange(false)
                                                                }}
                                                            >
                                                                <span className="font-medium">{icd.code}</span>
                                                                <span
                                                                    className="text-xs text-gray-600">{icd.nameEn}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="icdValidationMode">ICD Validation Mode</Label>
                                        <Select
                                            value={formData.icdValidationMode ?? ''}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    icdValidationMode: value || null
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="icdValidationMode">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Not specified</SelectItem>
                                                {ICD_VALIDATION_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="primarySpecialty">Primary Specialty</Label>
                                        <Input
                                            id="primarySpecialty"
                                            value={formData.primarySpecialty ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    primarySpecialty: event.target.value
                                                }))
                                            }
                                            placeholder="E.g. Orthopedics"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="providerType">Provider Type</Label>
                                        <Input
                                            id="providerType"
                                            value={formData.providerType ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    providerType: event.target.value
                                                }))
                                            }
                                            placeholder="E.g. Hospital, Clinic"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="minProviderLevel">Min Provider Level</Label>
                                        <Input
                                            id="minProviderLevel"
                                            type="number"
                                            min="0"
                                            value={formData.minProviderLevel ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    minProviderLevel: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="surgeonExperienceMinYears">Surgeon Experience (years)</Label>
                                        <Input
                                            id="surgeonExperienceMinYears"
                                            type="number"
                                            min="0"
                                            value={formData.surgeonExperienceMinYears ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    surgeonExperienceMinYears: event.target.value
                                                        ? Number(event.target.value)
                                                        : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="genderSpecific">Gender</Label>
                                        <Select
                                            value={formData.genderSpecific ?? ''}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({...prev, genderSpecific: value || null}))
                                            }
                                        >
                                            <SelectTrigger id="genderSpecific">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Any</SelectItem>
                                                {GENDER_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/*<div className="space-y-2">*/}
                                    {/*    <Label htmlFor="allowedIcds">Allowed ICDs (JSON array)</Label>*/}
                                    {/*    <Textarea*/}
                                    {/*        id="allowedIcds"*/}
                                    {/*        rows={3}*/}
                                    {/*        value={formData.allowedIcds ?? ''}*/}
                                    {/*        onChange={(event) => onFormDataChange((prev) => ({*/}
                                    {/*            ...prev,*/}
                                    {/*            allowedIcds: event.target.value*/}
                                    {/*        }))}*/}
                                    {/*        placeholder='["ICD1","ICD2"]'*/}
                                    {/*    />*/}
                                    {/*</div>*/}
                                    {/*<div className="space-y-2">*/}
                                    {/*    <Label htmlFor="forbiddenIcds">Forbidden ICDs (JSON array)</Label>*/}
                                    {/*    <Textarea*/}
                                    {/*        id="forbiddenIcds"*/}
                                    {/*        rows={3}*/}
                                    {/*        value={formData.forbiddenIcds ?? ''}*/}
                                    {/*        onChange={(event) =>*/}
                                    {/*            onFormDataChange((prev) => ({*/}
                                    {/*                ...prev,*/}
                                    {/*                forbiddenIcds: event.target.value*/}
                                    {/*            }))*/}
                                    {/*        }*/}
                                    {/*        placeholder='["ICD3","ICD4"]'*/}
                                    {/*    />*/}
                                    {/*</div>*/}
                                </div>
                            </TabsContent>

                            <TabsContent value="pricing" className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="coPayment">Co-Payment (%)</Label>
                                        <Input
                                            id="coPayment"
                                            type="number"
                                            min="0"
                                            value={formData.coPayment ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    coPayment: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="patientShare">Patient Share (%)</Label>
                                        <Input
                                            id="patientShare"
                                            type="number"
                                            min="0"
                                            value={formData.patientShare ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    patientShare: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deductible">Deductible</Label>
                                        <Input
                                            id="deductible"
                                            type="number"
                                            min="0"
                                            value={formData.deductible ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    deductible: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxAllowedAmount">Max Allowed Amount</Label>
                                        <Input
                                            id="maxAllowedAmount"
                                            type="number"
                                            min="0"
                                            value={formData.maxAllowedAmount ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    maxAllowedAmount: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="baseCost">Base Cost</Label>
                                        <Input
                                            id="baseCost"
                                            type="number"
                                            min="0"
                                            value={formData.baseCost ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    baseCost: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rvu">RVU</Label>
                                        <Input
                                            id="rvu"
                                            type="number"
                                            min="0"
                                            value={formData.rvu ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    rvu: event.target.value ? Number(event.target.value) : null
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="limitPerVisit">Limit / Visit</Label>
                                        <Input
                                            id="limitPerVisit"
                                            type="number"
                                            min="0"
                                            value={formData.limitPerVisit ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    limitPerVisit: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="limitPerYear">Limit / Year</Label>
                                        <Input
                                            id="limitPerYear"
                                            type="number"
                                            min="0"
                                            value={formData.limitPerYear ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    limitPerYear: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="waitingPeriodDays">Waiting Period (days)</Label>
                                        <Input
                                            id="waitingPeriodDays"
                                            type="number"
                                            min="0"
                                            value={formData.waitingPeriodDays ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    waitingPeriodDays: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {/*<div className="space-y-2">*/}
                                    {/*    <Label htmlFor="coverageInclusions">Coverage Inclusions</Label>*/}
                                    {/*    <Textarea*/}
                                    {/*        id="coverageInclusions"*/}
                                    {/*        rows={3}*/}
                                    {/*        value={formData.coverageInclusions ?? ''}*/}
                                    {/*        onChange={(event) =>*/}
                                    {/*            onFormDataChange((prev) => ({*/}
                                    {/*                ...prev,*/}
                                    {/*                coverageInclusions: event.target.value*/}
                                    {/*            }))*/}
                                    {/*        }*/}
                                    {/*        placeholder='["Room & board", "Physician fees"]'*/}
                                    {/*    />*/}
                                    {/*</div>*/}
                                    <div className="space-y-2">
                                        <Label htmlFor="requiresInternalReview">Requires Internal Review</Label>
                                        <Select
                                            value={formData.requiresInternalReview === null ? '' : String(formData.requiresInternalReview)}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    requiresInternalReview: value === '' ? null : value === 'true',
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="requiresInternalReview">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {YES_NO_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="genderSpecificCoverage">Gender Specific</Label>
                                        <Select
                                            value={formData.genderSpecific ?? ''}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({...prev, genderSpecific: value || null}))
                                            }
                                        >
                                            <SelectTrigger id="genderSpecificCoverage">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Any</SelectItem>
                                                {GENDER_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="isBundle">Is Bundle</Label>
                                        <Select
                                            value={formData.isBundle === null ? '' : String(formData.isBundle)}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    isBundle: value === '' ? null : value === 'true',
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="isBundle">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {YES_NO_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bundleParentId">Bundle Parent ID</Label>
                                        <Input
                                            id="bundleParentId"
                                            type="number"
                                            min="0"
                                            value={formData.bundleParentId ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    bundleParentId: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>

                                    {/*<div className="space-y-2">*/}
                                    {/*    <Label htmlFor="bundleComponents">Bundle Components (JSON array)</Label>*/}
                                    {/*    <Textarea*/}
                                    {/*        id="bundleComponents"*/}
                                    {/*        rows={3}*/}
                                    {/*        value={formData.bundleComponents ?? ''}*/}
                                    {/*        onChange={(event) =>*/}
                                    {/*            onFormDataChange((prev) => ({*/}
                                    {/*                ...prev,*/}
                                    {/*                bundleComponents: event.target.value*/}
                                    {/*            }))*/}
                                    {/*        }*/}
                                    {/*        placeholder='["PROC-1","PROC-2"]'*/}
                                    {/*    />*/}
                                    {/*</div>*/}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="isFollowUp">Is Follow Up</Label>
                                        <Select
                                            value={formData.isFollowUp === null ? '' : String(formData.isFollowUp)}
                                            onValueChange={(value) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    isFollowUp: value === '' ? null : value === 'true',
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="isFollowUp">
                                                <SelectValue placeholder="Select"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {YES_NO_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="followUpDays">Follow Up Days</Label>
                                        <Input
                                            id="followUpDays"
                                            type="number"
                                            min="0"
                                            value={formData.followUpDays ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    followUpDays: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="parentId">Parent Procedure ID</Label>
                                        <Input
                                            id="parentId"
                                            type="number"
                                            min="0"
                                            value={formData.parentId ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({
                                                    ...prev,
                                                    parentId: event.target.value ? Number(event.target.value) : null,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                            </TabsContent>

                            <TabsContent value="ownership" className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="createdBy">Created By</Label>
                                        <Input
                                            id="createdBy"
                                            value={formData.createdBy ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, createdBy: event.target.value}))
                                            }
                                            placeholder="Optional creator identifier"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="updatedBy">Updated By</Label>
                                        <Input
                                            id="updatedBy"
                                            value={formData.updatedBy ?? ''}
                                            onChange={(event) =>
                                                onFormDataChange((prev) => ({...prev, updatedBy: event.target.value}))
                                            }
                                            placeholder="Optional last editor"
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Ownership fields help track who created and last updated the procedure in downstream
                                    systems.
                                </p>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>

                {formError && (
                    <div
                        className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-tpa-primary text-white hover:bg-tpa-accent"
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/> Saving...
                            </span>
                        ) : (
                            'Save Procedure'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
