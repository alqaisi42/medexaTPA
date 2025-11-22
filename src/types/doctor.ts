export interface DoctorSummary {
    id: number
    code: string
    nameEn: string
    nameAr: string
    mainSpecialtyId: number | null
    mainSpecialtyNameEn: string | null
    isActive: boolean
}

export interface Doctor {
    id: number
    code: string
    nameEn: string
    nameAr: string
    gender: string
    specialtyId: number
    specialtyCode: string
    specialtyNameEn: string
    isActive: boolean
    licenseNumber: string
    licenseAuthority: string
    licenseExpiry: string | null
    createdAt: number | string
    updatedAt: number | string
}

export interface CreateDoctorPayload {
    code: string
    nameEn: string
    nameAr: string
    gender: string
    specialtyId: number
    licenseNumber: string
    licenseAuthority: string
    licenseExpiry?: string
}

export interface UpdateDoctorPayload {
    nameEn: string
    nameAr: string
    gender: string
    specialtyId: number
    isActive: boolean
    licenseNumber: string
    licenseAuthority: string
    licenseExpiry?: string | null
}
