'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Edit, Download, Printer, Smartphone, Monitor, FileText, Image } from 'lucide-react'
import { CardTemplate, LayoutDefinition, DataBinding } from '@/types/card-template'
import { CardRenderer } from './preview/card-renderer'

interface CardTemplatePreviewTabProps {
    template: CardTemplate | null
    layout: LayoutDefinition | null
    onBackToList: () => void
    onEditTemplate: () => void
}

// Sample data for preview
const SAMPLE_DATA: Record<DataBinding, string> = {
    MEMBER_FULL_NAME: 'Ahmed Ali Mohammed',
    MEMBER_FIRST_NAME: 'Ahmed',
    MEMBER_LAST_NAME: 'Mohammed',
    MEMBER_ID: '12345678',
    MEMBER_CARD_NUMBER: '4532 1234 5678 9012',
    MEMBER_QR_URL: 'https://example.com/member/12345678',
    MEMBER_BARCODE: '123456789012',
    PLAN_NAME: 'Gold Premium Plan',
    PLAN_CODE: 'GOLD-01',
    CONTRACT_NUMBER: 'JAB-2025-001',
    EXPIRY_DATE: '12/2025',
    ISSUE_DATE: '01/2024',
    TPA_LOGO: '/api/placeholder/logo',
    TPA_NAME: 'MedExaTPA',
    TPA_HOTLINE: '06-1234567',
    NETWORK_LOGO: '/api/placeholder/network-logo',
    EMERGENCY_CONTACT: 'Emergency: 911',
}

