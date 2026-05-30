import { defineEventHandler } from 'nitro/h3'

import { POST } from '../../../app/routes/api/webhook'

export default defineEventHandler((event) => POST({ request: event.req }))
