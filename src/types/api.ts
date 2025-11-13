export interface ApiResponse<T> {
    success: boolean
    code: number
    message: string
    data?: T
    errors?: string[]
    timestamp: string
}

export interface PaginatedResponse<T> {
    totalPages: number
    totalElements: number
    first: boolean
    last: boolean
    size: number
    content: T[]
    number: number
    sort?: {
        empty: boolean
        sorted: boolean
        unsorted: boolean
    }
    numberOfElements: number
    pageable?: {
        offset: number
        pageNumber: number
        pageSize: number
        paged: boolean
        unpaged: boolean
        sort?: {
            empty: boolean
            sorted: boolean
            unsorted: boolean
        }
    }
    empty: boolean
}
