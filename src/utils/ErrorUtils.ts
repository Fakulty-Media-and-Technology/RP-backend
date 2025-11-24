import { isAxiosError } from 'axios'
import { OperationalError } from './OperationalError'

export class ErrorUtils {
  static transformAxiosResponseError = (error: unknown) => {
    if (!isAxiosError(error)) {
      throw new OperationalError('Unknown GET error', 500)
    }

    if (error.response) {
      throw new OperationalError(
        error.response?.data?.message ?? 'GET Response error',
        error.response.status,
      )
    }

    if (error.request) {
      throw new OperationalError('Request Error', 500)
    }

    throw new OperationalError('Unkown Error', 500)
  }
}
