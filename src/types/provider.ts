export type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED'

export type ProviderOwnership = 'PRIVATE' | 'PUBLIC' | 'GOVERNMENT' | 'MILITARY'

export interface ProviderTypeDetails {
    id: number
    code: string
    nameEn: string
    nameAr: string
    isActive: boolean
    createdAt: string | number | null
    updatedAt: string | number | null
    canAdmitPatients: boolean
    canPrescribeMedication: boolean
    requiresReferral: boolean
    effectiveFrom: string | number | null
    effectiveTo: string | number | null
}

export interface ProviderRecord {
    id: number
    code: string
    nameEn: string
    nameAr: string
    providerType: ProviderTypeDetails
    ownershipType: ProviderOwnership
    status: ProviderStatus
    taxNumber: string | null
    licenseNumber: string | null
    website: string | null
    notes: string | null
    createdAt: string | number | null
    updatedAt: string | number | null
}

export interface ProviderPayload {
    code?: string
    nameEn: string
    nameAr: string
    providerTypeId: number
    ownershipType: ProviderOwnership
    status?: ProviderStatus
    taxNumber?: string
    licenseNumber?: string
    website?: string
    notes?: string
}

export interface ProviderBranch {
    id: number
    providerId: number
    nameEn: string
    nameAr: string
    country: string
    city: string
    district: string
    street: string
    phone: string
    mobile: string
    email: string
    latitude: number | null
    longitude: number | null
    workingHours: Record<string, string>
    isMain: boolean
    isActive: boolean
}

export interface ProviderBranchPayload {
    providerId?: number
    nameEn: string
    nameAr: string
    country: string
    city: string
    district: string
    street: string
    phone: string
    mobile: string
    email: string
    latitude: number | null
    longitude: number | null
    workingHours: Record<string, string>
    isMain: boolean
    isActive?: boolean
}

export interface PaginatedResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
}

export interface ProviderDepartment {
    id: number
    providerId: number
    departmentId: number
    departmentCode: string
    nameEn: string
    nameAr: string
    isActive: boolean
}

export interface ProviderDepartmentPayload {
    providerId?: number
    departmentId: number
}

export interface ProviderDoctor {
    id: number
    providerId: number
    doctorId: number
    doctorCode: string
    doctorNameEn: string
    doctorNameAr: string
    mainSpecialtyId: number | null
    mainSpecialtyNameEn: string | null
    isActive: boolean
    joinType: string | null
    notes: string | null
}

export interface ProviderDoctorPayload {
    providerId?: number
    doctorId: number
    joinType?: string | null
    notes?: string | null
}

export interface ProviderDoctorUpdatePayload {
    isActive?: boolean
    joinType?: string | null
    notes?: string | null
}
