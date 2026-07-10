import * as React from 'react';
import { cn } from '@/utils/classnames';
import { PanelLeftIcon } from '@/sidebar/components/icons';

/**
 * A dependency-light re-implementation of the shadcn/ui `Sidebar` component
 * family (SidebarProvider, Sidebar, SidebarMenu, …). It mirrors shadcn's API,
 * data-attributes, and `--sidebar-*` CSS-variable theming, and supports the
 * `collapsible="icon"` behavior + ⌘/Ctrl+B shortcut — without pulling in
 * Radix, CVA, or an icon library (this extension deliberately ships neither).
 *
 * Scope: the pieces the Dashboard actually uses. Left side, `variant="sidebar"`
 * and `collapsible="icon"` are the supported combination.
 */

const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const SIDEBAR_STORAGE_KEY = 'lcrm:sidebar:open';

type SidebarContextValue = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.');
  return context;
}

/** A tiny Slot: renders `children` merging in the given props (className concatenated). */
const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) return null;
    const child = children as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(child, {
      ...props,
      ...child.props,
      ref,
      className: cn(props.className as string, child.props.className as string),
    });
  }
);
Slot.displayName = 'Slot';

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [openMobile, setOpenMobile] = React.useState(false);

  const [internalOpen, setInternalOpen] = React.useState(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === null ? defaultOpen : stored === 'true';
  });
  const open = openProp ?? internalOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) onOpenChange(value);
      else setInternalOpen(value);
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
      } catch {
        // storage may be unavailable; the sidebar just won't persist.
      }
    },
    [onOpenChange]
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v);
    else setOpen(!open);
  }, [isMobile, open, setOpen]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);

  const state: 'expanded' | 'collapsed' = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<SidebarContextValue>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn('group/sidebar-wrapper flex min-h-svh w-full text-neutral-900 dark:text-neutral-50', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  side = 'left',
  collapsible = 'icon',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        className={cn('flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground', className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setOpenMobile(false)}
            aria-hidden
          />
        )}
        <div
          data-mobile="true"
          data-state={openMobile ? 'open' : 'closed'}
          style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
          className={cn(
            'fixed inset-y-0 z-50 flex h-svh w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground shadow-panel transition-transform duration-200 md:hidden',
            side === 'left' ? 'left-0' : 'right-0',
            openMobile ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full'
          )}
        >
          {children}
        </div>
      </>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-side={side}
    >
      {/* Spacer that reserves layout width and animates on collapse. */}
      <div
        className={cn(
          'relative h-svh w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[collapsible=icon]:w-[--sidebar-width-icon]'
        )}
      />
      <div
        className={cn(
          'fixed inset-y-0 z-30 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
          side === 'left' ? 'border-r border-sidebar-border' : 'border-l border-sidebar-border',
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className="flex h-full w-full flex-col bg-sidebar group-data-[collapsible=icon]:items-center"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      data-sidebar="trigger"
      aria-label="Toggle Sidebar"
      title="Toggle Sidebar (Ctrl/⌘ B)"
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50',
        className
      )}
      {...props}
    >
      <PanelLeftIcon />
    </button>
  );
}

export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
        className
      )}
      {...props}
    />
  );
}

export function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return <main className={cn('relative flex min-h-svh flex-1 flex-col', className)} {...props} />;
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-sidebar="header" className={cn('flex flex-col gap-2 p-2', className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-sidebar="footer" className={cn('flex flex-col gap-2 p-2', className)} {...props} />;
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-2 my-1 h-px bg-sidebar-border', className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-sidebar="content"
      className={cn(
        'lcrm-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-sidebar="group" className={cn('relative flex w-full min-w-0 flex-col p-2', className)} {...props} />;
}

export function SidebarGroupLabel({
  className,
  asChild,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-sidebar="group-label"
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/70 transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupAction({
  className,
  asChild,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-sidebar="group-action"
      className={cn(
        'absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden',
        className
      )}
      {...(props as Record<string, unknown>)}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-sidebar="group-content" className={cn('w-full text-sm', className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-sidebar="menu" className={cn('flex w-full min-w-0 flex-col gap-1', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-sidebar="menu-item" className={cn('group/menu-item relative', className)} {...props} />;
}

export function SidebarMenuButton({
  asChild,
  isActive = false,
  size = 'default',
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  size?: 'default' | 'sm' | 'lg';
}) {
  const Comp = asChild ? Slot : 'button';
  const sizes = {
    default: 'h-8 text-sm',
    sm: 'h-7 text-xs',
    lg: 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
  } as const;
  return (
    <Comp
      data-sidebar="menu-button"
      data-active={isActive}
      className={cn(
        'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2',
        'active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground',
        'group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!p-2',
        '[&>svg]:size-4 [&>svg]:shrink-0 [&>span:last-child]:truncate',
        sizes[size],
        className
      )}
      {...(props as Record<string, unknown>)}
    />
  );
}

export function SidebarMenuAction({
  className,
  asChild,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean; showOnHover?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-sidebar="menu-action"
      className={cn(
        'absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md text-sidebar-foreground outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'opacity-0 focus-within:opacity-100 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
        className
      )}
      {...(props as Record<string, unknown>)}
    />
  );
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-sidebar="menu-badge"
      className={cn(
        'pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground/70',
        'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
        'top-1.5 group-data-[collapsible=icon]:hidden',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuSkeleton({ className, ...props }: React.ComponentProps<'div'>) {
  const width = React.useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);
  return (
    <div
      data-sidebar="menu-skeleton"
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      {...props}
    >
      <div className="h-4 w-4 shrink-0 animate-pulse rounded-md bg-sidebar-foreground/10" />
      <div
        className="h-4 max-w-[--skeleton-width] flex-1 animate-pulse rounded-md bg-sidebar-foreground/10"
        style={{ '--skeleton-width': width } as React.CSSProperties}
      />
    </div>
  );
}
