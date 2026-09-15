from .dynamic_text_selector import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# ВАЖНО: Эта строчка принудительно указывает серверу ComfyUI, 
# что в папке данного кастомного узла есть веб-расширения (JS), которые нужно отдать в браузер
WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]