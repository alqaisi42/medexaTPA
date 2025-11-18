export interface DrugForm {
    id: number
    drugId: number
    dosageForm: string
    route: string
    strengthValue: number
    strengthUnit: string
    isDefaultForm: boolean
    validFrom: string | null
    validTo: string | null
    isActive: boolean
}

export interface DrugFormPayload {
    drugId: number
    dosageForm: string
    route: string
    strengthValue: number
    strengthUnit: string
    isDefaultForm: boolean
    validFrom: string | null
    validTo: string | null
    isActive: boolean
}
