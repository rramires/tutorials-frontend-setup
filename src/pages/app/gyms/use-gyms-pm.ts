import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getNearbyGyms } from '@/api/get-nearby-gyms'
import { searchGyms } from '@/api/search-gyms'
import { type Coordinates, getCurrentPosition } from '@/lib/geolocation'

const MIN_QUERY = 3
const PAGE_SIZE = 20

export type GymsStatus =
	| 'locating'
	| 'geo-denied'
	| 'loading'
	| 'empty'
	| 'list'

export function useGymsPM() {
	const [coords, setCoords] = useState<Coordinates | null>(null)
	const [geoError, setGeoError] = useState(false)
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)

	// On mount: ask for the user's location. Granted → show nearby gyms;
	// denied/unavailable → fall back to search-by-name only.
	useEffect(() => {
		getCurrentPosition()
			.then((position) => setCoords(position))
			.catch(() => setGeoError(true))
	}, [])

	const trimmed = query.trim()
	const searching = trimmed.length >= MIN_QUERY

	const nearby = useQuery({
		queryKey: ['gyms', 'nearby', coords],
		queryFn: () => getNearbyGyms(coords!),
		enabled: coords !== null && !searching,
	})

	const search = useQuery({
		queryKey: ['gyms', 'search', trimmed, page],
		queryFn: () => searchGyms({ query: trimmed, page }),
		enabled: searching,
	})

	const active = searching ? search : nearby
	const gyms = active.data ?? []

	let status: GymsStatus
	if (active.isLoading) {
		status = 'loading'
	} else if (!coords && !geoError && !searching) {
		status = 'locating'
	} else if (geoError && !searching) {
		status = 'geo-denied'
	} else if (gyms.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	function handleQueryChange(value: string) {
		setQuery(value)
		setPage(1)
	}

	return {
		query,
		page,
		gyms,
		status,
		searching,
		hasPrevPage: searching && page > 1,
		hasNextPage: searching && gyms.length === PAGE_SIZE,
		handleQueryChange,
		nextPage: () => setPage((current) => current + 1),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
	}
}
