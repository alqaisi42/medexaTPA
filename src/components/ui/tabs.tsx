import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

type TabsProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    baseId?: string
}

const TabsBaseIdContext = React.createContext<string | undefined>(undefined)

const Tabs = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Root>,
    TabsProps
>(({ baseId: baseIdProp, ...props }, ref) => {
    const reactId = React.useId()
    const baseId =
        baseIdProp ??
        (typeof reactId === "string" ? reactId.replace(/:/g, "") : undefined)

    return (
        <TabsBaseIdContext.Provider value={baseId}>
            <TabsPrimitive.Root ref={ref} {...props} />
        </TabsBaseIdContext.Provider>
    )
})
Tabs.displayName = TabsPrimitive.Root.displayName

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-start rounded-none bg-tpa-secondary p-0 text-muted-foreground border-b",
            className
        )}
        {...props}
    />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, id: idProp, value, ...props }, ref) => {
    const baseId = React.useContext(TabsBaseIdContext)
    const triggerId =
        idProp ?? (baseId && value ? `${baseId}-trigger-${value}` : undefined)
    const contentId =
        props["aria-controls"] ??
        (baseId && value ? `${baseId}-content-${value}` : undefined)

    return (
        <TabsPrimitive.Trigger
            ref={ref}
            id={triggerId}
            aria-controls={contentId}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-tpa-primary",
                className
            )}
            value={value}
            {...props}
        />
    )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, id: idProp, value, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const baseId = React.useContext(TabsBaseIdContext)
    const triggerId =
        ariaLabelledBy ??
        (baseId && value ? `${baseId}-trigger-${value}` : undefined)
    const contentId =
        idProp ?? (baseId && value ? `${baseId}-content-${value}` : undefined)

    return (
        <TabsPrimitive.Content
            ref={ref}
            id={contentId}
            aria-labelledby={triggerId}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            value={value}
            {...props}
        />
    )
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }