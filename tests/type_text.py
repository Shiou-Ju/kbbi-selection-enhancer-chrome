# if the code does not work, open the System Preferences > Security & Privacy > Privacy tab.
# turn on permission for the terminal app, and execute this try to see if spotlight is open
# pyautogui.hotkey('command', 'space', interval=0.1)

import pyautogui
import sys

text_to_type = sys.argv[1] if len(sys.argv) > 1 else "hello world"
pyautogui.write(text_to_type)

