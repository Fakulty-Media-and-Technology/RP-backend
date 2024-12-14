export const validEmailReg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

export const isValidEmail = (email: string) => validEmailReg.test(email)
