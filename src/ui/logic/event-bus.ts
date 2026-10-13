import mitt from 'mitt'

type Event = {
  'scroll-to': string
}

export const bus = mitt<Event>()
