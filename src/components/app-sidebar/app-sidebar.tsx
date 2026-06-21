import { GlobeCheck, LogOut } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from '@/components/ui/sidebar'

import { useAppSidebarPM } from './use-app-sidebar-pm'

export function AppSidebar() {
	const pm = useAppSidebarPM()

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader>
				<div className='flex items-center gap-2 px-2 py-1'>
					<GlobeCheck className='text-primary size-6 shrink-0' />
					<span className='truncate font-bold group-data-[collapsible=icon]:hidden'>
						Gympass Sample App
					</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{pm.items.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										asChild
										isActive={pm.pathname === item.to}
										tooltip={item.label}
									>
										<Link to={item.to}>
											<item.icon />
											<span>{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				{pm.adminItems.length > 0 && (
					<SidebarGroup>
						<SidebarGroupLabel>Admin</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{pm.adminItems.map((item) => (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											asChild
											isActive={pm.pathname === item.to}
											tooltip={item.label}
										>
											<Link to={item.to}>
												<item.icon />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			<SidebarFooter>
				<div className='flex flex-col gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden'>
					<div className='flex items-center justify-between gap-2'>
						<span className='truncate text-sm font-medium'>
							{pm.user?.username}
						</span>
						<Badge
							variant={
								pm.user?.role === 'ADMIN'
									? 'default'
									: 'secondary'
							}
						>
							{pm.user?.role === 'ADMIN' ? 'Admin' : 'Member'}
						</Badge>
					</div>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.handleSignOut}
					>
						<LogOut />
						Sign out
					</Button>
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	)
}
