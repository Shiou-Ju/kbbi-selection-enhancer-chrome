import pyautogui
import time


def press_key(key, presses=1, interval=0.3):
    for _ in range(presses):
        pyautogui.press(key)
        time.sleep(interval)


# Press 'ArrowDown' twice and 'Enter' once
press_key('down', presses=2)
press_key('enter', presses=1)
