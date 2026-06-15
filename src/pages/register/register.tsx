import { PageTitle } from '@/components/title/page-title'

export function Register() {
	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		// Add register logic here
	}

	return (
		<>
			<PageTitle title='Register' />
			<div className='flex flex-1 items-center justify-center bg-slate-900 px-8 py-4 text-slate-100'>
				<div className='w-full max-w-md rounded-lg bg-slate-800 p-8 shadow-lg'>
					<h2 className='mb-6 text-center text-2xl font-medium'>
						Create account
					</h2>

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label
								htmlFor='name'
								className='mb-1 block text-sm font-medium'
							>
								Name
							</label>
							<input
								id='name'
								type='text'
								placeholder='Enter your name'
								className='w-full rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-slate-100 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden'
								required
							/>
						</div>

						<div>
							<label
								htmlFor='email'
								className='mb-1 block text-sm font-medium'
							>
								Email
							</label>
							<input
								id='email'
								type='email'
								placeholder='Enter your email'
								className='w-full rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-slate-100 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden'
								required
							/>
						</div>

						<div>
							<label
								htmlFor='password'
								className='mb-1 block text-sm font-medium'
							>
								Password
							</label>
							<input
								id='password'
								type='password'
								placeholder='Enter your password'
								className='w-full rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-slate-100 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden'
								required
							/>
						</div>

						<div>
							<label
								htmlFor='confirmPassword'
								className='mb-1 block text-sm font-medium'
							>
								Confirm password
							</label>
							<input
								id='confirmPassword'
								type='password'
								placeholder='Confirm your password'
								className='w-full rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-slate-100 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden'
								required
							/>
						</div>

						<button
							type='submit'
							/* disabled */
							className='mt-6 w-full rounded-md bg-blue-900 px-4 py-2 font-semibold text-white transition-colors enabled:cursor-pointer enabled:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60'
						>
							Register
						</button>
					</form>
				</div>
			</div>
		</>
	)
}
