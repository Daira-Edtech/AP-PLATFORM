import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSupabaseQueryOptions {
    enabled?: boolean;
}

interface QueryResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useSupabaseQuery<T>(
    queryFn: () => Promise<T>,
    deps: any[] = [],
    options: UseSupabaseQueryOptions = {}
): QueryResult<T> {
    const { enabled = true } = options;
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const mountedRef = useRef(true);

    const execute = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await queryFn();
            if (mountedRef.current) {
                setData(result);
            }
        } catch (err: any) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err : new Error(err.message || 'Query failed'));
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [enabled, ...deps]);

    useEffect(() => {
        mountedRef.current = true;
        execute();
        return () => { mountedRef.current = false; };
    }, [execute]);

    return { data, loading, error, refetch: execute };
}
