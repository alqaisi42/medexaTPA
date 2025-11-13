export interface DiagnosisCategory {
    id: number
    code: string
    nameEn: string
    nameAr: string
    isActive: boolean
    effectiveFrom?: string
    effectiveTo?: string
    createdAt?: string
    updatedAt?: string
}

export interface DiagnosisCategoryPayload {
    code: string
    nameEn: string
    nameAr: string
    isActive: boolean
    effectiveFrom?: string
    effectiveTo?: string
}

export interface IcdCategoryMapIdentifier {
    icdId: number
    categoryId: number
}

export interface IcdCategoryMap {
    id: IcdCategoryMapIdentifier
    icd: {
        id: number
        systemCode: string
        code: string
        nameEn: string
        nameAr: string
    }
    category: DiagnosisCategory
    effectiveFrom?: string
    effectiveTo?: string
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
}
