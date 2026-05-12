const StatCard = ({ title, value, color }) => {
  return (
    <div
      style={{
        background: "black",
        padding: "20px",
        borderRadius: "10px",
        flex: 1,
        borderLeft: `5px solid ${color}`,
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
      }}
    >
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
};

export default StatCard;