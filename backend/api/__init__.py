# -*- coding: utf-8 -*-
"""
API 路由模組
將不同功能的路由分離，提高代碼可維護性
"""
from api.student_routes import student_bp

from flask import Blueprint
def register_blueprints(app):
    """註冊所有藍圖"""

    app.register_blueprint(student_bp, url_prefix='/api/chat')
