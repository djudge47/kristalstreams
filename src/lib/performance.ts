export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const lazyWithRetry = (
  componentImport: () => Promise<{ default: React.ComponentType<unknown> }>
) => {
  return new Promise<{ default: React.ComponentType<unknown> }>((resolve, reject) => {
    const hasRefreshed = JSON.parse(
      window.sessionStorage.getItem('retry-lazy-refreshed') || 'false'
    );

    componentImport()
      .then((component) => {
        window.sessionStorage.setItem('retry-lazy-refreshed', 'false');
        resolve(component);
      })
      .catch((error) => {
        if (!hasRefreshed) {
          window.sessionStorage.setItem('retry-lazy-refreshed', 'true');
          return window.location.reload();
        }
        reject(error);
      });
  });
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const prefetchRoute = (routePath: string): void => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
};

export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean => {
  const [isIntersecting, setIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
};

export const measurePerformance = (metricName: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${metricName}-start`);

    return () => {
      performance.mark(`${metricName}-end`);
      performance.measure(
        metricName,
        `${metricName}-start`,
        `${metricName}-end`
      );
    };
  }
  return () => {};
};
