import * as React from 'react'

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
	const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
	mql.addEventListener('change', callback)
	return () => mql.removeEventListener('change', callback)
}

export function useIsMobile() {
	// useSyncExternalStore reads the media query without a setState-in-effect,
	// which keeps our react-hooks lint rule happy (vs. shadcn's default hook).
	return React.useSyncExternalStore(
		subscribe,
		() => window.innerWidth < MOBILE_BREAKPOINT,
		() => false,
	)
}
