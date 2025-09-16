
#http://127.0.0.1:5000/api/chat/mdl_user/2274978
from flask import Flask
from flask_cors import CORS
import os
from api import register_blueprints
def create_app():
    app = Flask(__name__)
    
    # 基本設定
    #app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', True)
    
    # 允許跨域請求 (給前端 React 使用)
    CORS(app)
    
    # 註冊所有路由藍圖
    register_blueprints(app)
    
    return app



if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
