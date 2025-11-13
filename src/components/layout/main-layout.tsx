'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, ChevronDown, X, Menu, LogOut, User } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NavigationItem, TabItem } from '@/types'

interface MainLayoutProps {
    children?: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const sidebarExpanded = useAppStore((state) => state.sidebarExpanded)
    const toggleSidebar = useAppStore((state) => state.toggleSidebar)
    const navigationItems = useAppStore((state) => state.navigationItems)
    const expandNavigationItem = useAppStore((state) => state.expandNavigationItem)
    const tabs = useAppStore((state) => state.tabs)
    const activeTabId = useAppStore((state) => state.activeTabId)
    const addTab = useAppStore((state) => state.addTab)
    const removeTab = useAppStore((state) => state.removeTab)
    const setActiveTab = useAppStore((state) => state.setActiveTab)
    const language = useAppStore((state) => state.language)

    const flattenedNavigation = useMemo(() => {
        const result: NavigationItem[] = []

        const traverse = (items: NavigationItem[]) => {
            items.forEach((item) => {
                result.push(item)
                if (item.children) {
                    traverse(item.children)
                }
            })
        }

        traverse(navigationItems)
        return result
    }, [navigationItems])

    // Navigate to a page and open it in a tab
    const handleNavigate = (item: NavigationItem) => {
        if (item.path) {
            const tab: TabItem = {
                id: item.id,
                title: item.label,
                component: item.path,
                icon: item.icon,
                closable: item.id !== 'dashboard'
            }
            addTab(tab)
            setActiveTab(tab.id)
            router.push(item.path)
        }
    }

    useEffect(() => {
        if (!pathname) {
            return
        }

        const matchedItem = flattenedNavigation.find((item) => item.path === pathname)
        if (matchedItem) {
            addTab({
                id: matchedItem.id,
                title: matchedItem.label,
                component: matchedItem.path!,
                icon: matchedItem.icon,
                closable: matchedItem.id !== 'dashboard'
            })
            setActiveTab(matchedItem.id)
        }
    }, [pathname, flattenedNavigation, addTab, setActiveTab])

    useEffect(() => {
        const activeTab = tabs.find((tab) => tab.id === activeTabId)
        if (activeTab?.component && activeTab.component !== pathname) {
            router.push(activeTab.component)
        }
    }, [activeTabId, tabs, pathname, router])

    // Render navigation tree recursively
    const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = item.expanded
        const IconComponent = item.icon ? (Icons as any)[item.icon] : null
        const isActive = activeTabId === item.id

        return (
            <div key={item.id} className="select-none">
                <div
                    className={cn(
                        "flex items-center py-1.5 px-2 cursor-pointer hover:bg-tpa-secondary transition-colors",
                        isActive && "bg-tpa-accent text-white",
                        level === 0 && "font-semibold"
                    )}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => {
                        if (hasChildren) {
                            expandNavigationItem(item.id)
                        } else {
                            handleNavigate(item)
                        }
                    }}
                >
                    {hasChildren && (
                        <span className="mr-1">
              {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
              ) : (
                  <ChevronRight className="w-4 h-4" />
              )}
            </span>
                    )}
                    {!hasChildren && <span className="w-5" />}

                    {IconComponent && (
                        <IconComponent className="w-4 h-4 mr-2" />
                    )}

                    <span className="flex-1 text-sm">{item.label}</span>

                    {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
              {item.badge}
            </span>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="border-l ml-4">
                        {item.children!.map(child => renderNavigationItem(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Header Bar */}
            <header className="window-header h-16 flex items-center px-4 text-white shadow-md">
                <div className="flex items-center space-x-4">
                    <Button
                        onClick={toggleSidebar}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="text-lg font-bold">MEDEXA</div>
                    <div className="text-sm opacity-80">System User</div>
                </div>

                <div className="flex-1 text-center">
                    <h1 className="text-xl font-semibold">Health Insurance TPA System</h1>
                </div>

                <div className="flex items-center space-x-4">
          <span className="text-sm">{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
          })}</span>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                    >
                        <User className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <aside
                    className={cn(
                        "bg-white border-r border-gray-300 transition-all duration-300 overflow-y-auto",
                        sidebarExpanded ? "w-72" : "w-0"
                    )}
                >
                    {sidebarExpanded && (
                        <div className="py-2">
                            {navigationItems.map(item => renderNavigationItem(item))}
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Tab Bar */}
                    {tabs.length > 0 && (
                        <div className="bg-tpa-secondary border-b border-gray-300 flex items-center overflow-x-auto">
                            <div className="flex items-center">
                                {tabs.map(tab => {
                                    const TabIcon = tab.icon ? (Icons as any)[tab.icon] : null

                                    return (
                                        <div
                                            key={tab.id}
                                            className={cn(
                                                "flex items-center px-3 py-2 border-r border-gray-300 cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                                                activeTabId === tab.id
                                                    ? "bg-white border-b-2 border-tpa-primary"
                                                    : "hover:bg-gray-100"
                                            )}
                                            onClick={() => {
                                                setActiveTab(tab.id)
                                                router.push(tab.component)
                                            }}
                                        >
                                            {TabIcon && <TabIcon className="w-4 h-4 mr-2" />}
                                            <span className="text-sm truncate flex-1">{tab.title}</span>
                                            {tab.closable && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeTab(tab.id)
                                                    }}
                                                    className="ml-2 p-0.5 hover:bg-gray-200 rounded"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-gray-50">
                        {children}
                    </div>
                </main>
            </div>

            {/* Status Bar */}
            <footer className="h-8 bg-gray-200 border-t border-gray-300 flex items-center px-4">
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Record: 1/1</span>
                    <span>|</span>
                    <span className={language === 'ar' ? 'font-bold' : ''}>
            {language === 'ar' ? 'عربي' : 'English'}
          </span>
                </div>

                <div className="flex-1 text-center text-xs text-gray-600">
                    <span>CoreTech Solutions © 2024</span>
                </div>

                <div className="text-xs text-gray-600">
                    <span>Exit</span>
                </div>
            </footer>
        </div>
    )
}