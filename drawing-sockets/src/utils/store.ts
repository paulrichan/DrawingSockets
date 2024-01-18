import { create } from 'zustand'

export interface Point {
	x: number
	y: number
}

interface GlobalStore {
	lines: Point[][]
	setLines: (lines: Point[][]) => void
}

export const useGlobalStore = create<GlobalStore>((set) => ({
	lines: [],
	setLines: (newLines: Point[][]) => set({ lines: newLines })
}))
