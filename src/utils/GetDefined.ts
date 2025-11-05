import { NullableType } from 'joi'
import { LoggedInUser } from '../types'
import { OperationalError } from './OperationalError'
import { Document } from 'mongoose'
import { UserDocument } from '../models/users.model'

export class GetDefined {
  static loggedInUser = (maybeUser: LoggedInUser | undefined | null) => {
    if (maybeUser == null) {
      throw new OperationalError('Please login', 401)
    }

    return maybeUser
  }

  static item = <T>(item: NullableType<T>, message: string) => {
    if (item == null) {
      throw new OperationalError(message, 404)
    }

    return item
  }

  static userDocument = (document: NullableType<UserDocument>, message = 'User Not Found') =>
    this.item(document, message)
}
