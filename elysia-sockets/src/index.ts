import { Elysia, t } from 'elysia'
import Database from 'bun:sqlite'

const db = new Database(import.meta.dir + '/../data/db.sqlite', {
	create: true
})
db.run(
	`CREATE TABLE IF NOT EXISTS lines (id TEXT PRIMARY KEY, userId TEXT, data TEXT, color TEXT)`
)

// Allows for multiple connections to the database
db.exec('PRAGMA journal_mode = WAL')

const app = new Elysia()

app.ws('/ws', {
	message: (ws, data) => {
		if (data.type === 'draw' || data.type === 'start') {
			ws.publish('drawing', data)
		}

		if (data.type === 'stop') {
			db.query(
				`INSERT INTO lines (id, userId, data, color) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(id) DO UPDATE SET data = ?3`
			).run(
				data.id!,
				data.userId!,
				JSON.stringify(data.data),
				data.color!
			)
			console.log('New line saved!')
		}
	},
	open: (ws) => {
		ws.subscribe('drawing')
		ws.publish('drawing', 'User joined')

		// send all lines to user
		const lines = db.query(`SELECT * FROM lines`).all() as {
			id: string
			userId: string
			data: string
			color: string
		}[]
		ws.send({
			type: 'onload',
			data: lines
		})
	},
	close: (ws) => {
		ws.unsubscribe('drawing')
	},
	body: t.Object({
		type: t.String(),
		data: t.Array(
			t.Object({
				x: t.Number(),
				y: t.Number()
			})
		),
		color: t.Optional(t.String()),
		userId: t.Optional(t.String()),
		id: t.Optional(t.String())
	})
})

app.listen(3000)

const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://'
console.log(
	`Server is running at ${protocol}${app.server?.hostname}:${app.server?.port}`
)
