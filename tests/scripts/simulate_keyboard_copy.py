import pyautogui
import platform

is_macos = platform.system() == "Darwin"


def copy_clipboard():
    if is_macos:
        pyautogui.hotkey('command', 'c', interval=0.3)
    else:
        pyautogui.hotkey('ctrl', 'c', interval=0.3)


copy_clipboard()
