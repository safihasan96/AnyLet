import { useEffect, useRef, useState, useCallback } from 'react';

export default function useInfiniteScroll(onIntersect, options = {}) {
    const sentinelRef = useRef(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    const handleIntersect = useCallback((entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && onIntersect) {
            onIntersect();
        }
    }, [onIntersect]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersect, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
            ...options,
        });

        const currentRef = sentinelRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [handleIntersect, options]);

    return { sentinelRef, isIntersecting };
}
