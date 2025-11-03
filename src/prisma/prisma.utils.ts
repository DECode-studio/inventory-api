const DEFAULT_PORT = 5432;


function encode(value: string) {
    return encodeURIComponent(value);
}


export function ensureDatabaseUrl(): string {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }


    const host = process.env.DB_HOST;
    const port = Number(process.env.DB_PORT || DEFAULT_PORT);
    const user = process.env.DB_USER;
    const pass = process.env.DB_PASS;
    const db = process.env.DB_NAME;
    const schema = process.env.DB_SCHEMA || 'public';


    if (!host || !user || !pass || !db) {
        throw new Error('Missing database configuration. Set DATABASE_URL or DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME.');
    }


    const url = `postgresql://${encode(user)}:${encode(pass)}@${host}:${port}/${encode(db)}?schema=${encode(schema)}`;
    process.env.DATABASE_URL = url;
    return url;
}
