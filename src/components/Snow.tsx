const Snow = () => {
  return (
    <div className="snow-container">
      {[...Array(200)].map((_, index) => (
        <div 
          key={index} 
          className={`snow snow-${index % 3}`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${Math.random() * 10 + 5}px`
          }}
        />
      ))}
    </div>
  );
};

export default Snow; 