'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Undo, Redo, Grid, Ruler, ZoomIn, ZoomOut, FileText, Printer } from 'lucide-react'
import { CardTemplate, LayoutDefinition, EditorState, CardElement } from '@/types/card-template'
import { updateCardTemplate } from '@/lib/api/card-templates'
import { CardCanvas } from './editor/card-canvas'
import { ElementToolbox } from './editor/element-toolbox'
import { PropertiesPanel } from './editor/properties-panel'

interface CardTemplateEditorTabProps {
    planId: number
    template: CardTemplate | null
    layout: LayoutDefinition | null
    onSaveLayout: (layout: LayoutDefinition) => void
    onBackToList: () => void
}

export function CardTemplateEditorTab({
    planId,
    template,
    layout,
    onSaveLayout,
    onBackToList
}: CardTemplateEditorTabProps) {
    const [currentLayout, setCurrentLayout] = useState<LayoutDefinition | null>(layout)
    const [editorState, setEditorState] = useState<EditorState>({
        selectedElementId: null,
        selectedPageIndex: 0,
        zoom: 1,
        showGrid: true,
        showRulers: true,
        isDragging: false,
        isResizing: false,
    })
    const [saving, setSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    useEffect(() => {
        if (layout) {
            setCurrentLayout(layout)
            setHasUnsavedChanges(false)
            // Ensure selectedPageIndex is valid
            if (layout.pages && layout.pages.length > 0) {
                setEditorState(prev => ({
                    ...prev,
                    selectedPageIndex: Math.min(prev.selectedPageIndex, layout.pages.length - 1)
                }))
            }
        }
    }, [layout])

    const handleSave = async () => {
        if (!template || !currentLayout) return

        try {
            setSaving(true)
            const updatePayload = {
                nameEn: template.nameEn,
                nameAr: template.nameAr,
                description: template.description,
                templateType: template.templateType,
                isActive: template.isActive,
                isDefault: template.isDefault,
                layoutDefinition: currentLayout,
            }
            
            await updateCardTemplate(planId, template.id, updatePayload)
            onSaveLayout(currentLayout)
            setHasUnsavedChanges(false)
            
            // Show success feedback
            alert('Template saved successfully!')
        } catch (error) {
            console.error('Failed to save template:', error)
            alert('Failed to save template. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleLayoutChange = (newLayout: LayoutDefinition) => {
        setCurrentLayout(newLayout)
        setHasUnsavedChanges(true)
    }

    const handleElementSelect = (elementId: string | null) => {
        setEditorState(prev => ({
            ...prev,
            selectedElementId: elementId
        }))
    }

    const handleElementUpdate = (elementId: string, updates: Partial<CardElement>) => {
        if (!currentLayout || !currentLayout.pages?.[editorState.selectedPageIndex]) {
            return
        }

        const newLayout = JSON.parse(JSON.stringify(currentLayout)) // Deep clone
        const currentPage = newLayout.pages[editorState.selectedPageIndex]
        const elementIndex = currentPage.elements?.findIndex((el: any) => el.id === elementId) ?? -1
        
        if (elementIndex !== -1 && currentPage.elements) {
            // Completely replace the element to ensure React detects the change
            currentPage.elements[elementIndex] = {
                ...currentPage.elements[elementIndex],
                ...updates,
                // Add a unique key to force re-render
                _updateKey: Date.now()
            }
            
            // Force layout update
            handleLayoutChange(newLayout)
            setHasUnsavedChanges(true)
            
            // Force a re-render by updating editor state
            setEditorState(prev => ({
                ...prev,
                lastUpdate: Date.now()
            }))
        }
    }

    const handleElementAdd = (element: CardElement) => {
        if (!currentLayout || !currentLayout.pages?.[editorState.selectedPageIndex]) return

        const newLayout = { ...currentLayout }
        const currentPage = newLayout.pages[editorState.selectedPageIndex]
        if (!currentPage.elements) {
            currentPage.elements = []
        }
        currentPage.elements.push(element)
        handleLayoutChange(newLayout)
        handleElementSelect(element.id)
    }

    const handleElementDelete = (elementId: string) => {
        if (!currentLayout || !currentLayout.pages?.[editorState.selectedPageIndex]) return

        const newLayout = { ...currentLayout }
        const currentPage = newLayout.pages[editorState.selectedPageIndex]
        if (currentPage.elements) {
            currentPage.elements = currentPage.elements.filter(el => el.id !== elementId)
        }
        handleLayoutChange(newLayout)
        handleElementSelect(null)
        setHasUnsavedChanges(true)
    }

    // Add keyboard support for save only (delete disabled)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Save template
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
            
            // Prevent accidental deletion with backspace/delete
            if ((e.key === 'Delete' || e.key === 'Backspace') && editorState.selectedElementId) {
                // Only prevent if not in an input field
                const target = e.target as HTMLElement
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                    e.preventDefault()
                    // Do nothing - deletion only through delete button
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [editorState.selectedElementId, template, currentLayout])

    const handleZoomIn = () => {
        setEditorState(prev => ({
            ...prev,
            zoom: Math.min(prev.zoom * 1.2, 3)
        }))
    }

    const handleZoomOut = () => {
        setEditorState(prev => ({
            ...prev,
            zoom: Math.max(prev.zoom / 1.2, 0.25)
        }))
    }

    const handleAddBackSide = () => {
        if (!currentLayout) return

        const newLayout = { ...currentLayout }
        const backPage = {
            name: 'back',
            backgroundColor: '#ffffff',
            elements: []
        }
        
        newLayout.pages.push(backPage)
        handleLayoutChange(newLayout)
        
        // Switch to the new back page
        setEditorState(prev => ({
            ...prev,
            selectedPageIndex: newLayout.pages.length - 1,
            selectedElementId: null
        }))
        
        setHasUnsavedChanges(true)
    }

    const handleRemoveBackSide = () => {
        if (!currentLayout || currentLayout.pages.length <= 1) return

        const newLayout = { ...currentLayout }
        const backPageIndex = newLayout.pages.findIndex(p => p.name === 'back')
        
        if (backPageIndex !== -1) {
            newLayout.pages.splice(backPageIndex, 1)
            handleLayoutChange(newLayout)
            
            // Switch to front page
            setEditorState(prev => ({
                ...prev,
                selectedPageIndex: 0,
                selectedElementId: null
            }))
            
            setHasUnsavedChanges(true)
        }
    }

    const toggleGrid = () => {
        setEditorState(prev => ({
            ...prev,
            showGrid: !prev.showGrid
        }))
    }

    const toggleRulers = () => {
        setEditorState(prev => ({
            ...prev,
            showRulers: !prev.showRulers
        }))
    }

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Template Selected
                </h3>
                <p className="text-gray-600 mb-4">
                    Please select a template from the list to start editing.
                </p>
                <Button onClick={onBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Templates
                </Button>
            </div>
        )
    }

    if (!currentLayout) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Loading Template...
                </h3>
            </div>
        )
    }

    const selectedElement = currentLayout.pages?.[editorState.selectedPageIndex]?.elements?.find(
        el => el.id === editorState.selectedElementId
    )

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
                                    Editing: {template.nameEn}
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    {template.templateCode} • {template.templateType}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleGrid}
                                className={editorState.showGrid ? 'bg-blue-50' : ''}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleRulers}
                                className={editorState.showRulers ? 'bg-blue-50' : ''}
                            >
                                <Ruler className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleZoomOut}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-mono px-2">
                                {Math.round(editorState.zoom * 100)}%
                            </span>
                            <Button variant="outline" size="sm" onClick={handleZoomIn}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={saving || !hasUnsavedChanges}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                            
                            {/* Delete Selected Element */}
                            {editorState.selectedElementId && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (editorState.selectedElementId && window.confirm('Are you sure you want to delete the selected element?')) {
                                            handleElementDelete(editorState.selectedElementId)
                                        }
                                    }}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                    🗑️ Delete
                                </Button>
                            )}
                            
                            {/* Page Switcher */}
                            {currentLayout && currentLayout.pages && (
                                <div className="flex gap-1 border-l pl-2">
                                    {currentLayout.pages.map((page, index) => (
                                        <div key={index} className="flex items-center gap-1">
                                            <Button
                                                variant={editorState.selectedPageIndex === index ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setEditorState(prev => ({ ...prev, selectedPageIndex: index }))}
                                                className="min-w-16"
                                            >
                                                {page.name === 'front' ? '🎴 Front' : 
                                                 page.name === 'back' ? '🔄 Back' : 
                                                 page.name.charAt(0).toUpperCase() + page.name.slice(1)}
                                            </Button>
                                            {/* Remove back side button */}
                                            {page.name === 'back' && currentLayout.pages.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveBackSide()}
                                                    className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                                                    title="Remove back side"
                                                >
                                                    ×
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {/* Add Back Side Button */}
                                    {currentLayout.pages.length === 1 && !currentLayout.pages.some(p => p.name === 'back') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddBackSide}
                                            className="min-w-16 border-dashed"
                                            title="Add back side to card"
                                        >
                                            + Back
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Quick Export Actions */}
                            {template && currentLayout && (
                                <div className="flex gap-1 border-l pl-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            // Quick PDF export (simplified)
                                            window.open(`/api/plans/${planId}/card-templates/${template.id}/export/pdf`, '_blank')
                                        }}
                                        title="Quick PDF Export"
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            // Quick print
                                            window.print()
                                        }}
                                        title="Quick Print"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Editor Layout */}
            <div className="grid grid-cols-12 gap-6">
                {/* Toolbox */}
                <div className="col-span-2">
                    <ElementToolbox onElementAdd={handleElementAdd} />
                </div>

                {/* Canvas */}
                <div className="col-span-7">
                    <CardCanvas
                        layout={currentLayout}
                        editorState={editorState}
                        selectedElement={selectedElement}
                        onElementSelect={handleElementSelect}
                        onElementUpdate={handleElementUpdate}
                        onElementDelete={handleElementDelete}
                        onLayoutChange={handleLayoutChange}
                    />
                </div>

                {/* Properties Panel */}
                <div className="col-span-3">
                    <PropertiesPanel
                        selectedElement={selectedElement}
                        onElementUpdate={handleElementUpdate}
                        onElementDelete={handleElementDelete}
                        layout={currentLayout}
                        pageIndex={editorState.selectedPageIndex}
                        onPageChange={(index) => setEditorState(prev => ({ ...prev, selectedPageIndex: index }))}
                    />
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm font-medium">You have unsaved changes</p>
                </div>
            )}
        </div>
    )
}
