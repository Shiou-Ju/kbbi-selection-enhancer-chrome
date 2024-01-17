# if the code does not work, take macos for example, open the System Preferences > Security & Privacy > Privacy tab.
# turn on permission for the terminal app, and execute this try to see if spotlight is open
# even using mandarin or other languages, as long as there is insertion, the test shall pass

import pyautogui
import sys

has_input = len(
    sys.argv) > 1

default_text = "hello world"

# bug: https://github.com/asweigart/pyautogui/issues/796
text_to_type_but_sometimes_triggers_bug = sys.argv[1] if has_input else default_text

interval_between_chars = 0.2

pyautogui.write(text_to_type_but_sometimes_triggers_bug,
                interval=interval_between_chars)
