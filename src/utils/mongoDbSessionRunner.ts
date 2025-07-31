import { startSession, ClientSession } from 'mongoose'
import env from '../env'

export type MaybeSession = ClientSession | undefined

export type Executor<T, U> = (params: T, session: MaybeSession) => Promise<U>

export const startTransaction = async () => {
  const session = await startSession()
  session.startTransaction()
  return session
}

export const commitSession = async (session: MaybeSession) => {
  if (session) {
    await session.commitTransaction()
    await session.endSession()
  }
}

export const abortSession = async (session: MaybeSession) => {
  if (session) {
    await session.abortTransaction()
    await session.endSession()
  }
}

export const withMongoDBSession = async <T, U>(runner: Executor<T, U>, params: T) => {
  // local mongodb server throws errors with sessions because it lacks a local replica set, a problem that is very involved to solve
  let session = env.IS_PROD ? await startTransaction() : undefined

  try {
    const res = await runner(params, session)
    await commitSession(session)
    return res
  } catch (e) {
    await abortSession(session)
    throw e
  }
}
