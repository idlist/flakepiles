interface Flake {
  id: number
  createdAt: number
  color: string
  title: string
  content: string
  tags: string[]
}

interface NoteflakeFile {
  sort: string
  flakes: Flake[]
}

export type { Flake, NoteflakeFile }
