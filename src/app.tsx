export function App() {
	const lang = navigator.language
	if (lang) {
		console.log(`Hello World from ${lang}!`)
	}

	return (
		<>
			<h1>Hello World !!!</h1>
		</>
	)
}
