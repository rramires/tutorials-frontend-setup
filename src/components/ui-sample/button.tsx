import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const button = tv({
	base: [
		'rounded-lg px-4 py-2 text-sm font-semibold shadow-sm outline-none',
		'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500',
		'active:opacity-80 cursor-pointer',
	],
	variants: {
		variant: {
			primary:
				'bg-slate-700 text-white hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500',
			outline:
				'border border-slate-600 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700',
			ghost: 'rounded-md px-2 shadow-none text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700',
		},
	},
	defaultVariants: {
		variant: 'primary',
	},
})

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof button>

export function Button({ variant, className, ...props }: ButtonProps) {
	return (
		<button {...props} className={button({ variant, class: className })} />
	)
}
