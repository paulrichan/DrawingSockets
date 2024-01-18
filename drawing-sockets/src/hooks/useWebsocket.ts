import { useEffect, useMemo, useState } from 'react'

export default function useWebsocket(
	canvasRef: React.RefObject<HTMLCanvasElement>
) {
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [isConnected, setIsConnected] = useState(false)

	const userId = useMemo(() => {
		// create a random id
		const id = Math.random().toString(36).substring(7)
		return id
	}, [])

	// Set up for canvas
	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		const context = canvas.getContext('2d')

		if (!context) return

		context.strokeStyle = 'black'
		context.lineWidth = 2
		context.lineCap = 'round'

		// Resize canvas when window is resized
		function resizeCanvas() {
			const canvas = canvasRef.current

			if (!canvas) return

			// Create a temporary canvas obj to hold the current image
			const tempCanvas = document.createElement('canvas')
			const tempContext = tempCanvas.getContext('2d')

			// Set it to the new size
			tempCanvas.width = canvas.width
			tempCanvas.height = canvas.height

			// Draw the current canvas onto the temporary one
			if (tempContext) {
				tempContext.drawImage(canvas, 0, 0)
			}

			// Resize the canvas
			canvas.width = window.innerWidth
			canvas.height = window.innerHeight

			// Draw the temporary canvas data back onto the resized canvas
			const context = canvas.getContext('2d')
			if (context) {
				context.drawImage(tempCanvas, 0, 0)
			}
		}

		window.addEventListener('resize', resizeCanvas)

		return () => window.removeEventListener('resize', resizeCanvas)
	}, [canvasRef])

	useEffect(() => {
		const websocket = new WebSocket(import.meta.env.VITE_SOCKET_URL)
		websocket.onopen = () => {
			// console.log('connected')
			setIsConnected(true)
		}

		const canvas = canvasRef.current

		if (!canvas) return

		const context = canvas.getContext('2d')

		if (!context) return

		websocket.onmessage = (e) => {
			// if e.data is not a valid JSON string, return
			if (!e.data.includes('{')) {
				console.log(e)
				return
			}

			const data = JSON.parse(e.data)

			switch (data.type) {
				case 'start':
					context.beginPath()
					context.moveTo(data.data[0].x, data.data[0].y)
					break
				case 'draw':
					context.lineTo(data.data[0].x, data.data[0].y)
					context.strokeStyle = data.color
					context.stroke()
					break
				case 'stop':
					context.closePath()
					break
				case 'onload':
					data.data.forEach(
						(line: {
							data: string
							color: string | CanvasGradient | CanvasPattern
						}) => {
							const parsedLineData = JSON.parse(line.data)
							context.moveTo(
								parsedLineData[0].x,
								parsedLineData[0].y
							)
							context.beginPath()
							parsedLineData.forEach(
								(point: { x: number; y: number }) => {
									context.lineTo(point.x, point.y)
									context.strokeStyle = line.color
									context.stroke()
								}
							)
							context.closePath()
						}
					)
					break
				default:
					console.log('Unknown message type:', data)
			}
		}

		websocket.onclose = () => {
			// console.log('disconnected')
			setIsConnected(false)
		}

		setWs(websocket)
	}, [canvasRef])

	return { ws, isConnected, userId }
}
