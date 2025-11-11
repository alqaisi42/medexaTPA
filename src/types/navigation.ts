export interface NavigationItem {
    id: string
    label: string
    icon?: string
    path?: string
    children?: NavigationItem[]
    badge?: string | number
    expanded?: boolean
}
