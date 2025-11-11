export type ProcedureCategory =
    | 'surgery'
    | 'lab'
    | 'imaging'
    | 'consultation'
    | 'therapy'
    | 'emergency'

export interface Procedure {
    id: string
    code: string
    nameEn: string
    nameAr: string
    description?: string
    category: ProcedureCategory
    specialty: string
    referencePrice: number
    unitOfMeasure: string
    linkedIcds: string[]
    genderRestriction?: 'male' | 'female' | 'both'
    minAge?: number
    maxAge?: number
    status: 'active' | 'inactive'
    createdAt: Date
    updatedAt: Date
}
