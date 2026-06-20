export interface Coordinates {
	latitude: number
	longitude: number
}

// Promise wrapper around the callback-based Geolocation API. Reused by the gyms
// page (find nearby on load) and the create-gym form ("use my location").
export function getCurrentPosition(): Promise<Coordinates> {
	return new Promise((resolve, reject) => {
		if (!('geolocation' in navigator)) {
			reject(new Error('Geolocation is not supported by this browser.'))
			return
		}

		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				}),
			(error) => reject(error),
		)
	})
}
