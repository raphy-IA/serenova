import { z } from 'zod';

const schema = z.string().email();

try {
    console.log('Testing "admin@serenova.app"...');
    schema.parse('admin@serenova.app');
    console.log('Success!');
} catch (e: any) {
    console.log('Failed!');
    console.log(JSON.stringify(e.issues, null, 2));
}

try {
    console.log('Testing "binta@example.com"...');
    schema.parse('binta@example.com');
    console.log('Success!');
} catch (e: any) {
    console.log('Failed!');
    console.log(JSON.stringify(e.issues, null, 2));
}

try {
    console.log('Testing empty string ""...');
    schema.parse('');
    console.log('Success!');
} catch (e: any) {
    console.log('Failed!');
    console.log(JSON.stringify(e.issues, null, 2));
}
