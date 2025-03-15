import React, { useState, Children } from "react";
import { SwipeableCard } from "./SwipeableCard";

export const Stack = ({ onVote, children, ...props }) => {
  const [stack, setStack] = useState(Children.toArray(children));
  const [originalStack] = useState(Children.toArray(children)); // Keep original array

  // return new array with last item removed
  const pop = (array) => {
    return array.filter((_, index) => {
      return index < array.length - 1;
    });
  };

  const handleVote = (item, vote) => {
    // update the stack
    let newStack = pop(stack);

    // If stack becomes empty, reset it with original cards
    if (newStack.length === 0) {
      newStack = [...originalStack];
    }

    setStack(newStack);
    onVote(item, vote);
  };

  return (
    <div className="w-full overflow-hidden flex justify-center items-center relative" {...props}>
      {stack.map((item, index) => {
        let isTop = index === stack.length - 1;
        return (
          <SwipeableCard
            key={item.key || index}
            onVote={(result) => handleVote(item, result)}
            style={{
              zIndex: index * 10
            }}
          >
            {item}
          </SwipeableCard>
        );
      })}
    </div>
  );
};