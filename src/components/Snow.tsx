"use client";

export default function Snow() {
  return (
    <div className="snow-container">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className={`snow ${i % 3 === 1 ? 'snow-1' : i % 3 === 2 ? 'snow-2' : ''}`}
          style={{
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * -15}s`,
          }}
        />
      ))}
    </div>
  );
} 