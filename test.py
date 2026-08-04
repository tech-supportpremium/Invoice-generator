import webview

def main():
    # Make sure you use html= parameter
    webview.create_window(
        title="Test Window",
        html="<h1>Hello World!</h1>",
        width=400,
        height=300
    )
    webview.start()

if __name__ == "__main__":
    main()