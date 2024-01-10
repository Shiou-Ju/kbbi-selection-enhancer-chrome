import pyautogui
import platform

is_macos = platform.system() == "Darwin"


def copy_clipboard():
    if is_macos:
        pyautogui.hotkey('command', 'c')
    else:
        pyautogui.hotkey('ctrl', 'c')


copy_clipboard()
