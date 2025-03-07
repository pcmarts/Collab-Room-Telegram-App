import { useRef, useEffect } from 'react';

interface FormNavigationOptions {
  onNext?: () => void;
  onPrevious?: () => void;
  onDone?: () => void;
}

export function useFormNavigation({ onNext, onPrevious, onDone }: FormNavigationOptions = {}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    // Focus handling for inputs
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Scroll the element into view with padding
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    // Register all input elements
    if (formRef.current) {
      const inputs = Array.from(
        formRef.current.querySelectorAll('input, textarea, select')
      ) as HTMLInputElement[];
      
      inputRefs.current = inputs;
      
      inputs.forEach(input => {
        input.addEventListener('focus', handleFocus);
      });
    }

    return () => {
      inputRefs.current.forEach(input => {
        input.removeEventListener('focus', handleFocus);
      });
    };
  }, []);

  const navigateToNext = () => {
    const currentIndex = inputRefs.current.findIndex(
      input => input === document.activeElement
    );
    
    if (currentIndex < inputRefs.current.length - 1) {
      inputRefs.current[currentIndex + 1].focus();
    } else {
      onDone?.();
    }
  };

  const navigateToPrevious = () => {
    const currentIndex = inputRefs.current.findIndex(
      input => input === document.activeElement
    );
    
    if (currentIndex > 0) {
      inputRefs.current[currentIndex - 1].focus();
    } else {
      onPrevious?.();
    }
  };

  return {
    formRef,
    navigateToNext,
    navigateToPrevious
  };
}
