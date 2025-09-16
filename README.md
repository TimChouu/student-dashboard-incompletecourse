# 學生儀表板 (Student Dashboard)

這是一個全端網頁應用程式，旨在提供一個清晰的介面來展示和管理學生數據。

## 專案概述

本專案由兩個主要部分組成：

*   **前端 (Frontend)**：一個使用 React 和 Vite 构建的現代化使用者介面，並使用 Tailwind CSS 進行樣式設計。前端負責呈現學生資料、進度條和推薦等視覺化元件。
*   **後端 (Backend)**：一個使用 Python 和 Flask 框架開發的 API 伺服器，負責處理業務邏輯、資料庫互動，並為前端提供數據介面
## 技術棧

*   **前端**:
    *   React
    *   Vite
    *   Tailwind CSS
    *   Recharts (用於圖表)
*   **後端**:
    *   Python
    *   Flask
    *   Flask-CORS
    *   PyMySQL (用於連接 MySQL 資料庫)

## 啟動流程

請依照以下步驟來啟動前端和後端伺服器。建議您開啟兩個終端機視窗分別執行。

### 1. 後端 (Backend)

後端伺服器將在 `http://127.0.0.1:5000` 上運行。

1.  **進入後端資料夾**
    ```bash
    cd backend
    ```

2.  **(建議) 建立並啟用虛擬環境**
    ```bash
    建立python虛擬環境
    ```

3.  **安裝依賴套件**
    ```bash
    pip install -r requirements.txt
    ```

4.  **啟動後端伺服器**
    ```bash
    python app.py
    ```
    您應該會看到伺服器成功啟動的訊息。

### 2. 前端 (Frontend)

前端開發伺服器將在 `http://localhost:5173` (或另一個可用埠號) 上運行。

1.  **進入前端資料夾**
    ```bash
    cd frontend
    ```

2.  **安裝依賴套件**
    ```bash
    npm install
    ```

3.  **啟動前端開發伺服器**
    ```bash
    npm run dev
    ```

4.  **在瀏覽器中開啟**
    在終端機看到類似以下的輸出後，即可在瀏覽器中開啟對應的網址。
    ```
      VITE vX.X.X  ready in XXX ms

      ➜  Local:   http://localhost:5173/
      ➜  Network: use --host to expose
    ```
