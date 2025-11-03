import express from 'express'
import { giftCardRouter } from './giftCardRoute'

export const merchantRouter = express.Router()

merchantRouter.use('/giftcards', giftCardRouter)
