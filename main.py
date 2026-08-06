import sys
import io

# ===== WINDOWS ENCODING FIX =====
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import webview
import threading
from app import app


def start_flask():
    app.run(host='localhost', port=8090, debug=False)


if __name__ == '__main__':
    print("""
    ╔═══════════════════════════════════════════════════╗
    ║   Invoice Generator v3 - Desktop App              ║
    ║                                                   ║
    ║   Starting Flask server...                        ║
    ║   Opening app window...                           ║
    ║                                                   ║
    ║   Press CTRL+C to close                          ║
    ╚═══════════════════════════════════════════════════╝
    """)

    threading.Thread(target=start_flask, daemon=True).start()
    webview.create_window(
        'Invoice Generator v3',
        'http://localhost:8090',
        width=1280,
        height=800,
        min_size=(800, 600),
        resizable=True
    )
    webview.start()