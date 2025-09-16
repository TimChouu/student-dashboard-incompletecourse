# database.py
# 學生資料統一查詢管理系統 (簡化Class版本)

import os
import sshtunnel
import pymysql
from dotenv import load_dotenv
import logging
from typing import Optional, Dict, Any, List
from sshtunnel import SSHTunnelForwarder

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 讀取 .env 環境變數
load_dotenv()


class StudentDatabase:
    """學生資料庫管理類別 - 簡化版"""
    
    def __init__(self):
        """初始化資料庫設定"""
        # SSH 隧道資訊
        self.SSH_HOST = os.getenv("SSH_HOST")
        self.SSH_PORT = int(os.getenv("SSH_PORT", 22))
        self.SSH_USER = os.getenv("SSH_USER")
        self.SSH_PASSWORD = os.getenv("SSH_PASSWORD")
        self.SSH_PKEY = os.getenv("SSH_PKEY")
        
        # MySQL 連線資訊
        self.MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
        self.MYSQL_USER = os.getenv("MYSQL_USER")
        self.MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
        self.MYSQL_DB = os.getenv("MYSQL_DB")
        self.MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
        
        # 連線物件
        self.conn = None
        self.tunnel = None
    
    def connect_db(self):
        """建立資料庫連線"""
        if self.conn and self.tunnel:
            return self.conn, self.tunnel
            
        tunnel = sshtunnel.SSHTunnelForwarder(
           (self.SSH_HOST, self.SSH_PORT),
            ssh_username=self.SSH_USER,
            ssh_password=self.SSH_PASSWORD if self.SSH_PASSWORD else None,
            remote_bind_address=(self.MYSQL_HOST, self.MYSQL_PORT),
            local_bind_address=('127.0.0.1', 0),  # 自動找一個可用的本機port
        )
        tunnel.start()
        
        try:
            conn = pymysql.connect(
                host="127.0.0.1",
                port=tunnel.local_bind_port,
                user=self.MYSQL_USER,
                password=self.MYSQL_PASSWORD,
                db=self.MYSQL_DB,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            logger.info("✅ 資料庫連線成功")
            self.conn = conn
            self.tunnel = tunnel
            return conn, tunnel
        except Exception as e:
            logger.error(f"❌ 資料庫連線失敗: {e}")
            tunnel.stop()
            return None, None
    
    def disconnect(self):
        """關閉連線"""
        if self.conn:
            self.conn.close()
            self.conn = None
        if self.tunnel:
            self.tunnel.stop()
            self.tunnel = None

    def get_student_profile(self, conn, user_id):
        """取得學生基本資料"""
        if not conn:
            return None
            
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, username, email, city, timecreated, lastname, firstname, loginday
                    FROM mdl_user
                    WHERE id = %s
                """, (user_id,))
                return cursor.fetchone()
        except Exception as e:
            logger.error(f"查詢學生資料失敗: {e}")
            return None
    
    def get_recent_mdl_user(self, limit=10):
        """取得最近註冊的學生"""
        conn, tunnel = self.connect_db()
        if not conn:
            return []
            
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, name, email, age, created_at 
                    FROM mdl_user 
                    ORDER BY created_at DESC 
                    LIMIT %s
                """, (limit,))
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"查詢最近用戶失敗: {e}")
            return []
    
    def get_user_completed_course_count(self, conn, user_id):
        """
        傳回該 user 完成的課程數量 (依 mdl_course_completions 表)
        """
        if not conn:
            return 0

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) AS completed_count
                    FROM mdl_course_completions
                    WHERE userid = %s
                """, (user_id,))
                result = cursor.fetchone()
                return result['completed_count'] if result else 0
        except Exception as e:
            logger.error(f"查詢用戶完成課程數失敗: {e}")
            return 0

    def get_user_category_progress(self, conn, user_id):
        """
        取得使用者在六個類別(閱讀、文法、字彙、口說、聽力、寫作)的完成進度百分比
        其他一律歸為 未知
        """
        if not conn:
            return []

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        cc.category_type AS category_group,
                        COUNT(DISTINCT c.id) AS total_courses,
                        COUNT(DISTINCT ccpl.course) AS completed_courses,
                        CASE 
                            WHEN COUNT(DISTINCT c.id) = 0 THEN 0
                            ELSE ROUND(
                                COUNT(DISTINCT ccpl.course) / COUNT(DISTINCT c.id) * 100, 1
                            )
                        END AS completion_percent
                    FROM mdl_course_categories cc
                    JOIN mdl_course c 
                        ON cc.id = c.category
                    LEFT JOIN mdl_course_completions ccpl 
                        ON ccpl.course = c.id 
                        AND ccpl.userid = %s
                    WHERE cc.category_type IN ('閱讀','文法','字彙','口說','聽力','寫作','其他')
                    GROUP BY cc.category_type
                    ORDER BY cc.category_type;
                """, (user_id,))
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"查詢用戶類別進度失敗: {e}")
            return []

    def get_user_30day_completion_rate(self, conn, user_id):
        """
        計算使用者近30天註冊課程的完成率
        """
        if not conn:
            return {
                "enrolled_courses_30days": 0,
                "completed_courses_30days": 0, 
                "completion_rate_30days": 0
            }
        
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                    COUNT(DISTINCT e.courseid) AS enrolled_courses_30days,
                    COUNT(DISTINCT cc.course) AS completed_courses_30days,
                    CASE 
                        WHEN COUNT(DISTINCT e.courseid) = 0 THEN 0
                        ELSE ROUND(
                            COUNT(DISTINCT cc.course) / COUNT(DISTINCT e.courseid) * 100, 1
                        )
                    END AS completion_rate_30days,
                    UNIX_TIMESTAMP(NOW()) AS `current_ts`,
                    UNIX_TIMESTAMP(NOW()) - (30 * 24 * 60 * 60) AS `thirty_days_ago_ts`
                FROM mdl_user_enrolments ue
                JOIN mdl_enrol e ON e.id = ue.enrolid
                LEFT JOIN mdl_course_completions cc 
                    ON cc.course = e.courseid AND cc.userid = ue.userid
                WHERE ue.userid = %s
                AND ue.timestart >= (UNIX_TIMESTAMP(NOW()) - (30 * 24 * 60 * 60))
                AND ue.timestart <= UNIX_TIMESTAMP(NOW());



                """, (user_id,))
                
                result = cursor.fetchone()
                
                if result:
                    return {
                        "enrolled_courses_30days": result['enrolled_courses_30days'],
                        "completed_courses_30days": result['completed_courses_30days'],
                        "completion_rate_30days": result['completion_rate_30days'],
                        "current_timestamp": result['current_ts'],
                        "thirty_days_ago_timestamp": result['thirty_days_ago_ts']
                    }

                else:
                    return {
                        "enrolled_courses_30days": 0,
                        "completed_courses_30days": 0,
                        "completion_rate_30days": 0
                    }
                    
        except Exception as e:
            logger.error(f"查詢用戶30天完成率失敗: {e}")
            return {
                "enrolled_courses_30days": 0,
                "completed_courses_30days": 0,
                "completion_rate_30days": 0
            }
   
    def get_user_degree(self, conn, user_id):
        """
        取得使用者的學習程度 (degree)
        """

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT degree
                    FROM mdl_user 
                    WHERE id = %s
                """, (user_id,))
                result = cursor.fetchone()
                return result['degree'] if result and result['degree'] else None
        except Exception as e:
            logger.error(f"查詢用戶學習程度失敗: {e}")
            return None
    
    def get_summary(self, user_id, include_stats=False):
        """統一學生查詢管理函式"""
        conn, tunnel = None, None
        try:
            conn, tunnel = self.connect_db()
            if not conn:
                return {"error": "連線建立失敗"}
            
            # 取得學生基本資料
            profile = self.get_student_profile(conn, user_id)
            if not profile:
                return {"error": f"找不到ID為 {user_id} 的學生資料"}
            
            completed_count = self.get_user_completed_course_count(conn, user_id)
            # 取得四個類別的完成進度
            category_progress = self.get_user_category_progress(conn, user_id)
             # 取得近30天完成率
            thirty_day_stats = self.get_user_30day_completion_rate(conn, user_id)
            user_degree = self.get_user_degree(conn, user_id)

            # 組裝回傳資料
            result = {
                "profile": profile,
                "course_completed_count": completed_count,
                "category_progress": category_progress,  # 新增這行
                "user_id": user_id,
                "thirty_day_stats": thirty_day_stats,  # 新增這行
                "user_degree": user_degree,  # 新增這行
                "success": True
            }
            
            return result
            
        except Exception as e:
            logger.error(f"查詢學生資料時發生錯誤: {e}")
            return {"error": f"查詢過程中發生錯誤: {e}", "success": False}
    
    def get_student_by_id(self, user_id):
        """取得單一學生（向後相容）"""
        result = self.get_summary(user_id)
        return result.get("profile") if result.get("success") else None
    
    def __enter__(self):
        """支援 with 語句"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """支援 with 語句，自動關閉連線"""
        self.disconnect()



if __name__ == "__main__":
    print("=== Class 方式簡單測試 ===")
    try:
        with StudentDatabase() as db:
            user_id = 2274978  # 測試使用者 ID  124 20238  2274978
            result = db.get_summary(user_id)
            if result.get("success"):
                profile = result["profile"]
                print(f"學生ID: {profile.get('id')}, 姓名: {profile.get('username')}")
                print(f"Email: {profile.get('email')}, 完成課程數: {result.get('course_completed_count')}")
                print(f"學習程度: {result.get('user_degree', '未設定')}")  # 新增這行
                # 顯示四個類別的完成進度
                print("\n=== 類別完成進度 ===")
                for progress in result.get('category_progress', []):
                    print(f"{progress['category_group']}: {progress['completed_courses']}/{progress['total_courses']} ({progress['completion_percent']}%)")

                print("\n=== 近30天完成率 ===")
                thirty_day_stats = result.get('thirty_day_stats', {})
                print(f"近30天註冊課程數: {thirty_day_stats.get('enrolled_courses_30days', 0)}")
                print(f"近30天完成課程數: {thirty_day_stats.get('completed_courses_30days', 0)}")
                print(f"近30天完成率: {thirty_day_stats.get('completion_rate_30days', 0)}%")

            else:
                print(f"查詢失敗: {result.get('error')}")
    except Exception as e:
        print(f"測試執行錯誤: {e}")
