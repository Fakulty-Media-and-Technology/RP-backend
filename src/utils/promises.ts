export const getPromiseeAllFulfilledResults = <T>(results: PromiseSettledResult<T>[]) => {
  return results.reduce<PromiseFulfilledResult<T>['value'][]>((acc, cur) => {
    if (cur.status === 'fulfilled') acc.push(cur.value)
    return acc
  }, [])
}
