# if the code does not work, take macos for example, open the System Preferences > Security & Privacy > Privacy tab.
# turn on permission for the terminal app, and execute this try to see if spotlight is open
# pyautogui.hotkey('command', 'space', interval=0.1)

import pyautogui
import sys


# even using mandarin or other languages, as long as there is insertion, the test shall pass

# import time

# change insertion if using multiple keyboard
# pyautogui.hotkey('ctrl', 'space', interval=0.2)
# time.sleep(0.3)
# pyautogui.hotkey('ctrl', 'space', interval=0.2)
# time.sleep(0.3)
# pyautogui.press('capslock')
# time.sleep(0.3)


text_to_type = sys.argv[1] if len(sys.argv) > 1 else "hello world"
pyautogui.write(text_to_type)
