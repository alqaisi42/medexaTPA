export interface DrugCategory {
    id: number
    code: string
    nameEn: string
    nameAr: string
    parentId: number | null
    level: number | null
    isActive: boolean
    createdAt: string | null
    updatedAt: string | null
}

export interface DrugCategoryPayload {
    code: string
    nameEn: string
    nameAr: string
    parentId: number | null
}

export interface DrugCategoryTreeItem extends DrugCategory {
    children: DrugCategoryTreeItem[]
}

export interface DrugCategoryAssignment {
    id: number
    drugId: number
    categoryId: number
    isPrimary: boolean
    validFrom: string | null
    validTo: string | null
    createdAt: string | null
    updatedAt: string | null
}
