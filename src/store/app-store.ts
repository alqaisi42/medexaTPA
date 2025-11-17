import { create } from 'zustand'
import { NavigationItem, TabItem } from '@/types'

interface AppState {
    // Navigation state
    sidebarExpanded: boolean
    toggleSidebar: () => void
    navigationItems: NavigationItem[]
    setNavigationItems: (items: NavigationItem[]) => void
    expandNavigationItem: (itemId: string) => void

    // Tab management
    tabs: TabItem[]
    activeTabId: string
    addTab: (tab: TabItem) => void
    removeTab: (tabId: string) => void
    setActiveTab: (tabId: string) => void
    updateTab: (tabId: string, updates: Partial<TabItem>) => void

    // Global loading state
    isLoading: boolean
    setLoading: (loading: boolean) => void

    // User preferences
    language: 'en' | 'ar'
    setLanguage: (lang: 'en' | 'ar') => void

    // Selected items for batch operations
    selectedItems: string[]
    setSelectedItems: (items: string[]) => void
    toggleSelectedItem: (itemId: string) => void
    clearSelectedItems: () => void
}

const HOME_TAB: TabItem = {
    id: 'dashboard',
    title: 'Dashboard',
    component: '/',
    icon: 'Home',
    closable: false,
}

export const useAppStore = create<AppState>((set) => ({
    // Navigation state
    sidebarExpanded: true,
    toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

    navigationItems: [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'Home',
            path: '/',
        },
        {
            id: 'main-menu',
            label: 'Main Menu',
            expanded: true,
            children: [
                {
                    id: 'favorites',
                    label: 'Favourites',
                    icon: 'Star',
                    children: [],
                },
                {
                    id: 'setup',
                    label: 'Setup',
                    icon: 'Settings',
                    children: [],
                },
                {
                    id: 'basic-definitions',
                    label: 'Basic Definitions',
                    icon: 'Database',
                    expanded: true,
                    children: [
                        {
                            id: 'procedures-price-lists',
                            label: 'Procedures Price Lists',
                            icon: 'DollarSign',
                            path: '/procedures-price-lists',
                        },
                        {
                            id: 'international-classifications',
                            label: 'International Classifications',
                            icon: 'Globe',
                            path: '/icd-management',
                        },
                        {
                            id: 'procedures-info',
                            label: 'Procedures Info',
                            icon: 'Activity',
                            path: '/procedures-management',
                        },
                        {
                            id: 'lookup-management',
                            label: 'Lookup Management',
                            icon: 'List',
                            path: '/lookup-management',
                        },
                        {
                            id: 'specialties',
                            label: 'Specialties',
                            icon: 'Stethoscope',
                            path: '/specialties',
                        },
                        {
                            id: 'combination-builder',
                            label: 'Combination Builder',
                            icon: 'Grid3X3',
                            path: '/combination-builder',
                        },
                    ],
                },
                {
                    id: 'medical-providers',
                    label: 'Medical Providers Info.',
                    icon: 'Building2',
                    children: [],
                },
                {
                    id: 'subscribers',
                    label: 'Subscribers Info.',
                    icon: 'Users',
                    children: [],
                },
                {
                    id: 'pre-approval',
                    label: 'Pre Approval',
                    icon: 'CheckCircle',
                    children: [],
                },
                {
                    id: 'claims',
                    label: 'Claims Info.',
                    icon: 'FileText',
                    children: [],
                },
                {
                    id: 'contracts',
                    label: 'Contracts Info.',
                    icon: 'FileSignature',
                    children: [],
                },
                {
                    id: 'integration',
                    label: 'Integration',
                    icon: 'Link',
                    children: [],
                },
            ],
        },
    ],

    setNavigationItems: (items) => set({ navigationItems: items }),

    expandNavigationItem: (itemId) => set((state) => {
        const toggleExpanded = (items: NavigationItem[]): NavigationItem[] =>
            items.map((item) => {
                if (item.id === itemId) {
                    return { ...item, expanded: !item.expanded }
                }
                if (item.children) {
                    return { ...item, children: toggleExpanded(item.children) }
                }
                return item
            })

        return { navigationItems: toggleExpanded(state.navigationItems) }
    }),

    // Tab management
    tabs: [HOME_TAB],
    activeTabId: HOME_TAB.id,

    addTab: (tab) => set((state) => {
        const existingTab = state.tabs.find((t) => t.id === tab.id)
        if (existingTab) {
            return { activeTabId: tab.id }
        }

        return {
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
        }
    }),

    removeTab: (tabId) => {
        if (tabId === HOME_TAB.id) {
            return
        }

        set((state) => {
            const newTabs = state.tabs.filter((t) => t.id !== tabId)
            if (newTabs.length === 0) {
                return {
                    tabs: [HOME_TAB],
                    activeTabId: HOME_TAB.id,
                }
            }

            const removedIndex = state.tabs.findIndex((t) => t.id === tabId)
            const fallbackIndex = Math.max(removedIndex - 1, 0)
            const fallbackTab = newTabs[fallbackIndex] ?? newTabs[0]

            return {
                tabs: newTabs,
                activeTabId: fallbackTab.id,
            }
        })
    },

    setActiveTab: (tabId) => set({ activeTabId: tabId }),

    updateTab: (tabId, updates) =>
        set((state) => ({
            tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
        })),

    // Global loading state
    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading }),

    // User preferences
    language: 'en',
    setLanguage: (language) => set({ language }),

    // Selected items
    selectedItems: [],
    setSelectedItems: (items) => set({ selectedItems: items }),
    toggleSelectedItem: (itemId) =>
        set((state) => {
            const isSelected = state.selectedItems.includes(itemId)
            return {
                selectedItems: isSelected
                    ? state.selectedItems.filter((id) => id !== itemId)
                    : [...state.selectedItems, itemId],
            }
        }),
    clearSelectedItems: () => set({ selectedItems: [] }),
}))
