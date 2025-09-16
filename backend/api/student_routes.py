from flask import Blueprint, jsonify, request
from tools.database import StudentDatabase

# 建立學生路由藍圖
student_bp = Blueprint('mdl_user', __name__)

@student_bp.route('/mdl_user/<int:user_id>', methods=['GET'])
def get_mdl_user_by_id(user_id):
    db = StudentDatabase()  # 🔹 每次請求都新建
    try:
        student = db.get_summary(user_id)
        if student.get("success"):
            return jsonify({"success": True, "data": student, "message": "成功取得學生資料"})
        else:
            return jsonify({"success": False, "message": student.get("error", "找不到學生")}), 404
    except Exception as e:
        return jsonify({"success": False, "message": f"取得資料時發生錯誤: {str(e)}"}), 500


