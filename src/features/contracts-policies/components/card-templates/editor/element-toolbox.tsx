'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    Type, 
    Image, 
    QrCode, 
    BarChart3, 
    Square, 
    Table,
    Plus
} from 'lucide-react'
import { CardElement, ElementType, ToolboxItem } from '@/types/card-template'

interface ElementToolboxProps {
    onElementAdd: (element: CardElement) => void
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
    {
        id: 'text',
        type: 'TEXT',
        icon: 'Type',
        label: 'Text',
        defaultProps: {
            text: 'New Text',
            fontSize: 14,
            color: '#000000',
            fontWeight: 'normal',
        }
    },
    {
        id: 'image',
        type: 'IMAGE',
        icon: 'Image',
        label: 'Image',
        defaultProps: {
            source: 'TPA_LOGO',
            alt: 'Image'
        }
    },
    {
        id: 'qrcode',
        type: 'QRCODE',
        icon: 'QrCode',
        label: 'QR Code',
        defaultProps: {
            binding: 'MEMBER_QR_URL'
        }
    },
    {
        id: 'barcode',
        type: 'BARCODE',
        icon: 'BarChart3',
        label: 'Barcode',
        defaultProps: {
            binding: 'MEMBER_BARCODE',
            format: 'CODE128'
        }
    },
    {
        id: 'shape',
        type: 'SHAPE',
        icon: 'Square',
        label: 'Shape',
        defaultProps: {
            shape: 'rectangle',
            fillColor: '#E5E7EB',
            borderColor: '#6B7280',
            borderWidth: 1
        }
    },
    {
        id: 'table',
        type: 'TABLE',
        icon: 'Table',
        label: 'Table',
        defaultProps: {
            rows: 2,
            columns: 2,
            headers: ['Header 1', 'Header 2']
        }
    }
]

export function ElementToolbox({ onElementAdd }: ElementToolboxProps) {
    const handleAddElement = (toolboxItem: ToolboxItem) => {
        const newElement: CardElement = {
            id: `${toolboxItem.type.toLowerCase()}_${Date.now()}`,
            type: toolboxItem.type,
            x: 50,
            y: 50,
            width: toolboxItem.type === 'TEXT' ? undefined : 100,
            height: toolboxItem.type === 'TEXT' ? undefined : 100,
            props: { ...toolboxItem.defaultProps }
        }

        onElementAdd(newElement)
    }

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Type':
                return <Type className="h-5 w-5" />
            case 'Image':
                return <Image className="h-5 w-5" />
            case 'QrCode':
                return <QrCode className="h-5 w-5" />
            case 'BarChart3':
                return <BarChart3 className="h-5 w-5" />
            case 'Square':
                return <Square className="h-5 w-5" />
            case 'Table':
                return <Table className="h-5 w-5" />
            default:
                return <Plus className="h-5 w-5" />
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {TOOLBOX_ITEMS.map((item) => (
                    <Button
                        key={item.id}
                        variant="outline"
                        className="w-full justify-start gap-3 h-12 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={() => handleAddElement(item)}
                    >
                        {getIcon(item.icon)}
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="text-xs text-gray-500">
                                {item.type === 'TEXT' && 'Add text content'}
                                {item.type === 'IMAGE' && 'Logo or picture'}
                                {item.type === 'QRCODE' && 'QR code data'}
                                {item.type === 'BARCODE' && 'Barcode data'}
                                {item.type === 'SHAPE' && 'Rectangle or circle'}
                                {item.type === 'TABLE' && 'Data table'}
                            </span>
                        </div>
                    </Button>
                ))}

                {/* Quick Add Sections */}
                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Add</h4>
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => handleAddElement({
                                ...TOOLBOX_ITEMS[0],
                                defaultProps: { 
                                    binding: 'MEMBER_FULL_NAME',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#000000'
                                }
                            })}
                        >
                            Member Name
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => handleAddElement({
                                ...TOOLBOX_ITEMS[0],
                                defaultProps: { 
                                    binding: 'MEMBER_CARD_NUMBER',
                                    fontSize: 14,
                                    fontFamily: 'monospace',
                                    color: '#374151'
                                }
                            })}
                        >
                            Card Number
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => handleAddElement({
                                ...TOOLBOX_ITEMS[0],
                                defaultProps: { 
                                    binding: 'PLAN_NAME',
                                    fontSize: 12,
                                    color: '#6B7280'
                                }
                            })}
                        >
                            Plan Name
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => handleAddElement({
                                ...TOOLBOX_ITEMS[0],
                                defaultProps: { 
                                    binding: 'EXPIRY_DATE',
                                    fontSize: 12,
                                    color: '#DC2626'
                                }
                            })}
                        >
                            Expiry Date
                        </Button>
                    </div>
                </div>

                {/* Tips */}
                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Tips</h4>
                    <div className="space-y-2 text-xs text-gray-600">
                        <div className="bg-blue-50 p-2 rounded">
                            <strong>Drag & Drop:</strong> Click and drag elements to move them around the card
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                            <strong>Selection:</strong> Click any element to select and edit its properties
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                            <strong>Data Binding:</strong> Use bindings to show dynamic member information
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
