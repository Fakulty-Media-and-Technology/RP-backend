export class Bytes {
  static kb = (num: number) => num * 1024

  static mb = (num: number) => this.kb(num) * 1024

  static gb = (num: number) => this.mb(num) * 1024
}
