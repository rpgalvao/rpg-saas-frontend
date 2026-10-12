const TITLE_CASE_PREPOSITIONS = [
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'na',
  'no',
  'com',
]

export function formatPhone(value: string | null | undefined) {
  if (!value) return ''

  const numbers = value.replace(/\D/g, '')

  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14)
  }

  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

export function formatDocument(value: string | null | undefined) {
  if (!value) return ''

  const numbers = value.replace(/\D/g, '')

  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function formatCnpj(value: string | null | undefined) {
  if (!value) return ''

  const numbers = value.replace(/\D/g, '').slice(0, 14)

  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
}

export function formatCurrency(value: number | string | null | undefined) {
  const numericValue = typeof value === 'string' ? Number(value) : value

  if (numericValue == null || Number.isNaN(numericValue)) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}

export function toTitleCase(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return word

      if (index !== 0 && TITLE_CASE_PREPOSITIONS.includes(word)) {
        return word
      }

      return word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    })
    .join(' ')
}
