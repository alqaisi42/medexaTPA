// Card Template Types
export interface CardTemplate {
    id: number
    planId: number
    templateCode: string
    nameEn: string
    nameAr: string
    description: string
    templateType: string
    isActive: boolean
    isDefault: boolean
    layoutDefinition: LayoutDefinition
    createdAt: string
    updatedAt: string
}

export interface CardTemplatePayload {
    planId: number
    templateCode: string
    nameEn: string
    nameAr: string
    description: string
    templateType: string
    isActive: boolean
    isDefault: boolean
    layoutDefinition: LayoutDefinition
}

export interface CardTemplateUpdatePayload {
    nameEn: string
    nameAr: string
    description: string
    templateType: string
    isActive: boolean
    isDefault: boolean
    layoutDefinition: LayoutDefinition
}

export interface CardTemplateListResponse {
    success: boolean
    code: number
    message?: string
    data: {
        totalElements: number
        totalPages: number
        first: boolean
        last: boolean
        size: number
        content: CardTemplate[]
        number: number
        sort: {
            empty: boolean
            sorted: boolean
            unsorted: boolean
        }
        numberOfElements: number
        pageable: {
            offset: number
            sort: {
                empty: boolean
                sorted: boolean
                unsorted: boolean
            }
            paged: boolean
            pageSize: number
            pageNumber: number
            unpaged: boolean
        }
        empty: boolean
    }
    errors?: string[]
    timestamp: string
}

export interface CardTemplateResponse {
    success: boolean
    code: number
    message?: string
    data: CardTemplate
    errors?: string[]
    timestamp: string
}

// Layout Definition Types
export interface LayoutDefinition {
    version: number
    cardSize: {
        width: number
        height: number
    }
    pages: CardPage[]
}

export interface CardPage {
    name: string
    backgroundColor: string
    elements: CardElement[]
}

export interface CardElement {
    id: string
    type: ElementType
    x: number
    y: number
    width?: number
    height?: number
    props: ElementProps
}

export type ElementType = 'TEXT' | 'IMAGE' | 'QRCODE' | 'BARCODE' | 'SHAPE' | 'TABLE'

export interface ElementProps {
    // Text properties
    text?: string
    binding?: string
    fontSize?: number
    fontWeight?: string
    fontFamily?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    
    // Image properties
    source?: string
    alt?: string
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none'
    lockAspectRatio?: boolean
    lastUpdated?: number
    
    // Shape properties
    shape?: 'rectangle' | 'circle' | 'line'
    borderColor?: string
    borderWidth?: number
    fillColor?: string
    
    // QR/Barcode properties
    data?: string
    format?: string
    
    // Table properties
    rows?: number
    columns?: number
    headers?: string[]
    data?: any[][]
    
    // Common properties
    opacity?: number
    rotation?: number
    borderRadius?: number
    shadow?: boolean
}

// Binding Types for dynamic data
export type DataBinding = 
    | 'MEMBER_FULL_NAME'
    | 'MEMBER_FIRST_NAME'
    | 'MEMBER_LAST_NAME'
    | 'MEMBER_ID'
    | 'MEMBER_CARD_NUMBER'
    | 'MEMBER_QR_URL'
    | 'MEMBER_BARCODE'
    | 'PLAN_NAME'
    | 'PLAN_CODE'
    | 'CONTRACT_NUMBER'
    | 'EXPIRY_DATE'
    | 'ISSUE_DATE'
    | 'TPA_LOGO'
    | 'TPA_NAME'
    | 'TPA_HOTLINE'
    | 'NETWORK_LOGO'
    | 'EMERGENCY_CONTACT'

// Editor State Types
export interface EditorState {
    selectedElementId: string | null
    selectedPageIndex: number
    zoom: number
    showGrid: boolean
    showRulers: boolean
    isDragging: boolean
    isResizing: boolean
    lastUpdate?: number
}

export interface ToolboxItem {
    id: string
    type: ElementType
    icon: string
    label: string
    defaultProps: Partial<ElementProps>
}

// Template Types
export type TemplateType = 'PHYSICAL' | 'DIGITAL' | 'BOTH'

export const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
    { value: 'PHYSICAL', label: 'Physical Card' },
    { value: 'DIGITAL', label: 'Digital Card' },
    { value: 'BOTH', label: 'Physical & Digital' },
]

// Standard card sizes (in pixels at 300 DPI)
export const CARD_SIZES = {
    STANDARD: { width: 1012, height: 638, name: 'Standard (85.6 × 53.98mm)' },
    MINI: { width: 850, height: 540, name: 'Mini (72.2 × 45.9mm)' },
    LARGE: { width: 1200, height: 750, name: 'Large (101.6 × 63.5mm)' },
} as const

// Data binding options
export const DATA_BINDINGS: { value: DataBinding; label: string; category: string }[] = [
    // Member Information
    { value: 'MEMBER_FULL_NAME', label: 'Member Full Name', category: 'Member' },
    { value: 'MEMBER_FIRST_NAME', label: 'Member First Name', category: 'Member' },
    { value: 'MEMBER_LAST_NAME', label: 'Member Last Name', category: 'Member' },
    { value: 'MEMBER_ID', label: 'Member ID', category: 'Member' },
    { value: 'MEMBER_CARD_NUMBER', label: 'Card Number', category: 'Member' },
    { value: 'MEMBER_QR_URL', label: 'QR Code Data', category: 'Member' },
    { value: 'MEMBER_BARCODE', label: 'Barcode Data', category: 'Member' },
    
    // Plan Information
    { value: 'PLAN_NAME', label: 'Plan Name', category: 'Plan' },
    { value: 'PLAN_CODE', label: 'Plan Code', category: 'Plan' },
    { value: 'CONTRACT_NUMBER', label: 'Contract Number', category: 'Plan' },
    
    // Dates
    { value: 'EXPIRY_DATE', label: 'Expiry Date', category: 'Dates' },
    { value: 'ISSUE_DATE', label: 'Issue Date', category: 'Dates' },
    
    // TPA Information
    { value: 'TPA_LOGO', label: 'TPA Logo', category: 'TPA' },
    { value: 'TPA_NAME', label: 'TPA Name', category: 'TPA' },
    { value: 'TPA_HOTLINE', label: 'TPA Hotline', category: 'TPA' },
    { value: 'EMERGENCY_CONTACT', label: 'Emergency Contact', category: 'TPA' },
    
    // Network
    { value: 'NETWORK_LOGO', label: 'Network Logo', category: 'Network' },
]
