export const getPromiseAllFulfilledResults = <T>(results: PromiseSettledResult<T>[]) => {
  return results.reduce<T[]>((acc, cur) => {
    if (cur.status === 'fulfilled') {
      acc.push(cur.value)
    } else {
      console.log(cur.reason)
    }

    return acc
  }, [])
}

export const throwReasonIfAny = (settledResults: PromiseSettledResult<any>[]) => {
  settledResults.forEach(settledResult => {
    if (settledResult.status === 'rejected') {
      throw settledResult.reason
    }
  })
}

export const getValueOrThrowReason = <T>(result: PromiseSettledResult<T>) => {
  if (result.status === 'rejected') {
    throw result.reason
  }

  return result.value
}
