import { useErrorLog } from './error-log'

type SupabaseResult<T> = { data: T | null; error: { message: string } | null }

export async function dbQuery<T>(
  table: string,
  operation: () => Promise<SupabaseResult<T>>
): Promise<T> {
  const { data, error } = await operation()

  if (error) {
    if (typeof window !== 'undefined') {
      useErrorLog.getState().setRead(table, error.message)
    }
    throw new Error(`[${table}] ${error.message}`)
  }

  if (typeof window !== 'undefined') {
    useErrorLog.getState().clearRead(table)
  }

  return data as T
}

export async function dbMutate<T>(
  table: string,
  operation: () => Promise<SupabaseResult<T>>
): Promise<T> {
  const { data, error } = await operation()

  if (error) {
    if (typeof window !== 'undefined') {
      useErrorLog.getState().addWrite(table, error.message)
    }
    throw new Error(`[${table}] ${error.message}`)
  }

  return data as T
}
