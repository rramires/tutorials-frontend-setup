import { type ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

/* Container: border and focus around the entire field */

type InputContainerProps = ComponentProps<'div'>
export function InputContainer({ className, ...props }: InputContainerProps) {
	return (
		<div
			className={twMerge(
				'flex w-full items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 shadow-sm',
				'focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-400/20',
				'dark:border-slate-600 dark:bg-slate-700 dark:focus-within:border-slate-300',
				className,
			)}
			{...props}
		/>
	)
}

/* Asset: icon or element before/after the field */

type InputAssetProps = ComponentProps<'div'>
export function InputAsset(props: InputAssetProps) {
	return <div {...props} />
}

/* Control: the input itself, without its own border */

type InputControlProps = ComponentProps<'input'>
export function InputControl(props: InputControlProps) {
	return (
		<input
			className='flex-1 border-0 bg-transparent p-0 text-slate-900 placeholder-slate-500 outline-none dark:text-slate-100 dark:placeholder-slate-400'
			{...props}
		/>
	)
}
