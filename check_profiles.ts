import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function check() {
    const env = fs.readFileSync('.env', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

    if (!url || !key) {
        console.error('Could not find URL or Key');
        return;
    }

    const supabase = createClient(url, key);

    // Query columns from information_schema
    const { data: columns, error } = await supabase.rpc('get_table_columns', { table_name_param: 'profiles' });

    if (error) {
        // Fallback: try to just select one and see what happens
        const { data, error: selectError } = await supabase.from('profiles').select('*').limit(1);
        if (selectError) {
            console.error('Select error:', selectError);
        } else {
            console.log('Available columns in profiles:', Object.keys(data[0] || {}));
        }
    } else {
        console.log('Columns from RPC:', columns);
    }
}

check();
