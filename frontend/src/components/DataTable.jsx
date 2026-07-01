import EmptyState from './EmptyState'

export default function DataTable({ columns, data, emptyTitle = 'No data available', emptyDescription, rowKey }) {
  if (!data?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={rowKey ? rowKey(row, index) : row.id ?? index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row, index) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
