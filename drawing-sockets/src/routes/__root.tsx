import { Outlet, RootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = new RootRoute({
	component: RootComponent
})

const isDev = import.meta.env.DEV

function RootComponent() {
	return (
		<>
			<Outlet />
			{isDev && <TanStackRouterDevtools position="bottom-right" />}
		</>
	)
}
