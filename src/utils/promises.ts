export const getPromiseeAllFulfilledResults = <T>(results: PromiseSettledResult<T>[]) => {
  return results.reduce<T[]>((acc, cur) => {
    if (cur.status === 'fulfilled') acc.push(cur.value)
    return acc
  }, [])
}
