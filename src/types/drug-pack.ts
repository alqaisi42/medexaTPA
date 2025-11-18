export interface DrugPack {
    id: number
    drugFormId: number
    packCode: string
    unitOfMeasure: string
    unitsPerPack: number
    minDispenseQuantity: number
    maxDispenseQuantity: number
    isSplitAllowed: boolean
    validFrom: string | null
    validTo: string | null
    isActive: boolean
}

export interface DrugPackPayload {
    drugFormId: number
    packCode: string
    unitOfMeasure: string
    unitsPerPack: number
    minDispenseQuantity: number
    maxDispenseQuantity: number
    isSplitAllowed: boolean
    validFrom: string | null
    validTo: string | null
    isActive: boolean
}

export interface DrugFormPackStructure {
    form: {
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
    packs: DrugPack[]
}
