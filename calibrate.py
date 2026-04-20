import mss
import mss.tools
from PIL import Image, ImageDraw
import json
import os

def calibrate():
    print("--- NTIVISTUDIO CALIBRATION ---")
    print("1. Откройте Olymp Trade в браузере на весь экран.")
    print("2. Скрипт сделает скриншот и назовет его 'calibrate_me.png'.")
    
    with mss.mss() as sct:
        # Снимок всего экрана
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        img.save("calibrate_me.png")
        
    print("\nСкриншот сохранен как 'calibrate_me.png'.")
    print("Посмотрите на него и определите координаты (X, Y, Ширина, Высота) для:")
    print("- Области графика (основные свечи)")
    print("- Области RSI (если есть индикатор внизу)")
    
    # Пример структуры для config.json
    config = {
        "chart_area": {"top": 200, "left": 300, "width": 1200, "height": 600},
        "rsi_area": {"top": 800, "left": 300, "width": 1200, "height": 150}
    }
    
    with open("config.json", "w") as f:
        json.dump(config, f, indent=4)
        
    print("\nФайл 'config.json' создан с примерными значениями.")
    print("Отредактируйте его, подставив свои координаты из 'calibrate_me.png'.")

if __name__ == "__main__":
    calibrate()
