import logging

class DynamicSelector:
    @classmethod
    def INPUT_TYPES(s):
        # Генерируем фиксированный список легальных входов, чтобы ComfyUI успешно прошел валидацию графа
        optional_inputs = {}
        for i in range(1, 51):  # Генерирует легальные входы от text_1 до text_50
            optional_inputs[f"text_{i}"] = ("STRING", {"forceInput": True})
            
        return {
            "required": {
                "select_index": ("INT", {"default": 1, "min": 1, "max": 10000, "step": 1}),
            },
            "optional": optional_inputs
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("selected_text",)
    FUNCTION = "select_text"
    CATEGORY = "Text/Utils"

    def select_text(self, select_index, **kwargs):
        actual_key = f"text_{select_index}"

        # Если выбранный индекс не подключен
        if actual_key not in kwargs or kwargs[actual_key] is None:
            logging.warning(f"[DynamicSelector] Вход {actual_key} не подключен или пуст.")
            return {"ui": {"text": [f"ОШИБКА: Вход №{select_index} не подключен!"], "error": [True]}, "result": ("",)}

        chosen_text = str(kwargs.get(actual_key, ""))
        return {"ui": {"text": [chosen_text], "error": [False]}, "result": (chosen_text,)}

NODE_CLASS_MAPPINGS = {"DynamicSelector": DynamicSelector}
NODE_DISPLAY_NAME_MAPPINGS = {"DynamicSelector": "Dynamic Text Selector (Cyclic)"}
