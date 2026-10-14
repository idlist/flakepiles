import mitt from 'mitt'

interface EventCalloutPayload {
  id: string
  duration?: number
}

type Event = {
  'scroll-to': string
  callout: EventCalloutPayload
}

export const bus = mitt<Event>()
