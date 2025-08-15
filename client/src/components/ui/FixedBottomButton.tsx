// client/src/components/ui/FixedBottomButton.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Loader2 } from 'lucide-react';
import styles from './FixedBottomButton.module.css';

interface FixedBottomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  isLoading?: boolean;
  loadingText?: string;
}

export function FixedBottomButton({
  text,
  isLoading = false,
  loadingText = 'Loading...',
  ...props
}: FixedBottomButtonProps) {
  // Use a portal to render the button at the end of the document body
  // This helps to avoid styling conflicts and z-index issues.
  return ReactDOM.createPortal(
    <div className={styles.container}>
      <button className={styles.button} {...props} disabled={isLoading || props.disabled}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          text
        )}
      </button>
    </div>,
    document.body
  );
}
