'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LayoutDefinition, EditorState, CardElement } from '@/types/card-template'
import { Trash2, Copy } from 'lucide-react'

interface CardCanvasProps {
    layout: LayoutDefinition
    editorState: EditorState
    selectedElement: CardElement | undefined
    onElementSelect: (elementId: string | null) => void
    onElementUpdate: (elementId: string, updates: Partial<CardElement>) => void
    onElementDelete: (elementId: string) => void
    onLayoutChange: (layout: LayoutDefinition) => void
}

// Card outline templates
interface CardOutline {
    name: string
    corners: number
    shadow: boolean
    gradient?: boolean
    border?: boolean
}

const CARD_OUTLINES: Record<string, CardOutline> = {
    STANDARD: { name: 'Standard Card', corners: 8, shadow: true },
    APPLE_PAY: { name: 'Apple Pay Style', corners: 16, shadow: true, gradient: true },
    VISA: { name: 'Visa Style', corners: 4, shadow: false },
    INSURANCE: { name: 'Insurance Card', corners: 6, shadow: true, border: true },
    MODERN: { name: 'Modern Style', corners: 12, shadow: true, gradient: true }
}

export function CardCanvas({
    layout,
    editorState,
    selectedElement,
    onElementSelect,
    onElementUpdate,
    onElementDelete,
    onLayoutChange
}: CardCanvasProps) {
    const [dragState, setDragState] = useState<{
        isDragging: boolean
        dragOffset: { x: number; y: number }
        elementId: string | null
    }>({
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        elementId: null
    })
    const [cardOutline, setCardOutline] = useState('STANDARD')
    const canvasRef = useRef<HTMLDivElement>(null)

    const currentPage = layout.pages?.[editorState.selectedPageIndex]
    const { cardSize } = layout

    // Return early if no valid page
    if (!currentPage) {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-center h-96 text-gray-500">
                        <p>No page data available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
        e.preventDefault()
        e.stopPropagation()
        
        const element = currentPage.elements?.find(el => el.id === elementId)
        if (!element) return

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const offsetX = e.clientX - rect.left - element.x * editorState.zoom
        const offsetY = e.clientY - rect.top - element.y * editorState.zoom

        setDragState({
            isDragging: true,
            dragOffset: { x: offsetX, y: offsetY },
            elementId
        })

        onElementSelect(elementId)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragState.isDragging || !dragState.elementId) return

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const newX = Math.max(0, Math.min(
            cardSize.width - 50,
            (e.clientX - rect.left - dragState.dragOffset.x) / editorState.zoom
        ))
        const newY = Math.max(0, Math.min(
            cardSize.height - 50,
            (e.clientY - rect.top - dragState.dragOffset.y) / editorState.zoom
        ))

        onElementUpdate(dragState.elementId, { x: Math.round(newX), y: Math.round(newY) })
    }

    const handleMouseUp = () => {
        setDragState({
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            elementId: null
        })
    }

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onElementSelect(null)
        }
    }

    const getCardStyle = () => {
        const outline = CARD_OUTLINES[cardOutline]
        return {
            borderRadius: `${outline.corners}px`,
            boxShadow: outline.shadow ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
            border: outline.border ? '2px solid #E5E7EB' : 'none',
            background: outline.gradient 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : currentPage.backgroundColor
        }
    }

    return (
        <Card>
            <CardContent className="p-4">
                {/* Card Style Selector */}
                <div className="mb-4 flex items-center gap-4">
                    <label className="text-sm font-medium">Card Style:</label>
                    <Select value={cardOutline} onValueChange={setCardOutline}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(CARD_OUTLINES).map(([key, outline]) => (
                                <SelectItem key={key} value={key}>
                                    {outline.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div 
                    className="relative overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8" 
                    style={{ height: '600px' }}
                >
                    {/* Canvas */}
                    <div 
                        ref={canvasRef}
                        className="relative mx-auto cursor-crosshair"
                        style={{
                            width: cardSize.width * editorState.zoom,
                            height: cardSize.height * editorState.zoom,
                            transform: `scale(${editorState.zoom})`,
                            transformOrigin: 'top left'
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={handleCanvasClick}
                    >
                        {/* Card Background */}
                        <div 
                            className="absolute inset-0 transition-all duration-200"
                            style={getCardStyle()}
                        />

                        {/* Grid */}
                        {editorState.showGrid && (
                            <div 
                                className="absolute inset-0 opacity-30 pointer-events-none"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(to right, #3B82F6 1px, transparent 1px),
                                        linear-gradient(to bottom, #3B82F6 1px, transparent 1px)
                                    `,
                                    backgroundSize: '20px 20px'
                                }}
                            />
                        )}

                        {/* Rulers */}
                        {editorState.showRulers && (
                            <>
                                {/* Top ruler */}
                                <div className="absolute -top-6 left-0 right-0 h-6 bg-white border-b text-xs flex items-end">
                                    {Array.from({ length: Math.ceil(cardSize.width / 50) }).map((_, i) => (
                                        <div key={i} className="relative" style={{ width: '50px' }}>
                                            <div className="absolute bottom-0 left-0 w-px h-2 bg-gray-400" />
                                            <div className="absolute bottom-2 left-1 text-gray-500">{i * 50}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Left ruler */}
                                <div className="absolute -left-6 top-0 bottom-0 w-6 bg-white border-r text-xs">
                                    {Array.from({ length: Math.ceil(cardSize.height / 50) }).map((_, i) => (
                                        <div key={i} className="relative h-12" style={{ height: '50px' }}>
                                            <div className="absolute right-0 top-0 h-px w-2 bg-gray-400" />
                                            <div className="absolute right-2 top-1 text-gray-500 transform -rotate-90 origin-center text-xs">
                                                {i * 50}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Elements */}
                        {(currentPage.elements || []).map((element) => (
                            <DraggableElement
                                key={element.id}
                                element={element}
                                isSelected={selectedElement?.id === element.id}
                                onMouseDown={(e) => handleMouseDown(e, element.id)}
                                onSelect={() => onElementSelect(element.id)}
                                onDelete={() => onElementDelete(element.id)}
                                onElementUpdate={onElementUpdate}
                            />
                        ))}

                        {/* Page Label */}
                        <div className="absolute -top-12 left-0 text-lg font-semibold text-gray-700 bg-white px-3 py-1 rounded-t-lg border-t border-l border-r">
                            {currentPage.name.charAt(0).toUpperCase() + currentPage.name.slice(1)} Side
                        </div>
                    </div>

                    {/* Page Tabs */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        {(layout.pages || []).map((page, index) => (
                            <Button
                                key={index}
                                variant={editorState.selectedPageIndex === index ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onElementSelect(null)}
                                className="shadow-lg"
                            >
                                {page.name.charAt(0).toUpperCase() + page.name.slice(1)}
                            </Button>
                        ))}
                    </div>

                    {/* Instructions */}
                    {(currentPage.elements || []).length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 text-center shadow-lg border">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Designing Your Card</h3>
                                <p className="text-gray-600 mb-4">Drag elements from the toolbox to create your card design</p>
                                <div className="text-sm text-gray-500">
                                    <p>• Click elements to select and edit properties</p>
                                    <p>• Drag elements to reposition them</p>
                                    <p>• Use the grid and rulers for precise alignment</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Draggable element wrapper with selection and resize handles
function DraggableElement({ 
    element, 
    isSelected, 
    onMouseDown, 
    onSelect, 
    onDelete,
    onElementUpdate
}: { 
    element: CardElement
    isSelected: boolean
    onMouseDown: (e: React.MouseEvent) => void
    onSelect: () => void
    onDelete: () => void
    onElementUpdate?: (elementId: string, updates: Partial<CardElement>) => void
}) {
    const [isResizing, setIsResizing] = React.useState(false)
    const [resizeDirection, setResizeDirection] = React.useState<string>('')
    const [startPos, setStartPos] = React.useState({ x: 0, y: 0 })
    const [startSize, setStartSize] = React.useState({ width: 0, height: 0 })
    const [startPosition, setStartPosition] = React.useState({ x: 0, y: 0 })

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation()
        e.preventDefault()
        
        setIsResizing(true)
        setResizeDirection(direction)
        setStartPos({ x: e.clientX, y: e.clientY })
        setStartSize({ 
            width: element.width || 100, 
            height: element.height || 100 
        })
        setStartPosition({ x: element.x, y: element.y })

        const handleMouseMove = (e: MouseEvent) => {
            if (!onElementUpdate) return

            const deltaX = e.clientX - startPos.x
            const deltaY = e.clientY - startPos.y
            
            let newWidth = startSize.width
            let newHeight = startSize.height
            let newX = startPosition.x
            let newY = startPosition.y

            const aspectRatio = startSize.width / startSize.height
            const lockAspectRatio = element.props?.lockAspectRatio || false

            // Calculate new dimensions based on resize direction
            switch (direction) {
                case 'se': // Southeast
                    newWidth = Math.max(20, startSize.width + deltaX)
                    if (lockAspectRatio) {
                        newHeight = newWidth / aspectRatio
                    } else {
                        newHeight = Math.max(20, startSize.height + deltaY)
                    }
                    break
                case 'sw': // Southwest
                    newWidth = Math.max(20, startSize.width - deltaX)
                    if (lockAspectRatio) {
                        newHeight = newWidth / aspectRatio
                    } else {
                        newHeight = Math.max(20, startSize.height + deltaY)
                    }
                    newX = startPosition.x + (startSize.width - newWidth)
                    break
                case 'ne': // Northeast
                    newWidth = Math.max(20, startSize.width + deltaX)
                    if (lockAspectRatio) {
                        newHeight = newWidth / aspectRatio
                        newY = startPosition.y + (startSize.height - newHeight)
                    } else {
                        newHeight = Math.max(20, startSize.height - deltaY)
                        newY = startPosition.y + (startSize.height - newHeight)
                    }
                    break
                case 'nw': // Northwest
                    newWidth = Math.max(20, startSize.width - deltaX)
                    if (lockAspectRatio) {
                        newHeight = newWidth / aspectRatio
                    } else {
                        newHeight = Math.max(20, startSize.height - deltaY)
                    }
                    newX = startPosition.x + (startSize.width - newWidth)
                    newY = startPosition.y + (startSize.height - newHeight)
                    break
                case 'n': // North
                    if (!lockAspectRatio) {
                        newHeight = Math.max(20, startSize.height - deltaY)
                        newY = startPosition.y + (startSize.height - newHeight)
                    }
                    break
                case 's': // South
                    if (!lockAspectRatio) {
                        newHeight = Math.max(20, startSize.height + deltaY)
                    }
                    break
                case 'w': // West
                    if (!lockAspectRatio) {
                        newWidth = Math.max(20, startSize.width - deltaX)
                        newX = startPosition.x + (startSize.width - newWidth)
                    }
                    break
                case 'e': // East
                    if (!lockAspectRatio) {
                        newWidth = Math.max(20, startSize.width + deltaX)
                    }
                    break
            }

            onElementUpdate(element.id, {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            })
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            setResizeDirection('')
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }
    return (
        <div
            className={`absolute group transition-all duration-150 ${
                isSelected 
                    ? 'z-20' 
                    : 'z-10 hover:z-15'
            }`}
            style={{
                left: element.x,
                top: element.y,
                width: element.width || 'auto',
                height: element.height || 'auto',
            }}
            onClick={(e) => {
                e.stopPropagation()
                onSelect()
            }}
        >
            {/* Selection Border */}
            {isSelected && (
                <div className="absolute -inset-1 border-2 border-blue-500 bg-blue-500/10 rounded pointer-events-none">
                    {/* Resize Handles */}
                    <div 
                        className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                    ></div>
                    <div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                    ></div>
                    <div 
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                    ></div>
                    <div 
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'se')}
                    ></div>
                    
                    {/* Edge resize handles for images */}
                    {element.type === 'IMAGE' && (
                        <>
                            <div 
                                className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-blue-500 rounded cursor-n-resize pointer-events-auto"
                                onMouseDown={(e) => handleResizeStart(e, 'n')}
                            ></div>
                            <div 
                                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-blue-500 rounded cursor-s-resize pointer-events-auto"
                                onMouseDown={(e) => handleResizeStart(e, 's')}
                            ></div>
                            <div 
                                className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-3 bg-blue-500 rounded cursor-w-resize pointer-events-auto"
                                onMouseDown={(e) => handleResizeStart(e, 'w')}
                            ></div>
                            <div 
                                className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-3 bg-blue-500 rounded cursor-e-resize pointer-events-auto"
                                onMouseDown={(e) => handleResizeStart(e, 'e')}
                            ></div>
                        </>
                    )}
                    
                    {/* Delete Button */}
                    <button
                        className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600 transition-colors shadow-md border-2 border-white"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Delete this element?')) {
                                onDelete()
                            }
                        }}
                        title="Delete element"
                    >
                        🗑️
                    </button>
                    
                    {/* Element Label */}
                    <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {element.id}
                    </div>
                </div>
            )}
            
            {/* Hover Border */}
            {!isSelected && (
                <div className="absolute -inset-0.5 border border-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}

            {/* Element Content */}
            <div
                className="relative cursor-move"
                onMouseDown={onMouseDown}
            >
                <ElementRenderer 
                    element={element} 
                    onElementUpdate={onElementUpdate}
                />
            </div>
        </div>
    )
}

// Enhanced element renderer for the canvas
function ElementRenderer({ 
    element, 
    onElementUpdate 
}: { 
    element: CardElement
    onElementUpdate?: (elementId: string, updates: Partial<CardElement>) => void
}) {
    const { type, props } = element

    switch (type) {
        case 'TEXT':
            return (
                <div
                    className="select-none whitespace-nowrap"
                    style={{
                        fontSize: props.fontSize || 14,
                        fontWeight: props.fontWeight || 'normal',
                        color: props.color || '#000000',
                        fontFamily: props.fontFamily || 'inherit',
                        textAlign: props.textAlign || 'left',
                    }}
                >
                    {props.text || props.binding || 'Text Element'}
                </div>
            )

        case 'IMAGE':
            return (
                <div 
                    className="bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-dashed border-blue-300 flex items-center justify-center text-xs text-blue-700 font-medium rounded w-full h-full min-w-16 min-h-16 relative group"
                    onDoubleClick={(e) => {
                        e.stopPropagation()
                        // Create a temporary file input for double-click upload
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (event) => {
                            const file = (event.target as HTMLInputElement).files?.[0]
                            if (file && onElementUpdate) {
                                const reader = new FileReader()
                                reader.onload = (readerEvent) => {
                                    const imageUrl = readerEvent.target?.result as string
                                    if (imageUrl && onElementUpdate) {
                                        // Update the entire element
                                        onElementUpdate(element.id, {
                                            ...element,
                                            props: {
                                                ...element.props,
                                                source: imageUrl,
                                                alt: file.name,
                                                lastUpdated: Date.now()
                                            }
                                        })
                                    }
                                }
                                reader.readAsDataURL(file)
                            }
                        }
                        input.click()
                    }}
                    title="Double-click to upload image"
                >
                    {props.source && props.source.startsWith('data:') ? (
                        <img 
                            key={props.source.substring(0, 100)} // Force re-render on source change
                            src={props.source} 
                            alt={props.alt || 'Uploaded image'} 
                            className="w-full h-full rounded pointer-events-none"
                            style={{
                                objectFit: (props.objectFit || 'cover') as any
                            }}
                        />
                    ) : (
                        <span className="pointer-events-none">
                            {props.source === 'TPA_LOGO' ? '🏢 TPA' : 
                             props.source === 'NETWORK_LOGO' ? '🌐 NET' : 
                             '🖼️ IMG'}
                        </span>
                    )}
                    
                    {/* Hint overlay for empty images */}
                    {!props.source && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 bg-opacity-10">
                            <span className="text-xs text-blue-600 pointer-events-none">Double-click to upload</span>
                        </div>
                    )}
                </div>
            )

        case 'QRCODE':
            return (
                <div className="bg-white border-2 border-gray-300 flex items-center justify-center text-xs w-full h-full min-w-16 min-h-16 rounded">
                    <div className="w-4/5 h-4/5 bg-black opacity-80" style={{
                        backgroundImage: `
                            repeating-linear-gradient(0deg, black 0px, black 2px, white 2px, white 4px),
                            repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)
                        `
                    }} />
                </div>
            )

        case 'BARCODE':
            return (
                <div className="bg-white border border-gray-300 flex items-center justify-center w-full h-full min-w-16 min-h-8 rounded">
                    <div className="w-4/5 h-3/5 bg-black" style={{
                        backgroundImage: `repeating-linear-gradient(90deg, black 0px, black 1px, white 1px, white 2px)`
                    }} />
                </div>
            )

        case 'SHAPE':
            const isCircle = props.shape === 'circle'
            return (
                <div
                    className="w-full h-full min-w-8 min-h-8"
                    style={{
                        backgroundColor: props.fillColor || '#E5E7EB',
                        border: `${props.borderWidth || 1}px solid ${props.borderColor || '#6B7280'}`,
                        borderRadius: isCircle ? '50%' : (props.borderRadius || 4),
                    }}
                />
            )

        case 'TABLE':
            const rows = props.rows || 2
            const columns = props.columns || 2
            return (
                <div className="border border-gray-400 bg-white w-full h-full min-w-24 min-h-16 text-xs">
                    <div className="grid h-full" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <div 
                                key={rowIndex}
                                className="grid border-b border-gray-400 last:border-b-0"
                                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                            >
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <div 
                                        key={colIndex}
                                        className="border-r border-gray-400 last:border-r-0 p-1 flex items-center justify-center text-center"
                                    >
                                        {rowIndex === 0 && props.headers?.[colIndex] 
                                            ? props.headers[colIndex]
                                            : `R${rowIndex + 1}C${colIndex + 1}`
                                        }
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )

        default:
            return (
                <div className="bg-gray-100 border border-gray-300 flex items-center justify-center text-xs w-full h-full min-w-16 min-h-8 rounded">
                    {type}
                </div>
            )
    }
}
