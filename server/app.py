from datetime import datetime, timedelta
import os
import jwt
import json
import requests
from functools import wraps
from urlparse import parse_qs, parse_qsl
from urllib import urlencode
from flask import Flask, g, send_file, request, redirect, url_for, jsonify
from flask.ext.sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from requests_oauthlib import OAuth1
from jwt import DecodeError, ExpiredSignature
from flask.ext.cors import CORS
from flask.ext.cors import cross_origin

# Configuration

current_path = os.path.dirname(__file__)
#client_path = os.path.abspath(os.path.join(current_path, '..', '..', 'client'))

app = Flask(__name__)
cors = CORS(app)
app.config.from_object('config')

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(120))
    display_name = db.Column(db.String(120))
    github = db.Column(db.String(120))
    

    def __init__(self, email=None, password=None, display_name=None,
                 github=None):
        if email:
            self.email = email.lower()
        if password:
            self.set_password(password)
        if display_name:
            self.display_name = display_name
        if github:
            self.github = github
        

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_json(self):
        return dict(id=self.id, email=self.email, displayName=self.display_name,
                    github=self.github)


db.create_all()


def create_token(user):
    payload = {
        'sub': user.id,
        'iat': datetime.now(),
        'exp': datetime.now() + timedelta(days=14)
    }
    token = jwt.encode(payload, app.config['TOKEN_SECRET'])
    return token.decode('unicode_escape')


def parse_token(req):
    token = req.headers.get('Authorization').split()[1]
    return jwt.decode(token, app.config['TOKEN_SECRET'])


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.headers.get('Authorization'):
            response = jsonify(message='Missing authorization header')
            response.status_code = 401
            return response

        try:
            payload = parse_token(request)
        except DecodeError:
            response = jsonify(message='Token is invalid')
            response.status_code = 401
            return response
        except ExpiredSignature:
            response = jsonify(message='Token has expired')
            response.status_code = 401
            return response

        g.user_id = payload['sub']

        return f(*args, **kwargs)

    return decorated_function


# Routes

@app.route('/')
def index():
    return jsonify({'message':'super cool flask api'})


@app.route('/api/repos/<display_name>')
@cross_origin(supports_credentials=True)
@login_required
def repos(display_name):
    # print request.get_data()
    # print '----'
    # for a in request.args:
    #     print a
    #     print 'okok'
    # if len(request.args) == 0:
    #     print 'none'
    # user = User.query.filter_by(id=g.user_id).first()
    # return jsonify(user.to_json())
    access_token_url = 'https://github.com/login/oauth/access_token'
    user_repos_api_url = 'https://api.github.com/orgs/uptaketech/repos'

    auth_value = request.headers['Authorization'].split(' ')
    access_token = auth_value[1]

    params = {
        'client_id': app.config['CLIENTID'],
        'client_secret': app.config['GITHUB_SECRET'],
        'code': app.config['CODE']
    }

    # Step 1. Exchange authorization code for access token.
    r = requests.get(access_token_url, params=params)
    access_token = dict(parse_qsl(r.text))
    headers = {'User-Agent': 'Satellizer'}

    # Step 2. Retrieve repo information about the current user.
    #r = requests.get(user_repos_api_url, params=access_token, headers=headers)
    r = requests.get(user_repos_api_url, params=access_token, headers=headers)
    profile = json.loads(r.text)
    return jsonify(profile=profile)

@app.route('/api/repos/stats/<repo_name>')
@cross_origin(supports_credentials=True)
@login_required
def stats(repo_name):
    # print request.get_data()
    # print '----'
    # for a in request.args:
    #     print a
    #     print 'okok'
    # if len(request.args) == 0:
    #     print 'none'
    # user = User.query.filter_by(id=g.user_id).first()
    # return jsonify(user.to_json())
    access_token_url = 'https://github.com/login/oauth/access_token'
    user_repos_api_url = 'https://api.github.com/repos/uptaketech/'+ repo_name +'/stats/contributors'

    auth_value = request.headers['Authorization'].split(' ')
    access_token = auth_value[1]

    params = {
        'client_id': app.config['CLIENTID'],
        'client_secret': app.config['GITHUB_SECRET'],
        'code': app.config['CODE']
    }

    # Step 1. Exchange authorization code for access token.
    r = requests.get(access_token_url, params=params)
    access_token = dict(parse_qsl(r.text))
    headers = {'User-Agent': 'Satellizer'}

    # Step 2. Retrieve repo information about the current user.
    #r = requests.get(user_repos_api_url, params=access_token, headers=headers)
    r = requests.get(user_repos_api_url, params=access_token, headers=headers)
    profile = json.loads(r.text)
    return jsonify(profile=profile)


@app.route('/auth/login', methods=['POST'])
def login():
    user = User.query.filter_by(email=request.json['email']).first()
    if not user or not user.check_password(request.json['password']):
        response = jsonify(message='Wrong Email or Password')
        response.status_code = 401
        return response
    token = create_token(user)
    return jsonify(token=token)


@app.route('/auth/signup', methods=['POST'])
def signup():
    user = User(email=request.json['email'], password=request.json['password'])
    db.session.add(user)
    db.session.commit()
    token = create_token(user)
    return jsonify(token=token)


@app.route('/auth/github', methods=['POST'])
@cross_origin(supports_credentials=True)
def github():
    access_token_url = 'https://github.com/login/oauth/access_token'
    users_api_url = 'https://api.github.com/user'

    print request.json

    params = {
        'client_id': request.json['clientId'],
        'redirect_uri': request.json['redirectUri'],
        'client_secret': app.config['GITHUB_SECRET'],
        'code': request.json['code']
    }

    # Step 1. Exchange authorization code for access token.
    r = requests.get(access_token_url, params=params)
    access_token = dict(parse_qsl(r.text))
    headers = {'User-Agent': 'Satellizer'}

    # Step 2. Retrieve information about the current user.
    r = requests.get(users_api_url, params=access_token, headers=headers)
    profile = json.loads(r.text)

    # Step 3. (optional) Link accounts.
    if request.headers.get('Authorization'):
        user = User.query.filter_by(github=profile['id']).first()
        if user:
            response = jsonify(message='There is already a GitHub account that belongs to you')
            response.status_code = 409
            return response

        payload = parse_token(request)

        user = User.query.filter_by(id=payload['sub']).first()
        if not user:
            response = jsonify(message='User not found')
            response.status_code = 400
            return response

        u = User(github=profile['id'], display_name=profile['name'])
        db.session.add(u)
        db.session.commit()
        token = create_token(u)
        return jsonify(token=token, user=u.to_json())

    # Step 4. Create a new account or return an existing one.
    user = User.query.filter_by(github=profile['id']).first()
    if user:
        token = create_token(user)
        print user
        return jsonify(token=token, user=user.to_json())


    u = User(github=profile['id'], display_name=profile['login'])
    db.session.add(u)
    db.session.commit()
    token = create_token(u)
    return jsonify(token=token, user=u.to_json())






if __name__ == '__main__':
    app.run(port=3000)