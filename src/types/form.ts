export interface SelectOption {
    value: string
    label: string
    labelAr?: string
}

export interface FormField {
    name: string
    label: string
    labelAr?: string
    type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'radio' | 'textarea'
    placeholder?: string
    required?: boolean
    options?: SelectOption[]
    validation?: any
    gridColumn?: string
}