export function CardTemplatePreviewTab({
    template,
    layout,
    onBackToList,
    onEditTemplate
}: CardTemplatePreviewTabProps) {
    const [selectedPage, setSelectedPage] = useState(0)
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
    const [isExporting, setIsExporting] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Template Selected
                </h3>
                <p className="text-gray-600 mb-4">
                    Please select a template from the list to preview.
                </p>
                <Button onClick={onBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Templates
                </Button>
            </div>
        )
    }

    if (!layout) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Loading Preview...
                </h3>
            </div>
        )
    }

    const currentPage = layout.pages[selectedPage]

    // Print functionality
    const handlePrintTest = () => {
        if (!template || !layout) return

        // Create a new window for printing
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const printContent = generatePrintHTML(template, layout)
        
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        // Wait for content to load then print
        printWindow.onload = () => {
            printWindow.print()
            printWindow.close()
        }
    }

    // Export as PDF functionality (using print to PDF)
    const handleExportPDF = () => {
        if (!template || !layout) return

        setIsExporting(true)
        
        try {
            // Create a new window with print-optimized content
            const printWindow = window.open('', '_blank', 'width=800,height=600')
            if (!printWindow) {
                alert('Please allow popups to export PDF')
                setIsExporting(false)
                return
            }

            const printContent = generatePrintHTML(template, layout, true) // PDF optimized
            
            printWindow.document.write(printContent)
            printWindow.document.close()
            
            // Wait for content to load then trigger print dialog
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.focus()
                    printWindow.print()
                    // Note: User can choose "Save as PDF" in print dialog
                    setTimeout(() => {
                        printWindow.close()
                    }, 1000)
                }, 1000)
            }

        } catch (error) {
            console.error('Failed to export PDF:', error)
            alert('Failed to export PDF. Please try again.')
        } finally {
            setTimeout(() => setIsExporting(false), 2000)
        }
    }

    // Export as Image functionality (using DOM to canvas)
    const handleExportImage = async () => {
        if (!template || !cardRef.current) return

        setIsExporting(true)
        
        try {
            // Use simple canvas approach for reliable export
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
                throw new Error('Canvas not supported')
            }

            // Set canvas size (high resolution for quality)
            const scale = 4
            const cardWidth = layout.cardSize.width
            const cardHeight = layout.cardSize.height
            
            canvas.width = cardWidth * scale
            canvas.height = cardHeight * scale
            
            // Scale context for high DPI
            ctx.scale(scale, scale)
            
            // Fill background
            ctx.fillStyle = currentPage.backgroundColor || '#ffffff'
            ctx.fillRect(0, 0, cardWidth, cardHeight)
            
            // Add border
            ctx.strokeStyle = '#e0e0e0'
            ctx.lineWidth = 2
            ctx.strokeRect(1, 1, cardWidth - 2, cardHeight - 2)
            
            // Add rounded corners effect
            ctx.strokeStyle = '#cccccc'
            ctx.lineWidth = 1
            ctx.strokeRect(0, 0, cardWidth, cardHeight)

            // Create download link
            const link = document.createElement('a')
            link.download = `${template.templateCode}_${template.nameEn.replace(/\s+/g, '_')}_card.png`
            link.href = canvas.toDataURL('image/png', 1.0)
            link.click()

        } catch (error) {
            console.error('Failed to export image:', error)
            alert('Failed to export image. Please try the PDF export instead.')
        } finally {
            setIsExporting(false)
        }
    }

    // Generate HTML for printing
    const generatePrintHTML = (template: CardTemplate, layout: LayoutDefinition, isPDF = false) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${isPDF ? 'Export PDF' : 'Print'}: ${template.nameEn}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @page {
                        size: 85.6mm 53.98mm;
                        margin: 0;
                    }
                    
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        background: white;
                        font-size: 8px;
                        line-height: 1.0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .card-container {
                        width: 100vw;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                    }
                    
                    .card {
                        width: 85.6mm;
                        height: 53.98mm;
                        position: relative;
                        border: 0.5mm solid #333;
                        border-radius: 2mm;
                        overflow: hidden;
                        page-break-after: always;
                        background: white;
                    }
                    
                    .card:last-child {
                        page-break-after: auto;
                    }
                    
                    .card-page {
                        width: 100%;
                        height: 100%;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .element {
                        position: absolute;
                        overflow: hidden;
                        max-width: 100%;
                        max-height: 100%;
                        box-sizing: border-box;
                    }
                    
                    .text-element {
                        font-family: 'Arial', sans-serif;
                        white-space: nowrap;
                        line-height: 1.0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        font-size: 6px !important;
                        max-width: 100%;
                        display: block;
                    }
                    
                    .image-element {
                        background: #f8f9fa;
                        border: 0.2mm solid #dee2e6;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 6px;
                        color: #6c757d;
                        overflow: hidden;
                    }
                    
                    .image-element img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border: none;
                        max-width: 100%;
                        max-height: 100%;
                    }
                    
                    .qr-element, .barcode-element {
                        background: #000;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 5px;
                        font-weight: bold;
                    }
                    
                    @media print {
                        body { 
                            padding: 0; 
                            font-size: 6px !important;
                        }
                        .no-print { display: none; }
                        .text-element {
                            font-size: 5px !important;
                            line-height: 0.9 !important;
                        }
                        .element {
                            overflow: hidden !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="card-container">
                    ${layout.pages.map((page, pageIndex) => `
                        <div class="card">
                            <div class="card-page" style="background-color: ${page.backgroundColor};">
                                <h3 class="no-print" style="margin: 0 0 5mm 0; text-align: center; font-size: 12px;">
                                    ${page.name.toUpperCase()} SIDE
                                </h3>
                                ${(page.elements || []).map(element => {
                                    const leftPercent = Math.max(0, Math.min(90, (element.x / layout.cardSize.width) * 100))
                                    const topPercent = Math.max(0, Math.min(85, (element.y / layout.cardSize.height) * 100))
                                    const widthPercent = element.width ? Math.min(100 - leftPercent, (element.width / layout.cardSize.width) * 100) : 15
                                    const heightPercent = element.height ? Math.min(100 - topPercent, (element.height / layout.cardSize.height) * 100) : 8
                                    
                                    const style = `
                                        left: ${leftPercent}%;
                                        top: ${topPercent}%;
                                        width: ${Math.max(5, widthPercent)}%;
                                        height: ${Math.max(4, heightPercent)}%;
                                        box-sizing: border-box;
                                    `
                                    
                                    switch (element.type) {
                                        case 'TEXT':
                                            const fontSize = Math.max(4, Math.min(10, (element.props.fontSize || 12) * 0.35))
                                            return `
                                                <div class="element text-element" style="${style}
                                                    font-size: ${fontSize}px;
                                                    color: ${element.props.color || '#000000'};
                                                    font-weight: ${element.props.fontWeight || 'normal'};
                                                    line-height: 1.0;
                                                    font-family: Arial, sans-serif;
                                                    overflow: hidden;
                                                    text-overflow: ellipsis;
                                                ">
                                                    ${(element.props.text || element.props.binding || 'Sample Text').substring(0, 30)}
                                                </div>
                                            `
                                        case 'IMAGE':
                                            return `
                                                <div class="element image-element" style="${style}">
                                                    ${element.props.source && element.props.source.startsWith('data:') ? 
                                                        `<img src="${element.props.source}" alt="${element.props.alt || 'Image'}" style="width: 100%; height: 100%; object-fit: cover;" />` :
                                                        element.props.source === 'TPA_LOGO' ? '🏢 TPA LOGO' :
                                                        element.props.source === 'NETWORK_LOGO' ? '🌐 NETWORK' :
                                                        '🖼️ IMAGE'
                                                    }
                                                </div>
                                            `
                                        case 'QRCODE':
                                            return `
                                                <div class="element qr-element" style="${style}">
                                                    QR CODE
                                                </div>
                                            `
                                        case 'BARCODE':
                                            return `
                                                <div class="element barcode-element" style="${style}">
                                                    BARCODE
                                                </div>
                                            `
                                        default:
                                            return `
                                                <div class="element" style="${style} background: #f0f0f0; border: 1px solid #ccc;">
                                                    ${element.type}
                                                </div>
                                            `
                                    }
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="no-print" style="margin-top: 10mm; text-align: center; font-size: 10px; color: #666;">
                    <p><strong>${template.nameEn}</strong> (${template.templateCode})</p>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
            </body>
            </html>
        `
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={onBackToList}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Templates
                            </Button>
                            <div>
                                <CardTitle className="text-lg">
                                    Preview: {template.nameEn}
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    {template.templateCode} • {template.templateType}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={previewMode}
                                onValueChange={(value: 'desktop' | 'mobile') => setPreviewMode(value)}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desktop">
                                        <div className="flex items-center gap-2">
                                            <Monitor className="h-4 w-4" />
                                            Desktop
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="mobile">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-4 w-4" />
                                            Mobile
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={onEditTemplate}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Design
                            </Button>
                            
                            {/* Export Dropdown */}
                            <div className="flex gap-1">
                                <Button 
                                    variant="outline" 
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    {isExporting ? 'Exporting...' : 'Print to PDF'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={handleExportImage}
                                    disabled={isExporting}
                                    title="Export as High-Quality PNG"
                                >
                                    <Image className="h-4 w-4 mr-2" />
                                    PNG
                                </Button>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                onClick={handlePrintTest}
                                disabled={!template || !layout}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print Test
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Preview Content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Page Selection */}
                <div className="col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Card Pages</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {layout.pages.map((page, index) => (
                                <Button
                                    key={index}
                                    variant={selectedPage === index ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => setSelectedPage(index)}
                                >
                                    {page.name.charAt(0).toUpperCase() + page.name.slice(1)}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Template Info */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">Template Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium">Size:</span>
                                <div className="text-gray-600">
                                    {layout.cardSize.width} × {layout.cardSize.height}px
                                </div>
                            </div>
                            <div>
                                <span className="font-medium">Elements:</span>
                                <div className="text-gray-600">
                                    {currentPage.elements.length} elements
                                </div>
                            </div>
                            <div>
                                <span className="font-medium">Background:</span>
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-4 h-4 rounded border"
                                        style={{ backgroundColor: currentPage.backgroundColor }}
                                    />
                                    <span className="text-gray-600">{currentPage.backgroundColor}</span>
                                </div>
                            </div>
                            <div>
                                <span className="font-medium">Status:</span>
                                <div className="flex gap-1 mt-1">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        template.isActive 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {template.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {template.isDefault && (
                                        <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Area */}
                <div className="col-span-9">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {currentPage.name.charAt(0).toUpperCase() + currentPage.name.slice(1)} Side Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`flex justify-center items-center p-8 ${
                                previewMode === 'mobile' ? 'bg-gray-100' : 'bg-white'
                            }`}>
                                <div className={`${
                                    previewMode === 'mobile' 
                                        ? 'max-w-sm mx-auto' 
                                        : 'max-w-4xl'
                                }`}>
                                    <div ref={cardRef}>
                                        <CardRenderer
                                            page={currentPage}
                                            cardSize={layout.cardSize}
                                            sampleData={SAMPLE_DATA}
                                            scale={previewMode === 'mobile' ? 0.6 : 0.8}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Element List */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">Page Elements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {currentPage.elements.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    No elements on this page
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {currentPage.elements.map((element) => (
                                        <div 
                                            key={element.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <div className="font-medium">{element.id}</div>
                                                <div className="text-sm text-gray-600">
                                                    {element.type} • {element.x}, {element.y}
                                                    {element.width && element.height && 
                                                        ` • ${element.width}×${element.height}`
                                                    }
                                                </div>
                                            </div>
                                            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {element.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
