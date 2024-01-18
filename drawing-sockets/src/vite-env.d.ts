/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_TITLE: string
	readonly VITE_SOCKET_URL: string
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

import { router } from './main'

declare module '@tankstack/react-router' {
	interface Register {
		router: typeof router
	}
}
