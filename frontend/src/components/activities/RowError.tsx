import { TOTAL_COLUMNS } from './columns'

export function RowError({ message }: { message: string | null }) {
  if (message === null) {
    return null
  }
  return (
    <tr>
      <td colSpan={TOTAL_COLUMNS} className="row-error" role="alert">
        {message}
      </td>
    </tr>
  )
}
