import { useRef, useEffect, useState } from 'react'
import useWebsocket from '../hooks/useWebsocket'

function DrawingCanvas() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const serverCanvasRef = useRef<HTMLCanvasElement | null>(null)

	// State for drawing
	const [isDrawing, setIsDrawing] = useState(false)
	const [color, setColor] = useState('black')
	const [lineId, setLineId] = useState<string | null>(null)
	const [currentLine, setCurrentLine] = useState<{ x: number; y: number }[]>(
		[]
	)

	// Websocket hook
	const { ws, isConnected, userId } = useWebsocket(serverCanvasRef)

	const isConnectedStyles = {
		ping: isConnected ? 'bg-green-500' : 'bg-red-500'
	}

	// Handle color changes
	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		const context = canvas.getContext('2d')

		if (!context) return

		context.strokeStyle = color
	}, [color])

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

			canvas.width = window.innerWidth
			canvas.height = window.innerHeight
		}

		window.addEventListener('resize', resizeCanvas)

		return () => window.removeEventListener('resize', resizeCanvas)
	}, [])

	// Function to start drawing
	const startDrawing = (e: any) => {
		const canvas = canvasRef.current

		if (!canvas) return

		const context = canvas.getContext('2d')

		if (!context) return

		const isTouchEvent = e.type.startsWith('touch')

		context.beginPath()

		const xPos =
			(isTouchEvent ? e.touches[0].clientX : e.clientX) -
			canvas.offsetLeft
		const yPos =
			(isTouchEvent ? e.touches[0].clientY : e.clientY) - canvas.offsetTop

		// Set current line
		const dataPoints = [{ x: xPos, y: yPos }]
		setCurrentLine(dataPoints)

		// Generate a random ID for the line
		const id = crypto.randomUUID()
		setLineId(id)

		if (!ws) return

		ws.send(
			JSON.stringify({
				type: 'start',
				data: [
					{
						x: xPos,
						y: yPos
					}
				],
				color,
				userId,
				id
			})
		)
		context.moveTo(xPos, yPos)
		setIsDrawing(true)
	}

	// Function to draw
	const draw = (e: any) => {
		if (!isDrawing) return

		const canvas = canvasRef.current

		if (!canvas) return

		const context = canvas.getContext('2d')

		const isTouchEvent = e.type.startsWith('touch')
		const xPos =
			(isTouchEvent ? e.touches[0].clientX : e.clientX) -
			canvas.offsetLeft
		const yPos =
			(isTouchEvent ? e.touches[0].clientY : e.clientY) - canvas.offsetTop

		// Update current line
		const dataPoints = [...currentLine, { x: xPos, y: yPos }]
		setCurrentLine(dataPoints)

		if (!ws) return

		ws.send(
			JSON.stringify({
				type: 'draw',
				data: [
					{
						x: xPos,
						y: yPos
					}
				],
				color,
				userId,
				id: lineId
			})
		)

		if (!context) return

		context.lineTo(xPos, yPos)
		context.stroke()
	}

	// Function to stop drawing
	const stopDrawing = () => {
		const canvas = canvasRef.current

		if (!canvas) return

		const context = canvas.getContext('2d')

		if (!context) return

		if (!ws) return

		ws.send(
			JSON.stringify({
				type: 'stop',
				data: currentLine,
				color,
				userId,
				id: lineId ?? ''
			})
		)
		context.closePath()
		setIsDrawing(false)
	}

	return (
		<div>
			<div className="absolute w-full flex items-center justify-center top-2">
				<div className="px-2 py-3 border border-slate-200 shadow-lg rounded-full bg-white z-10 w-fit flex gap-2 items-center">
					{['black', '#f00', '#0f0', '#00f', '#ffe01c'].map((c) => {
						const bgColor = c.includes('#')
							? `bg-[${c}]`
							: `bg-${c}`
						const isSelected = c === color

						return (
							<div
								key={c}
								className="flex flex-col justify-center items-center relative"
							>
								<button
									className={`${bgColor} rounded-full h-10 w-10 shadow-md transition-transform hover:-translate-y-1 ${isSelected ? '-translate-y-1' : ''}`}
									onClick={() => setColor(c)}
								></button>
								{isSelected && (
									<div
										className={`h-2 w-2 bg-red-500 rounded-full absolute -bottom-[7px] transition-opacity ease-in ${isSelected ? 'opacity-100' : 'opacity-0'}}`}
									></div>
								)}
							</div>
						)
					})}
				</div>
			</div>

			<div className="absolute top-2 right-2 z-10 flex gap-2 items-center">
				<span className="relative flex h-3 w-3">
					<span
						className={`${isConnected ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75`}
					></span>
					<span
						className={`relative inline-flex rounded-full h-3 w-3 ${isConnectedStyles.ping}`}
					></span>
				</span>
				<span>{isConnected ? 'Connected' : 'Disconnected'}</span>
			</div>
			<canvas
				ref={canvasRef}
				onMouseDown={startDrawing}
				onMouseMove={draw}
				onMouseUp={stopDrawing}
				onBlur={stopDrawing}
				onTouchStart={startDrawing}
				onTouchMove={draw}
				onTouchEnd={stopDrawing}
			/>

			<canvas
				ref={serverCanvasRef}
				className="absolute top-0 left-0 -z-10"
			/>
		</div>
	)
}

export default DrawingCanvas
