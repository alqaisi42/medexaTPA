'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Copy } from 'lucide-react'
import { CardElement, LayoutDefinition, DATA_BINDINGS } from '@/types/card-template'

interface PropertiesPanelProps {
    selectedElement: CardElement | undefined
    onElementUpdate: (elementId: string, updates: Partial<CardElement>) => void
    onElementDelete: (elementId: string) => void
    layout: LayoutDefinition
    pageIndex: number
    onPageChange: (index: number) => void
}

export function PropertiesPanel({
    selectedElement,
    onElementUpdate,
    onElementDelete,
    layout,
    pageIndex,
    onPageChange
}: PropertiesPanelProps) {
    const handlePropertyChange = (property: string, value: any) => {
        if (!selectedElement) return

        if (property.startsWith('props.')) {
            const propName = property.replace('props.', '')
            // Create a completely new props object
            const newProps = {
                ...selectedElement.props,
                [propName]: value
            }
            
            // Update the entire element with new props
            onElementUpdate(selectedElement.id, {
                ...selectedElement,
                props: newProps
            })
        } else {
            onElementUpdate(selectedElement.id, {
                [property]: value
            })
        }
    }

    const handleQuickResize = (size: string) => {
        if (!selectedElement || selectedElement.type !== 'IMAGE') return

        let newWidth: number
        let newHeight: number

        switch (size) {
            case 'small':
                newWidth = 60
                newHeight = 40
                break
            case 'medium':
                newWidth = 120
                newHeight = 80
                break
            case 'large':
                newWidth = 200
                newHeight = 150
                break
            case 'fit-width':
                newWidth = layout.cardSize.width - selectedElement.x - 20 // Leave some margin
                newHeight = selectedElement.height || 80
                break
            case 'fit-height':
                newWidth = selectedElement.width || 120
                newHeight = layout.cardSize.height - selectedElement.y - 20 // Leave some margin
                break
            default:
                return
        }

        // Ensure dimensions don't exceed card boundaries
        const maxWidth = layout.cardSize.width - selectedElement.x
        const maxHeight = layout.cardSize.height - selectedElement.y

        newWidth = Math.min(newWidth, maxWidth)
        newHeight = Math.min(newHeight, maxHeight)

        onElementUpdate(selectedElement.id, {
            ...selectedElement,
            width: Math.max(20, newWidth),
            height: Math.max(20, newHeight)
        })
    }

    const renderElementProperties = () => {
        if (!selectedElement) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>Select an element to edit its properties</p>
                </div>
            )
        }

        const { type, props } = selectedElement

        return (
            <div className="space-y-4">
                {/* Element Actions */}
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Selected: {type}</h4>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this element?')) {
                                onElementDelete(selectedElement.id)
                            }
                        }}
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                        🗑️ Delete
                    </Button>
                </div>

                {/* Position and Size */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Position & Size</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs">X</Label>
                            <Input
                                type="number"
                                value={selectedElement.x}
                                onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))}
                                className="h-8"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Y</Label>
                            <Input
                                type="number"
                                value={selectedElement.y}
                                onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))}
                                className="h-8"
                            />
                        </div>
                        {(type !== 'TEXT') && (
                            <>
                                <div>
                                    <Label className="text-xs">Width</Label>
                                    <Input
                                        type="number"
                                        value={selectedElement.width || 100}
                                        onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Height</Label>
                                    <Input
                                        type="number"
                                        value={selectedElement.height || 100}
                                        onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))}
                                        className="h-8"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Type-specific properties */}
                {type === 'TEXT' && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Text Properties</h4>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-xs">Content</Label>
                                <Input
                                    value={props.text || ''}
                                    onChange={(e) => handlePropertyChange('props.text', e.target.value)}
                                    placeholder="Enter text"
                                    className="h-8"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Data Binding</Label>
                                <Select
                                    value={props.binding || ''}
                                    onValueChange={(value) => handlePropertyChange('props.binding', value)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select binding" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No binding</SelectItem>
                                        {DATA_BINDINGS.map((binding) => (
                                            <SelectItem key={binding.value} value={binding.value}>
                                                {binding.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Font Size</Label>
                                    <Input
                                        type="number"
                                        value={props.fontSize || 14}
                                        onChange={(e) => handlePropertyChange('props.fontSize', parseInt(e.target.value))}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Color</Label>
                                    <Input
                                        type="color"
                                        value={props.color || '#000000'}
                                        onChange={(e) => handlePropertyChange('props.color', e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs">Font Weight</Label>
                                <Select
                                    value={props.fontWeight || 'normal'}
                                    onValueChange={(value) => handlePropertyChange('props.fontWeight', value)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="bold">Bold</SelectItem>
                                        <SelectItem value="lighter">Light</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {type === 'IMAGE' && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Image Properties</h4>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-xs">Source</Label>
                                <Select
                                    value={props.source && !props.source.startsWith('data:') ? props.source : ''}
                                    onValueChange={(value) => handlePropertyChange('props.source', value)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select image source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TPA_LOGO">TPA Logo</SelectItem>
                                        <SelectItem value="NETWORK_LOGO">Network Logo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label className="text-xs">Upload Custom Image</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                const reader = new FileReader()
                                                reader.onload = (event) => {
                                                    const imageUrl = event.target?.result as string
                                                    if (imageUrl && selectedElement) {
                                                        // Update all image properties at once
                                                        const newProps = {
                                                            ...selectedElement.props,
                                                            source: imageUrl,
                                                            alt: file.name,
                                                            lastUpdated: Date.now()
                                                        }
                                                        
                                                        onElementUpdate(selectedElement.id, {
                                                            ...selectedElement,
                                                            props: newProps
                                                        })
                                                    }
                                                    // Reset the input
                                                    e.target.value = ''
                                                }
                                                reader.readAsDataURL(file)
                                            }
                                        }}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        className="h-8 text-xs"
                                    >
                                        Choose File
                                    </Button>
                                    {props.source && props.source.startsWith('data:') && (
                                        <>
                                            <span className="text-xs text-green-600">✓ Custom image uploaded</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    if (selectedElement) {
                                                        onElementUpdate(selectedElement.id, {
                                                            ...selectedElement,
                                                            props: {
                                                                ...selectedElement.props,
                                                                source: '',
                                                                alt: ''
                                                            }
                                                        })
                                                    }
                                                }}
                                                className="h-8 text-xs"
                                            >
                                                Clear
                                            </Button>
                                        </>
                                    )}
                                    
                                    {/* Test button to verify updates work */}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedElement) {
                                                const testColor = '#' + Math.floor(Math.random()*16777215).toString(16)
                                                onElementUpdate(selectedElement.id, {
                                                    ...selectedElement,
                                                    props: {
                                                        ...selectedElement.props,
                                                        color: testColor,
                                                        lastUpdated: Date.now()
                                                    } as any
                                                })
                                            }
                                        }}
                                        className="h-8 text-xs"
                                        title="Test if updates work"
                                    >
                                        Test
                                    </Button>
                                </div>
                            </div>
                            
                            {props.source && props.source.startsWith('data:') && (
                                <div>
                                    <Label className="text-xs">Preview</Label>
                                    <div className="mt-1 border rounded p-2 bg-gray-50">
                                        <img 
                                            key={props.source.substring(0, 100)} // Force re-render on source change
                                            src={props.source} 
                                            alt={props.alt || 'Uploaded image'} 
                                            className="max-w-full h-16 object-contain mx-auto"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <Label className="text-xs">Alt Text</Label>
                                <Input
                                    value={props.alt || ''}
                                    onChange={(e) => handlePropertyChange('props.alt', e.target.value)}
                                    placeholder="Image description"
                                    className="h-8"
                                />
                            </div>
                            
                            <div>
                                <Label className="text-xs">Object Fit</Label>
                                <Select
                                    value={props.objectFit || 'cover'}
                                    onValueChange={(value) => handlePropertyChange('props.objectFit', value)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select fit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cover">Cover (crop to fit)</SelectItem>
                                        <SelectItem value="contain">Contain (fit inside)</SelectItem>
                                        <SelectItem value="fill">Fill (stretch)</SelectItem>
                                        <SelectItem value="scale-down">Scale Down</SelectItem>
                                        <SelectItem value="none">None (original size)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label className="text-xs">Aspect Ratio</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="lock-aspect"
                                        checked={props.lockAspectRatio || false}
                                        onChange={(e) => handlePropertyChange('props.lockAspectRatio', e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="lock-aspect" className="text-xs">Lock aspect ratio</Label>
                                </div>
                            </div>
                            
                            <div>
                                <Label className="text-xs">Quick Resize</Label>
                                <div className="flex gap-1 flex-wrap">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickResize('small')}
                                        className="h-8 text-xs"
                                    >
                                        Small
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickResize('medium')}
                                        className="h-8 text-xs"
                                    >
                                        Medium
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickResize('large')}
                                        className="h-8 text-xs"
                                    >
                                        Large
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickResize('fit-width')}
                                        className="h-8 text-xs"
                                    >
                                        Fit Width
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickResize('fit-height')}
                                        className="h-8 text-xs"
                                    >
                                        Fit Height
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(type === 'QRCODE' || type === 'BARCODE') && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">{type} Properties</h4>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-xs">Data Binding</Label>
                                <Select
                                    value={props.binding || ''}
                                    onValueChange={(value) => handlePropertyChange('props.binding', value)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select data source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DATA_BINDINGS.filter(b => 
                                            type === 'QRCODE' ? b.value.includes('QR') : b.value.includes('BARCODE')
                                        ).map((binding) => (
                                            <SelectItem key={binding.value} value={binding.value}>
                                                {binding.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {type === 'SHAPE' && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Shape Properties</h4>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-xs">Shape Type</Label>
                                <Select
                                    value={props.shape || 'rectangle'}
                                    onValueChange={(value) => handlePropertyChange('props.shape', value)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rectangle">Rectangle</SelectItem>
                                        <SelectItem value="circle">Circle</SelectItem>
                                        <SelectItem value="line">Line</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Fill Color</Label>
                                    <Input
                                        type="color"
                                        value={props.fillColor || '#E5E7EB'}
                                        onChange={(e) => handlePropertyChange('props.fillColor', e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Border Color</Label>
                                    <Input
                                        type="color"
                                        value={props.borderColor || '#6B7280'}
                                        onChange={(e) => handlePropertyChange('props.borderColor', e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                        >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Page Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Pages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {(layout.pages || []).map((page, index) => (
                        <Button
                            key={index}
                            variant={pageIndex === index ? 'default' : 'outline'}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => onPageChange(index)}
                        >
                            {page.name.charAt(0).toUpperCase() + page.name.slice(1)}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {/* Properties */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Properties</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderElementProperties()}
                </CardContent>
            </Card>
        </div>
    )
}
