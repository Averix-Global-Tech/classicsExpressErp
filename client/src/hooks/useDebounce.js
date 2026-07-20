import { useEffect, useState } from 'react';

// Debounce a rapidly-changing value (search box) before triggering a fetch.
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default useDebounce;
