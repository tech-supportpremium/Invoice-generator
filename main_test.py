import webview
import os


def main():
    # HARDCODE the exact path (make sure this matches YOUR system)
    ui_path = r"C:\Users\0035326\PycharmProjects\Invoice_3.0\ui\index.html"

    print(f"Looking for HTML at: {ui_path}")

    # Check if file exists
    if not os.path.exists(ui_path):
        print(f"❌ File not found at: {ui_path}")
        return

    print("✅ File found! Loading...")

    # Read the HTML file and print first 100 chars to verify
    with open(ui_path, 'r', encoding='utf-8') as f:
        content = f.read(100)
        print(f"First 100 chars of HTML: {content}")

    # Create the window with DEBUG mode
    webview.create_window(
        'Test Main Window',
        url=ui_path,
        width=800,
        height=600
    )
    webview.start(debug=True)  # 👈 This opens dev tools so you can see errors


if __name__ == '__main__':
    main()