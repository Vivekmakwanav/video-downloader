import sqlite3

def run():
    conn = sqlite3.connect("/home/ubuntu/video-downloader/backend/sql_app.db")
    c = conn.cursor()
    c.execute("SELECT id, status, url, format_id FROM download_history ORDER BY id DESC LIMIT 10;")
    rows = c.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, Status: {row[1]}, URL: {row[2]}, Format: {row[3]}")
    conn.close()

if __name__ == "__main__":
    run()
