export interface Provider {
    id: string
    code: string
    name: string
    type: 'hospital' | 'clinic' | 'lab' | 'pharmacy'
    networkTier: 'preferred' | 'standard' | 'out_of_network'
    specialties: string[]
    active: boolean
}
