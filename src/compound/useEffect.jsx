import React, { useState, useEffect } from "react";

function CounterEffect() {

  const [count, setCount] = useState(0);

  // useEffect runs whenever count changes
  useEffect(() => {
    console.log("Count updated to:", count);
  }, [count]);

  return (
    <div>
      <h1>Counter With useEffect</h1>
      <h2>Count: {count}</h2>

      <button onClick={() => setCount(prev => prev + 1)}>
        Increase
      </button>
    </div>
  );
}

export default CounterEffect;
