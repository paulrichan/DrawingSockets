import { FileRoute } from '@tanstack/react-router'
import DrawingCanvas from '../components/drawing-canvas'

export const Route = new FileRoute('/').createRoute({
	component: Home
})

function Home() {
	return (
		<div>
			<DrawingCanvas />
		</div>
	)
}
