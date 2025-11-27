'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
    CardTemplate, 
    CardTemplatePayload, 
    CardTemplateUpdatePayload, 
    TEMPLATE_TYPES,
    CARD_SIZES,
    LayoutDefinition
} from '@/types/card-template'
import { createCardTemplate, updateCardTemplate } from '@/lib/api/card-templates'

const templateFormSchema = z.object({
    templateCode: z.string().min(1, 'Template code is required'),
    nameEn: z.string().min(1, 'English name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    description: z.string().optional(),
    templateType: z.string().min(1, 'Template type is required'),
    isActive: z.boolean(),
    isDefault: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateFormSchema>

interface CardTemplateFormDialogProps {
    open: boolean
    onClose: () => void
    planId: number
    template?: CardTemplate | null
}

export function CardTemplateFormDialog({
    open,
    onClose,
    planId,
    template
}: CardTemplateFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [selectedCardSize, setSelectedCardSize] = useState('STANDARD')
    const isEditing = !!template && template.id > 0

    const form = useForm<TemplateFormData>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: {
            templateCode: '',
            nameEn: '',
            nameAr: '',
            description: '',
            templateType: 'PHYSICAL',
            isActive: true,
            isDefault: false,
        },
    })

    useEffect(() => {
        if (template) {
            form.reset({
                templateCode: template.templateCode,
                nameEn: template.nameEn,
                nameAr: template.nameAr,
                description: template.description || '',
                templateType: template.templateType,
                isActive: template.isActive,
                isDefault: template.isDefault,
            })
        } else {
            form.reset({
                templateCode: '',
                nameEn: '',
                nameAr: '',
                description: '',
                templateType: 'PHYSICAL',
                isActive: true,
                isDefault: false,
            })
        }
    }, [template, form])

    const createDefaultLayout = (): LayoutDefinition => {
        const cardSize = CARD_SIZES[selectedCardSize as keyof typeof CARD_SIZES]
        
        return {
            version: 1,
            cardSize: {
                width: cardSize.width,
                height: cardSize.height
            },
            pages: [
                {
                    name: 'front',
                    backgroundColor: '#FFFFFF',
                    elements: [
                        {
                            id: 'logo1',
                            type: 'IMAGE',
                            x: 40,
                            y: 40,
                            width: 160,
                            height: 60,
                            props: {
                                source: 'TPA_LOGO'
                            }
                        },
                        {
                            id: 'memberName',
                            type: 'TEXT',
                            x: 80,
                            y: 200,
                            props: {
                                binding: 'MEMBER_FULL_NAME',
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: '#222222'
                            }
                        },
                        {
                            id: 'planName',
                            type: 'TEXT',
                            x: 80,
                            y: 240,
                            props: {
                                binding: 'PLAN_NAME',
                                fontSize: 14,
                                color: '#666666'
                            }
                        },
                        {
                            id: 'cardNumber',
                            type: 'TEXT',
                            x: 80,
                            y: 280,
                            props: {
                                binding: 'MEMBER_CARD_NUMBER',
                                fontSize: 16,
                                fontFamily: 'monospace',
                                color: '#333333'
                            }
                        },
                        {
                            id: 'qr',
                            type: 'QRCODE',
                            x: cardSize.width - 180,
                            y: cardSize.height - 180,
                            width: 140,
                            height: 140,
                            props: {
                                binding: 'MEMBER_QR_URL'
                            }
                        }
                    ]
                },
                {
                    name: 'back',
                    backgroundColor: '#0F3E5D',
                    elements: [
                        {
                            id: 'hotline',
                            type: 'TEXT',
                            x: 60,
                            y: cardSize.height - 88,
                            props: {
                                text: 'Call Center: 06-xxxxxxx',
                                color: '#FFFFFF',
                                fontSize: 14
                            }
                        },
                        {
                            id: 'emergency',
                            type: 'TEXT',
                            x: 60,
                            y: cardSize.height - 60,
                            props: {
                                binding: 'EMERGENCY_CONTACT',
                                color: '#FFFFFF',
                                fontSize: 12
                            }
                        }
                    ]
                }
            ]
        }
    }

    const onSubmit = async (data: TemplateFormData) => {
        try {
            setLoading(true)

            if (isEditing && template) {
                const updatePayload: CardTemplateUpdatePayload = {
                    nameEn: data.nameEn,
                    nameAr: data.nameAr,
                    description: data.description || '',
                    templateType: data.templateType,
                    isActive: data.isActive,
                    isDefault: data.isDefault,
                    layoutDefinition: template.layoutDefinition,
                }
                await updateCardTemplate(planId, template.id, updatePayload)
            } else {
                const createPayload: CardTemplatePayload = {
                    planId,
                    templateCode: data.templateCode,
                    nameEn: data.nameEn,
                    nameAr: data.nameAr,
                    description: data.description || '',
                    templateType: data.templateType,
                    isActive: data.isActive,
                    isDefault: data.isDefault,
                    layoutDefinition: template?.layoutDefinition || createDefaultLayout(),
                }
                await createCardTemplate(planId, createPayload)
            }

            onClose()
        } catch (error) {
            console.error('Failed to save template:', error)
            alert('Failed to save template. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            form.reset()
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Card Template' : 'Create New Card Template'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Template Code */}
                        <div className="space-y-2">
                            <Label htmlFor="templateCode">Template Code *</Label>
                            <Input
                                id="templateCode"
                                {...form.register('templateCode')}
                                placeholder="e.g., GOLD_CARD_V1"
                                disabled={isEditing} // Cannot change code when editing
                            />
                            {form.formState.errors.templateCode && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.templateCode.message}
                                </p>
                            )}
                        </div>

                        {/* Template Type */}
                        <div className="space-y-2">
                            <Label htmlFor="templateType">Template Type *</Label>
                            <Select
                                value={form.watch('templateType')}
                                onValueChange={(value) => form.setValue('templateType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select template type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEMPLATE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.templateType && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.templateType.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* English Name */}
                        <div className="space-y-2">
                            <Label htmlFor="nameEn">English Name *</Label>
                            <Input
                                id="nameEn"
                                {...form.register('nameEn')}
                                placeholder="Enter English name"
                            />
                            {form.formState.errors.nameEn && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.nameEn.message}
                                </p>
                            )}
                        </div>

                        {/* Arabic Name */}
                        <div className="space-y-2">
                            <Label htmlFor="nameAr">Arabic Name *</Label>
                            <Input
                                id="nameAr"
                                {...form.register('nameAr')}
                                placeholder="أدخل الاسم بالعربية"
                                dir="rtl"
                            />
                            {form.formState.errors.nameAr && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.nameAr.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            placeholder="Enter template description"
                            rows={3}
                        />
                    </div>

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="cardSize">Card Size</Label>
                            <Select value={selectedCardSize} onValueChange={setSelectedCardSize}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CARD_SIZES).map(([key, size]) => (
                                        <SelectItem key={key} value={key}>
                                            {size.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                This will create a default layout with the selected card size
                            </p>
                        </div>
                    )}

                    {/* Status Checkboxes */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isActive"
                                checked={form.watch('isActive')}
                                onCheckedChange={(checked) => form.setValue('isActive', !!checked)}
                            />
                            <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Active template (available for use)
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isDefault"
                                checked={form.watch('isDefault')}
                                onCheckedChange={(checked) => form.setValue('isDefault', !!checked)}
                            />
                            <Label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Set as default template for this plan
                            </Label>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Template Information:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li><strong>Physical:</strong> For printed plastic cards</li>
                            <li><strong>Digital:</strong> For mobile app and digital wallets</li>
                            <li><strong>Both:</strong> Can be used for both physical and digital cards</li>
                            <li><strong>Default:</strong> The template used automatically for new members</li>
                        </ul>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
