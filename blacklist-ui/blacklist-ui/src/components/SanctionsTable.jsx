export default function SanctionsTable({ data, onSelect }) {
  if (!data || data.length === 0) return null;

  return (
    <table
      border="1"
      style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>OFAC UID</th>
          <th>Type</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr
            key={item.id}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(item)}
          >
            <td>{item.name}</td>
            <td>{item.ofacUid}</td>
            <td>{item.sdnType}</td>
            <td>{item.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
