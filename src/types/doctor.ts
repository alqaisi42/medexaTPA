export interface DoctorSummary {
    id: number
    code: string
    nameEn: string
    nameAr: string
    mainSpecialtyId: number | null
    mainSpecialtyNameEn: string | null
    isActive: boolean
}
