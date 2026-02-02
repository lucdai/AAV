import json
import re
from datetime import datetime

def update_dates():
    now = datetime.now()
    date_slash = now.strftime("%d/%m/%Y")
    date_dot = now.strftime("%d.%m.%Y")
    date_chinese = f"{now.year}年{now.month}月{now.day}日"
    
    # Update index.html
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace date in index.html (Vietnamese is default there)
    content = re.sub(r"Cập nhật mới nhất: \d{2}/\d{2}/\d{4}", f"Cập nhật mới nhất: {date_slash}", content)
    
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(content)
    
    # Update translations.json
    with open("translations.json", "r", encoding="utf-8") as f:
        translations = json.load(f)
    
    for lang in translations:
        if "footer_text" in translations[lang]:
            text = translations[lang]["footer_text"]
            # Handle different formats
            if "Cập nhật mới nhất:" in text:
                translations[lang]["footer_text"] = re.sub(r"\d{2}/\d{2}/\d{4}", date_slash, text)
            elif "Last updated:" in text:
                translations[lang]["footer_text"] = re.sub(r"\d{2}/\d{2}/\d{4}", date_slash, text)
            elif "最后更新：" in text:
                translations[lang]["footer_text"] = re.sub(r"\d{4}年\d{1,2}月\d{1,2}日", date_chinese, text)
            elif "Последнее обновление:" in text:
                translations[lang]["footer_text"] = re.sub(r"\d{2}\.\d{2}\.\d{4}", date_dot, text)
            else:
                # Fallback for other languages using DD/MM/YYYY
                translations[lang]["footer_text"] = re.sub(r"\d{2}/\d{2}/\d{4}", date_slash, text)

    with open("translations.json", "w", encoding="utf-8") as f:
        json.dump(translations, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    update_dates()
