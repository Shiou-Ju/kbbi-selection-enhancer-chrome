import pyautogui
import platform

is_macos = platform.system() == "Darwin"

# interval required, see:
# https://github.com/asweigart/pyautogui/issues/513#issuecomment-1494464717
interval_to_properly_trigger_hotkey = 0.3


def copy_clipboard():
    if is_macos:
        pyautogui.hotkey('command', 'c', interval_to_properly_trigger_hotkey)
    else:
        pyautogui.hotkey('ctrl', 'c', interval_to_properly_trigger_hotkey)


copy_clipboard()
