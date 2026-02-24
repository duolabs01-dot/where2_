
export const formatSupabaseError = (err: any) => {
    if (typeof err === 'string') return err;
    return err.message || err.error_description || 'An unexpected error occurred';
};
