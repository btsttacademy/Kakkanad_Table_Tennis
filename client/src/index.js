import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 
   
    <GoogleOAuthProvider clientId="505223034415-4eo4i7slekcjqd0630ha9k3fffghaidq.apps.googleusercontent.com">
    <App />
    </GoogleOAuthProvider>
    
 
);


