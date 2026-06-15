import { PageTitle } from '@/components/title/page-title'

export function NotFound() {
	return (
		<>
			<PageTitle title='Not Found' />
			<div>
				<h1>404 - Página não encontrada</h1>
				<h3>
					Voltar para a <a href='/'>página inicial</a>
				</h3>
			</div>
		</>
	)
}
