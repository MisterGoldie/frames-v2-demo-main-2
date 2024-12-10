const Snow = () => {
  return (
    <div className="snow-container">
      {[...Array(50)].map((_, index) => (
        <div key={index} className="snow" />
      ))}
    </div>
  );
};

export default Snow; 