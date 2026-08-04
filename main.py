import webview
import os
from api import InvoiceAPI


def main():
    # Build the full path to index.html
    ui_path = os.path.join(os.path.dirname(__file__), 'ui', 'index.html')

    print(f"Loading HTML from: {ui_path}")  # Debug line

    # Read the HTML into a string
    with open(ui_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    print(f"HTML loaded: {len(html_content)} characters")  # Debug line

    # Create API instance
    api = InvoiceAPI()

    # Create window with html= NOT url=
    webview.create_window(
        'Invoice Generator v3',
        html=html_content,  # 👈 THIS IS THE KEY FIX
        js_api=api,
        width=1200,
        height=800,
        min_size=(800, 600),
        resizable=True
    )

    webview.start(debug=True)


if __name__ == '__main__':
    main()