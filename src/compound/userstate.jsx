import React from 'react'
import { useState } from 'react'

function testuserstate() {

    let x = 1;

    const [count, setCount] = useState(0);
    const increase = () => {
        // x = x + 1;
        // console.log(x);
        setCount(count + 1);
    }
    console.log(x);
  return (
    <div>
      <h1>User State</h1>
      <button onClick={increase}>Increase</button>
      <p>Count: {count}</p>
    </div>
  )
}

export default testuserstate