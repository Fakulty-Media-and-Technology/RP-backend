import { startSession, ClientSession } from 'mongoose'

export type Executor<T, U> = (params: T, session: ClientSession) => Promise<U>

export const startTransaction = async () => {
  const session = await startSession()
  session.startTransaction()
  return session
}

export const commitTransactionCleanly = async (session: ClientSession) => {
  await session.commitTransaction()
  await session.endSession()
}

export const abortTransactionCleanly = async (session: ClientSession) => {
  await session.abortTransaction()
  await session.endSession()
}

export const withMongoDBSession = async <T, U>(runner: Executor<T, U>, params: T) => {
  let session: ClientSession | null = null

  try {
    session = await startTransaction()
    const res = await runner(params, session)
    await commitTransactionCleanly(session)
    return res
  } catch (e) {
    if (session) {
      await abortTransactionCleanly(session)
    }
    throw e
  }
}
