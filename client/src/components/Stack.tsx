import React, { useState, Children } from "react";
import SimpleCard from "./SimpleCard";

// Note: This Stack component is kept for backward compatibility 
// But is no longer used in the application since we migrated to SimpleCard 
// which shows only one card at a time
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

  // Only show one card at a time (similar to DiscoverPageNew approach)
  const topCard = stack.length > 0 ? stack[stack.length - 1] : null;

  return (
    <div className="w-full overflow-hidden flex justify-center items-center relative" {...props}>
      {topCard && (
        <SimpleCard
          key={topCard.key || 0}
          data={topCard.props.data || {}}
          handleSwipe={(direction, note) => {
            console.log("Stack received swipe:", direction, note);
            handleVote(topCard, direction);
          }}
          onInfoClick={() => console.log("Info clicked for", topCard)}
        />
      )}
    </div>
  );
};