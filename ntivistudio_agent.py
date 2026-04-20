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

import requests
import threading

class NTIVISTUDIO:
    def __init__(self):
        self.bot_token = os.getenv('BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.bot = Bot(token=self.bot_token) if self.bot_token else None
        
        self.config_path = 'config.json'
        self.config = self.load_config()
        
        self.sct = mss.mss()
        self.is_running = False
        self.active_from_twa = False # Состояние из Web App
        self.current_asset = "BTCUSD"
        
        self.candle_history = []
        self.last_signal_time = 0
        
        # Топики для связи
        self.TOPIC_CONTROL = 'ntivistudio_control_v1'
        self.TOPIC_SIGNALS = 'ntivistudio_signals_v1'

    def load_config(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as f:
                return json.load(f)
        return {
            'chart_area': {'top': 200, 'left': 300, 'width': 1200, 'height': 600},
            'rsi_area': {'top': 800, 'left': 300, 'width': 1200, 'height': 150}
        }

    async def send_signal(self, direction, confidence):
        now = time.time()
        if now - self.last_signal_time < 60:
            return

        self.last_signal_time = now
        
        # 1. Отправка в Telegram Bot
        icon = "🔼" if direction == "UP" else "🔽"
        msg = f"🚀 **NTIVISTUDIO SIGNAL**\n\nНаправление: {icon} {direction}\nВремя: 1 МИНУТА\nТочность: {confidence}%"
        if self.bot and self.chat_id:
            try: await self.bot.send_message(chat_id=self.chat_id, text=msg, parse_mode='Markdown')
            except: pass
            
        # 2. Отправка в Web App через ntfy
        payload = {
            "action": "SIGNAL",
            "direction": direction,
            "confidence": confidence,
            "asset": self.current_asset
        }
        try:
            requests.post(f"https://ntfy.sh/{self.TOPIC_SIGNALS}", data=json.dumps(payload))
        except: pass

    def listen_to_twa(self):
        """Фоновый поток для прослушивания команд из Web App"""
        print(f"[*] Слушаю команды из Web App на топике {self.TOPIC_CONTROL}...")
        while True:
            try:
                # Лонг-поллинг ntfy
                resp = requests.get(f"https://ntfy.sh/{self.TOPIC_CONTROL}/json?poll=1", timeout=60)
                for line in resp.iter_lines():
                    if line:
                        data = json.loads(line)
                        if "message" in data:
                            msg = json.loads(data["message"])
                            if msg.get("action") == "START":
                                self.active_from_twa = True
                                self.current_asset = msg.get("asset", "BTCUSD")
                                print(f"[TWA] Агент ВКЛЮЧЕН пользователем. Актив: {self.current_asset}")
                            elif msg.get("action") == "STOP":
                                self.active_from_twa = False
                                print("[TWA] Агент ВЫКЛЮЧЕН пользователем.")
            except Exception as e:
                time.sleep(5)

    def capture_area(self, area):
        screenshot = self.sct.grab(area)
        return cv2.cvtColor(np.array(screenshot), cv2.COLOR_BGRA2BGR)

    def analyze_candles(self, img):
        h, w, _ = img.shape
        last_candle_area = img[:, int(w*0.95):]
        avg_color = np.mean(last_candle_area, axis=(0, 1))
        if avg_color[1] > avg_color[2] + 15: return "GREEN"
        if avg_color[2] > avg_color[1] + 15: return "RED"
        return "GRAY"

    def analyze_rsi(self, img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
        points = np.where(thresh == 255)
        if len(points[0]) > 0:
            return 100 - (np.mean(points[0]) / img.shape[0] * 100)
        return 50

    async def send_heartbeat(self, rsi, candle):
        """Отправка текущего состояния рынка в Web App"""
        payload = {
            "action": "HEARTBEAT",
            "rsi": round(rsi, 1),
            "candle": candle,
            "asset": self.current_asset,
            "timestamp": time.time()
        }
        try:
            requests.post(f"https://ntfy.sh/{self.TOPIC_SIGNALS}", data=json.dumps(payload))
        except: pass

    async def run(self):
        print("--- NTIVISTUDIO АГЕНТ ЗАПУЩЕН ---")
        self.is_running = True
        
        # Запуск слушателя TWA в отдельном потоке
        threading.Thread(target=self.listen_to_twa, daemon=True).start()
        
        pattern_start_time = 0
        current_pattern = None
        last_heartbeat = 0
        
        while self.is_running:
            try:
                if not self.active_from_twa:
                    await asyncio.sleep(1)
                    continue

                chart_img = self.capture_area(self.config['chart_area'])
                current_candle = self.analyze_candles(chart_img)
                
                rsi_img = self.capture_area(self.config['rsi_area'])
                rsi_value = self.analyze_rsi(rsi_img)
                
                # Отправка Heartbeat раз в секунду
                if time.time() - last_heartbeat >= 1.0:
                    await self.send_heartbeat(rsi_value, current_candle)
                    last_heartbeat = time.time()

                detected_now = None
                if rsi_value < 13 and current_candle == "GREEN":
                    detected_now = "UP"
                elif rsi_value > 87 and current_candle == "RED":
                    detected_now = "DOWN"
                
                if detected_now and detected_now == current_pattern:
                    if time.time() - pattern_start_time >= 3:
                        await self.send_signal(detected_now, 98 if rsi_value < 10 or rsi_value > 90 else 96)
                        current_pattern = None
                elif detected_now:
                    current_pattern = detected_now
                    pattern_start_time = time.time()
                else:
                    current_pattern = None

                await asyncio.sleep(0.5)
            except Exception as e:
                print(f"[ERROR] {e}")
                await asyncio.sleep(2)

if __name__ == "__main__":
    agent = NTIVISTUDIO()
    asyncio.run(agent.run())
