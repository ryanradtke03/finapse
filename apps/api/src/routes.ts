import { Router } from 'express'
import authRoutes from './features/auth/auth.route'
import budgetRouter from './features/budget/budget.route'
import healthRouter from './features/health/health.route'
import plaidRouter from './features/plaid/plaid.route'
import transactionRouter from './features/transaction/transaction.route'


const router = Router()

router.use('/auth', authRoutes)
router.use('/plaid', plaidRouter)
router.use('/budget', budgetRouter);
router.use('/health', healthRouter)
router.use('/transaction', transactionRouter);

export default router;