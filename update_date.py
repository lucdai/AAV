import json
import re
from datetime import datetime
from pathlib import Path


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

    # Update per-language translation files
    translations_dir = Path("translations")
    for lang_file in translations_dir.glob("*.json"):
        with open(lang_file, "r", encoding="utf-8") as f:
            translation = json.load(f)

        text = translation.get("footer_text")
        if not text:
            continue

        if "最后更新：" in text:
            translation["footer_text"] = re.sub(r"\d{4}年\d{1,2}月\d{1,2}日", date_chinese, text)
        elif "Последнее обновление:" in text:
            translation["footer_text"] = re.sub(r"\d{2}\.\d{2}\.\d{4}", date_dot, text)
        else:
            translation["footer_text"] = re.sub(r"\d{2}/\d{2}/\d{4}", date_slash, text)

        with open(lang_file, "w", encoding="utf-8") as f:
            json.dump(translation, f, ensure_ascii=False, indent=2)
            f.write("\n")


if __name__ == "__main__":
    update_dates()
