import sys
import io

# ===== WINDOWS ENCODING FIX (with null check) =====
if sys.platform == 'win32':
    if sys.stdout is not None:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    if sys.stderr is not None:
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import webview
import threading
from app import app


def start_flask():
    app.run(host='localhost', port=8090, debug=False)


if __name__ == '__main__':
    print("Invoice Generator v3 - Starting...")

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