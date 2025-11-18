'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createDrugCategory, deleteDrugCategory, fetchCategoriesTree, updateDrugCategory } from '@/lib/api/drug-categories'
import { DrugCategoryPayload, DrugCategoryTreeItem } from '@/types'

interface CategoryFormState extends DrugCategoryPayload {}

const EMPTY_FORM: CategoryFormState = {
    code: '',
    nameEn: '',
    nameAr: '',
    parentId: null,
}

interface CategoryFormDialogProps {
    open: boolean
    mode: 'create' | 'edit'
    initialState: CategoryFormState
    onClose: () => void
    onSubmit: (values: CategoryFormState) => Promise<void>
    parentName?: string
}

function CategoryFormDialog({ open, mode, initialState, onClose, onSubmit, parentName }: CategoryFormDialogProps) {
    const [formState, setFormState] = useState<CategoryFormState>(initialState)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setFormState(initialState)
    }, [initialState])

    const handleSubmit = async () => {
        setSaving(true)
        await onSubmit(formState)
        setSaving(false)
    }

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
                    {parentName && (
                        <p className="text-sm text-muted-foreground">Parent: {parentName}</p>
                    )}
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="code">Code</Label>
                        <Input
                            id="code"
                            value={formState.code}
                            onChange={(event) => setFormState({ ...formState, code: event.target.value })}
                            placeholder="Category code"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nameEn">Name (EN)</Label>
                        <Input
                            id="nameEn"
                            value={formState.nameEn}
                            onChange={(event) => setFormState({ ...formState, nameEn: event.target.value })}
                            placeholder="English name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nameAr">Name (AR)</Label>
                        <Input
                            id="nameAr"
                            value={formState.nameAr}
                            onChange={(event) => setFormState({ ...formState, nameAr: event.target.value })}
                            placeholder="Arabic name"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving || !formState.nameEn || !formState.code}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface CategoryNodeProps {
    category: DrugCategoryTreeItem
    onAddChild: (category: DrugCategoryTreeItem) => void
    onEdit: (category: DrugCategoryTreeItem) => void
    onDelete: (category: DrugCategoryTreeItem) => void
}

function CategoryNode({ category, onAddChild, onEdit, onDelete }: CategoryNodeProps) {
    const [expanded, setExpanded] = useState(true)

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-sm">
                <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md border"
                    onClick={() => setExpanded((prev) => !prev)}
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{category.nameEn || category.code}</span>
                        {!category.isActive && <span className="text-xs text-muted-foreground">(Inactive)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{category.nameAr || 'No Arabic label'}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onAddChild(category)} aria-label="Add sub category">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onEdit(category)} aria-label="Edit category">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(category)} aria-label="Delete category">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
            {expanded && category.children?.length > 0 && (
                <div className="space-y-2 border-l pl-6">
                    {category.children.map((child) => (
                        <CategoryNode
                            key={child.id}
                            category={child}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function DrugCategoriesPage() {
    const [categories, setCategories] = useState<DrugCategoryTreeItem[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
    const [selectedCategory, setSelectedCategory] = useState<DrugCategoryTreeItem | null>(null)
    const [formState, setFormState] = useState<CategoryFormState>(EMPTY_FORM)
    const [error, setError] = useState<string | null>(null)

    const refreshTree = async () => {
        setLoading(true)
        try {
            const tree = await fetchCategoriesTree()
            setCategories(tree)
            setError(null)
        } catch (err) {
            console.error(err)
            setError('Unable to load categories')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void refreshTree()
    }, [])

    const openCreateDialog = (parent?: DrugCategoryTreeItem) => {
        setDialogMode('create')
        setSelectedCategory(parent ?? null)
        setFormState({ ...EMPTY_FORM, parentId: parent?.id ?? null })
        setDialogOpen(true)
    }

    const openEditDialog = (category: DrugCategoryTreeItem) => {
        setDialogMode('edit')
        setSelectedCategory(category)
        setFormState({
            code: category.code,
            nameEn: category.nameEn,
            nameAr: category.nameAr,
            parentId: category.parentId,
        })
        setDialogOpen(true)
    }

    const handleSave = async (values: CategoryFormState) => {
        if (dialogMode === 'create') {
            await createDrugCategory(values)
        } else if (selectedCategory) {
            await updateDrugCategory(selectedCategory.id, { nameEn: values.nameEn, nameAr: values.nameAr, code: values.code })
        }
        setDialogOpen(false)
        await refreshTree()
    }

    const handleDelete = async (category: DrugCategoryTreeItem) => {
        if (!confirm(`Delete category "${category.nameEn || category.code}"?`)) {
            return
        }
        await deleteDrugCategory(category.id)
        await refreshTree()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Drug Categories</h1>
                    <p className="text-sm text-muted-foreground">Manage main and sub categories for drugs.</p>
                </div>
                <Button onClick={() => openCreateDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Main Category
                </Button>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Categories Tree</CardTitle>
                        <CardDescription>Expand nodes to manage nested sub-categories.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={refreshTree} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </CardHeader>
                <CardContent>
                    {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
                    <ScrollArea className="h-[600px] pr-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading categories...</p>
                        ) : categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No categories yet. Create your first main category.</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <CategoryNode
                                        key={category.id}
                                        category={category}
                                        onAddChild={openCreateDialog}
                                        onEdit={openEditDialog}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <CategoryFormDialog
                open={dialogOpen}
                mode={dialogMode}
                initialState={formState}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleSave}
                parentName={selectedCategory?.nameEn}
            />
        </div>
    )
}
