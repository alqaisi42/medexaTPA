export interface ICD {
    id: string
    code: string
    nameEn: string
    nameAr: string
    description?: string
    category: string
    parentIcd?: string
    relatedIcds?: string[]
    status: 'active' | 'inactive'
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface ICDRelation {
    id: string
    sourceIcdId: string
    targetIcdId: string
    relationType: 'cause_of' | 'complication_of' | 'synonym_of' | 'related_to'
    notes?: string
}
