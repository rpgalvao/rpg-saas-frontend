import axios from 'axios'

import { formatCep, toTitleCase } from '@/lib/formatters'

export type BrasilCompanyAddress = {
  name: string
  tradeName: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

type BrasilCnpjResponse = {
  razao_social?: string
  nome_fantasia?: string
  cep?: string
  logradouro?: string
  descricao_tipo_de_logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  message?: string
}

function text(value: string | null | undefined) {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed === '********') return ''
  return trimmed
}

type BrasilCepResponse = {
  cep?: string
  state?: string
  city?: string
  neighborhood?: string
  street?: string
  message?: string
}

export type BrasilCepAddress = {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
}

export async function fetchAddressByCep(cep: string) {
  const digits = cep.replace(/\D/g, '')

  if (digits.length !== 8) {
    throw new Error('Informe um CEP com 8 dígitos.')
  }

  try {
    const { data } = await axios.get<BrasilCepResponse>(
      `https://brasilapi.com.br/api/cep/v1/${digits}`,
      { timeout: 12_000 },
    )

    return {
      cep: formatCep(data.cep ?? digits),
      street: text(data.street) ? toTitleCase(text(data.street)) : '',
      neighborhood: text(data.neighborhood)
        ? toTitleCase(text(data.neighborhood))
        : '',
      city: text(data.city) ? toTitleCase(text(data.city)) : '',
      state: text(data.state).toLocaleUpperCase('pt-BR'),
    } satisfies BrasilCepAddress
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message

      if (typeof message === 'string' && message.length > 0) {
        throw new Error(message, { cause: error })
      }

      if (error.response?.status === 404) {
        throw new Error('CEP não encontrado.', { cause: error })
      }

      if (!error.response) {
        throw new Error(
          'Não foi possível consultar o CEP. Verifique a conexão.',
          { cause: error },
        )
      }
    }

    throw new Error('Não foi possível consultar o CEP.', { cause: error })
  }
}

export async function fetchCompanyByCnpj(cnpj: string) {
  const digits = cnpj.replace(/\D/g, '')

  if (digits.length !== 14) {
    throw new Error('Informe um CNPJ com 14 dígitos.')
  }

  try {
    const { data } = await axios.get<BrasilCnpjResponse>(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      { timeout: 12_000 },
    )

    const streetType = text(data.descricao_tipo_de_logradouro)
    const streetName = text(data.logradouro)
    const street = [streetType, streetName].filter(Boolean).join(' ')

    return {
      name: text(data.razao_social),
      tradeName: text(data.nome_fantasia) || text(data.razao_social),
      cep: formatCep(data.cep),
      street: street ? toTitleCase(street) : '',
      number: text(data.numero),
      complement: text(data.complemento)
        ? toTitleCase(text(data.complemento))
        : '',
      neighborhood: text(data.bairro) ? toTitleCase(text(data.bairro)) : '',
      city: text(data.municipio) ? toTitleCase(text(data.municipio)) : '',
      state: text(data.uf).toLocaleUpperCase('pt-BR'),
    } satisfies BrasilCompanyAddress
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message

      if (typeof message === 'string' && message.length > 0) {
        throw new Error(message, { cause: error })
      }

      if (error.response?.status === 404) {
        throw new Error('CNPJ não encontrado na Receita Federal.', {
          cause: error,
        })
      }

      if (!error.response) {
        throw new Error(
          'Não foi possível consultar o CNPJ. Verifique a conexão.',
          { cause: error },
        )
      }
    }

    throw new Error('Não foi possível consultar o CNPJ.', { cause: error })
  }
}
