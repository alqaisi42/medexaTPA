import { ICD } from './icd'

export interface IcdComplication {
    id: number
    source: ICD
    complication: ICD
    notes?: string | null
    severity?: number | null
}

export interface CreateIcdComplicationPayload {
    sourceIcdId: number
    complicationIcdId: number
    notes?: string
    severity?: number
}

export interface DeleteIcdComplicationPayload {
    sourceIcdId: number
    complicationIcdId: number
}

