import { Router } from 'express'
import { AdminUsersController } from '../../controllers/admins/users.admin'

export const superAdminUsersRouter = Router()

superAdminUsersRouter.get('/fetch', AdminUsersController.adminFetchUsers)
superAdminUsersRouter.get('/fetch/:userId', AdminUsersController.adminFetchSingleUser)
superAdminUsersRouter.patch('/update/:userId', AdminUsersController.editUserProfile)
superAdminUsersRouter.delete('/deleteUser/:userId', AdminUsersController.adminDeleteUser)
