import pytest
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from models import Staff
from flask_jwt_extended import create_access_token

def test_get_token():
    """Test getting a token from login using existing admin user"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Use the existing admin user that gets created
            response = client.post('/api/login', 
                data=json.dumps({
                    'username': 'admin',
                    'password': 'admin123'
                }),
                content_type='application/json'
            )
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'access_token' in data
            assert len(data['access_token']) > 0

def test_verify_token():
    """Test verifying a valid token"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
          
            login_response = client.post('/api/login', 
                data=json.dumps({
                    'username': 'admin',
                    'password': 'admin123'
                }),
                content_type='application/json'
            )
            
            token = json.loads(login_response.data)['access_token']
            
           
            response = client.get('/api/verify-token',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['valid'] == True

def test_verify_invalid_token():
    """Test verifying an invalid token"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            response = client.get('/api/verify-token',
                headers={'Authorization': 'Bearer invalid_token_here'}
            )
            
            assert response.status_code == 422