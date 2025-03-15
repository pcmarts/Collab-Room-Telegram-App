import React, { useState, Children } from "react";
import { Card } from "./SwipeableCard";

// Basic default styles for container
export const Stack = ({ onVote, children }) => {
  const [stack, setStack] = useState(Children.toArray(children));

  // Return new array with last item removed
  const pop = (array) => {
    return array.filter((_, index) => {
      return index < array.length - 1;
    });
  };

  const handleVote = (item, vote) => {
    // Update the stack
    let newStack = pop(stack);
    setStack(newStack);

    // Run function from onVote prop, passing the current item and value of vote
    onVote(item, vote);
  };

  return (
    <div className="w-full overflow-hidden flex justify-center items-center relative">
      {stack.map((item, index) => {
        let isTop = index === stack.length - 1;
        return (
          <Card
            drag={isTop} // Only top card is draggable
            key={item.key || index}
            onVote={(result) => handleVote(item, result)}
          >
            {item}
          </Card>
        );
      })}
    </div>
  );
};
