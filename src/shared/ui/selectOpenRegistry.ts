const openSelectClosers = new Set<() => void>()

const registerOpenSelectCloser = (close: () => void) => {
  openSelectClosers.add(close)

  return () => {
    openSelectClosers.delete(close)
  }
}

const dismissOpenSelects = () => {
  const hadOpenSelect = openSelectClosers.size > 0

  openSelectClosers.forEach((close) => close())

  return hadOpenSelect
}

export { dismissOpenSelects, registerOpenSelectCloser }
