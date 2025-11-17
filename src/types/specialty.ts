export interface Specialty {
    id: number
    code: string
    nameEn: string
    nameAr: string
    isActive: boolean
    createdAt: string | null
    updatedAt: string | null
    effectiveFrom: string | null
    effectiveTo: string | null
}

export type SpecialtyPayload = Pick<Specialty, 'code' | 'nameEn' | 'nameAr' | 'isActive' | 'effectiveTo'>
