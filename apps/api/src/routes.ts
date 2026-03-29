import { Router } from 'express'
import authRoutes from './features/auth/auth.route'
import healthRouter from './features/health/health.route'
import plaidRouter from './features/plaid/plaid.route'

const router = Router()

router.use('/auth', authRoutes)
router.use('/plaid', plaidRouter)
router.use('/health', healthRouter)

export default router