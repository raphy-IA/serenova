import axios from 'axios';

async function testLogin() {
    try {
        console.log('Tentative de connexion à http://localhost:3000/api/auth/login...');
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'superadmin@serenova.app',
            password: 'password123'
        });
        console.log('Login réussi !');
        console.log('User:', response.data.data.user.email);
        console.log('Role:', response.data.data.user.role);
    } catch (err: any) {
        console.error('Erreur de login:', err.response?.status, err.response?.data || err.message);
    }
}

testLogin();
