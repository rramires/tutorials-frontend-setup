import { PageTitle } from '@/components/title/page-title'

import { EmailCard } from './email-card'
import { ProfileCard } from './profile-card'

export function Account() {
	return (
		<>
			<PageTitle title='Account' />

			<div className='flex flex-1 flex-col items-center p-8'>
				<div className='flex w-full max-w-lg flex-col gap-6'>
					<ProfileCard />
					<EmailCard />
				</div>
			</div>
		</>
	)
}
