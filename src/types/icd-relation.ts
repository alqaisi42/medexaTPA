import { ICD } from './icd'

export interface IcdRelationType {
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

export interface IcdRelation {
    id: number
    sourceIcd: ICD
    targetIcd: ICD
    relationType: IcdRelationType
    note?: string
    effectiveFrom?: string
    effectiveTo?: string
    isActive: boolean
    createdAt?: string
    createdBy?: string
    updatedAt?: string
    updatedBy?: string
}

export interface CreateIcdRelationPayload {
    sourceIcdId: number
    targetIcdId: number
    relationTypeCode: string
    note?: string
    effectiveFrom?: string
    effectiveTo?: string
}
