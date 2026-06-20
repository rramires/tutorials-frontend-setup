import { Outlet } from 'react-router'

import { AppSidebar } from '@/components/app-sidebar/app-sidebar'
import { VerifyEmailBanner } from '@/components/auth/verify-email-banner/verify-email-banner'
import { ModeToggle } from '@/components/theme/mode-toggle'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppLayout() {
	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
						<SidebarTrigger />
						<div className='flex-1' />
						<ModeToggle />
					</header>
					<VerifyEmailBanner />
					<div className='flex flex-1 flex-col'>
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	)
}
