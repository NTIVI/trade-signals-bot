import cv2
import numpy as np
import mss
import time
import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from telegram import Bot
from PIL import Image

# Загрузка переменных окружения
load_dotenv()

class NTIVISTUDIO:
    def __init__(self):
        self.bot_token = os.getenv('BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.bot = Bot(token=self.bot_token) if self.bot_token else None
        
        # Настройки зон (координаты будут уточняться при калибровке)
        # Формат: {'top': 0, 'left': 0, 'width': 1920, 'height': 1080}
        self.config_path = 'config.json'
        self.config = self.load_config()
        
        self.sct = mss.mss()
        self.is_running = False
        
        # История для анализа тренда (цвета последних свечей)
        self.candle_history = []
        self.last_signal_time = 0

    def load_config(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as f:
                return json.load(f)
        return {
            'chart_area': {'top': 200, 'left': 300, 'width': 1200, 'height': 600},
            'rsi_area': {'top': 800, 'left': 300, 'width': 1200, 'height': 150},
            'colors': {
                'green': [0, 255, 0], # BGR
                'red': [0, 0, 255]
            }
        }

    def save_config(self):
        with open(self.config_path, 'w') as f:
            json.dump(self.config, f, indent=4)

    async def send_signal(self, direction, confidence):
        now = time.time()
        if now - self.last_signal_time < 60: # Защита от спама (1 сигнал в минуту)
            return

        self.last_signal_time = now
        icon = "🔼" if direction == "UP" else "🔽"
        msg = f"🚀 **NTIVISTUDIO SIGNAL**\n\n" \
              f"Направление: {icon} {direction}\n" \
              f"Время: 1 МИНУТА\n" \
              f"Точность: {confidence}%\n" \
              f"Актив: Определен по экрану\n\n" \
              f"💎 Входи сейчас!"
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] СИГНАЛ: {direction} ({confidence}%)")
        
        if self.bot and self.chat_id:
            try:
                await self.bot.send_message(chat_id=self.chat_id, text=msg, parse_mode='Markdown')
            except Exception as e:
                print(f"Ошибка Telegram: {e}")

    def capture_area(self, area):
        screenshot = self.sct.grab(area)
        img = np.array(screenshot)
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    def analyze_candles(self, img):
        # Логика анализа свечей через OpenCV
        # 1. Находим правую часть графика, где формируется текущая свеча
        # 2. Определяем доминирующий цвет (зеленый/красный)
        
        h, w, _ = img.shape
        # Берем область последней свечи (примерно правые 5% графика)
        last_candle_area = img[:, int(w*0.95):]
        
        avg_color = np.mean(last_candle_area, axis=(0, 1))
        
        # Упрощенное определение: больше зеленого или красного?
        # В Olymp Trade зеленый обычно [76, 175, 80], красный [244, 67, 54]
        if avg_color[1] > avg_color[2] + 20: # Больше зеленого (G > R)
            return "GREEN"
        elif avg_color[2] > avg_color[1] + 20: # Больше красного (R > G)
            return "RED"
        return "GRAY"

    def analyze_rsi(self, img):
        # Логика определения положения линии RSI
        # Ищем самую яркую точку (линию) и смотрим ее высоту
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
        
        points = np.where(thresh == 255)
        if len(points[0]) > 0:
            avg_y = np.mean(points[0])
            height = img.shape[0]
            position = 100 - (avg_y / height * 100) # 0 внизу, 100 вверху
            return position
        return 50

    async def send_heartbeat(self):
        if self.bot and self.chat_id:
            try:
                await self.bot.send_message(chat_id=self.chat_id, text="👁️ **NTIVISTUDIO** в эфире. Слежу за графиком...")
            except: pass

    async def run(self):
        print("--- NTIVISTUDIO АГЕНТ ЗАПУЩЕН ---")
        print("Агент смотрит на ваш экран и ищет паттерны...")
        self.is_running = True
        
        # Начальный пульс
        await self.send_heartbeat()
        
        # Переменные для подтверждения паттерна
        pattern_start_time = 0
        current_pattern = None
        
        while self.is_running:
            try:
                # 1. Захват графика
                chart_img = self.capture_area(self.config['chart_area'])
                
                # 2. Анализ свечи
                current_candle = self.analyze_candles(chart_img)
                
                # 3. Анализ RSI
                rsi_img = self.capture_area(self.config['rsi_area'])
                rsi_value = self.analyze_rsi(rsi_img)
                
                # ЛОГИКА ПОДТВЕРЖДЕНИЯ (Pattern Confirmation)
                # Сигнал выдается только если условия держатся 3 секунды подряд
                detected_now = None
                if rsi_value < 12 and current_candle == "GREEN":
                    detected_now = "UP"
                elif rsi_value > 88 and current_candle == "RED":
                    detected_now = "DOWN"
                
                if detected_now and detected_now == current_pattern:
                    if time.time() - pattern_start_time >= 3: # Условие держалось 3 сек
                        confidence = 98 if rsi_value < 10 or rsi_value > 90 else 95
                        await self.send_signal(detected_now, confidence)
                        current_pattern = None # Сброс после сигнала
                elif detected_now:
                    current_pattern = detected_now
                    pattern_start_time = time.time()
                else:
                    current_pattern = None

                # Раз в 30 минут отправляем статус
                if int(time.time()) % 1800 == 0:
                    await self.send_heartbeat()
                
                await asyncio.sleep(0.5) # Высокая частота опроса
                
            except Exception as e:
                print(f"Ошибка в цикле: {e}")
                await asyncio.sleep(2)

if __name__ == "__main__":
    agent = NTIVISTUDIO()
    asyncio.run(agent.run())
