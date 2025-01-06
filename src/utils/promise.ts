export const getFulfilledValues = <T>(promises: PromiseSettledResult<T>[]) => {
  const values: T[] = []

  promises.forEach(promise => {
    if (promise.status === 'fulfilled') {
      values.push(promise.value)
      return
    }
  })

  return values
}
