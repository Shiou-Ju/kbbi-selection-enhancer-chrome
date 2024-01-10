import pyautogui
import time


def press_key(key, presses=1, interval=0.3):
    for _ in range(presses):
        pyautogui.press(key)
        time.sleep(interval)


steps_before_inspect = 5

press_key('down', presses=steps_before_inspect)
press_key('enter', presses=1)
