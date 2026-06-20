import { ShieldX } from 'lucide-react'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'

export function Forbidden() {
	return (
		<>
			<PageTitle title='Forbidden' />

			<div className='flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
				<ShieldX className='text-muted-foreground size-10' />
				<div>
					<h2 className='text-2xl font-medium'>403 — Admins only</h2>
					<p className='text-muted-foreground text-sm'>
						You don&apos;t have access to this page.
					</p>
				</div>
				<Button asChild>
					<Link to='/'>Back to dashboard</Link>
				</Button>
			</div>
		</>
	)
}
