# setup.py
import sys
from PyInstaller.__main__ import run

if __name__ == '__main__':
    opts = [
        'main.py',
        '--name=InvoiceGenerator',
        '--onefile',
        '--windowed',
        '--add-data=ui:ui',
        '--add-data=assets:assets',
        '--add-data=config.json:.',
        '--add-data=core:core',
        '--add-data=api.py:.',
        '--hidden-import=reportlab',
        '--hidden-import=pywebview',
        '--clean'
    ]

    if sys.platform == 'win32':
        opts.append('--icon=assets/logo.ico')

    run(opts)