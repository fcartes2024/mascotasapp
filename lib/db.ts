import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_DIR = join(process.cwd(), 'data')
const DB_PATH = join(DB_DIR, 'pet-adoption.db')

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true })
}

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

type TableInfo = { name: string }

function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as TableInfo[]
  if (!cols.some((c) => c.name === column)) {
    db.exec(ddl)
  }
}

ensureColumn('foundations', 'verified', 'ALTER TABLE foundations ADD COLUMN verified INTEGER NOT NULL DEFAULT 1')
ensureColumn('foundations', 'available_slots', 'ALTER TABLE foundations ADD COLUMN available_slots TEXT')
ensureColumn('pets', 'adoption_state', "ALTER TABLE pets ADD COLUMN adoption_state TEXT NOT NULL DEFAULT 'en_adopcion'")
ensureColumn('adoption_requests', 'application', 'ALTER TABLE adoption_requests ADD COLUMN application TEXT')

db.prepare("UPDATE pets SET image = ? WHERE name = ? AND type = 'Perro'").run(
  'https://images.unsplash.com/photo-1558944351-6d4b0c9f0b57?auto=format&fit=crop&w=900&q=85',
  'Chiquita',
)
db.prepare("UPDATE pets SET image = ? WHERE name = ? AND type = 'Perro'").run(
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=85',
  'Solovino',
)

const chileLocationMap: Array<{ from: string; to: string }> = [
  { from: 'Roma Norte', to: 'Providencia, Santiago' },
  { from: 'Condesa', to: 'Las Condes, Santiago' },
  { from: 'Coyoacán', to: 'Ñuñoa, Santiago' },
  { from: 'Del Valle', to: 'La Florida, Santiago' },
  { from: 'Álvaro Obregón', to: 'Maipú, Santiago' },
  { from: 'Iztapalapa', to: 'Puente Alto, Santiago' },
  { from: 'Narvarte', to: 'Viña del Mar' },
  { from: 'Polanco', to: 'Valparaíso' },
]

for (const { from, to } of chileLocationMap) {
  db.prepare('UPDATE pets SET location = ? WHERE location = ?').run(to, from)
}

db.prepare("UPDATE foundations SET location = 'Región Metropolitana, Chile' WHERE location LIKE '%CDMX%'").run()

export type UserRole = 'admin' | 'fundacion' | 'usuario'

export type DBUser = {
  id: number
  name: string
  email: string
  password_hash: string
  role: UserRole
  avatar: string | null
  foundation_id: number | null
  created_at: string
}

export type DBFoundation = {
  id: number
  name: string
  description: string | null
  location: string | null
  email: string | null
  phone: string | null
  logo_url: string | null
  verified: number
  available_slots: string | null
  created_at: string
}

export type DBPet = {
  id: number
  name: string
  type: 'Perro' | 'Gato'
  breed: string | null
  age: string
  gender: 'Macho' | 'Hembra' | null
  weight: string | null
  location: string
  image: string
  tone: string
  vaccinated: number
  sterilized: number
  personality: string | null
  about: string | null
  good_with: string | null
  energy: 'Baja' | 'Media' | 'Alta' | null
  foundation_id: number | null
  published_by: number | null
  adoption_state: 'en_adopcion' | 'rescatado' | 'adoptado'
  created_at: string
}

export type DBFavorite = {
  id: number
  user_id: number
  pet_id: number
  created_at: string
}

export type DBAdoptionRequest = {
  id: number
  user_id: number
  pet_id: number
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'completada'
  message: string | null
  scheduled_date: string | null
  application: string | null
  created_at: string
}

export default db
