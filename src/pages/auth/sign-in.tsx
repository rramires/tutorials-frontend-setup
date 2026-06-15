import { PageTitle } from '@/components/title/page-title'

export function SignIn() {
	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		// Add login logic here
	}

	return (
		<>
			<PageTitle title='Sign In' />
			<div className='flex flex-1 items-center justify-center bg-slate-900 px-8 py-4 text-slate-100'>
				<div className='w-full max-w-md rounded-lg bg-slate-800 p-8 shadow-lg'>
					<h2 className='mb-6 text-center text-2xl font-medium'>
						Login
					</h2>

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label
								htmlFor='username'
								className='mb-1 block text-sm font-medium'
							>
								Username
							</label>
							<input
								id='username'
								type='text'
								placeholder='Enter your username'
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

						<button
							type='submit'
							/* disabled */
							className='mt-6 w-full rounded-md bg-blue-900 px-4 py-2 font-semibold text-white transition-colors enabled:cursor-pointer enabled:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60'
						>
							Login
						</button>
					</form>
				</div>
			</div>
		</>
	)
}
