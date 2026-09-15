import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

app.registerExtension({
    name: "DynamicSelector",
    async nodeCreated(node) {
        if (node.constructor.type !== "DynamicSelector") return;

        // Создаем виджет превью текста
        node.display_widget = ComfyWidgets.STRING(node, "output_preview", ["STRING", { multiline: true }], app).widget;
        node.display_widget.inputEl.readOnly = true;
        node.display_widget.inputEl.style.opacity = 0.8;

        const indexWidget = node.widgets.find(w => w.name === "select_index");

        // Функция мгновенного чтения текста из подключенной ноды на клиенте
        const updatePreviewFromConnectedNode = () => {
            if (!node.graph || !node.inputs || !node.display_widget) return;

            const currentIndex = parseInt(indexWidget?.value || 1);
            const targetInputName = `text_${currentIndex}`;
            
            // Ищем входной слот, соответствующий выбранному индексу
            const targetInput = node.inputs.find(i => i.name === targetInputName);

            // Если слот пустой или не существует
            if (!targetInput || targetInput.link === null) {
                node.display_widget.value = " [Выбранный вход пуст или не подключен]";
                return;
            }

            // Получаем информацию о проводе (связи)
            const linkInfo = node.graph.links[targetInput.link];
            if (!linkInfo) return;

            // Находим родительскую ноду, откуда тянется провод
            const originNode = node.graph.getNodeById(linkInfo.origin_id);
            if (!originNode) return;

            // Ищем в родительской ноде любой виджет, содержащий текст
            // Обычно это виджеты с типом "customtext", текстовые поля в Primitive или STRING в CLIP Text Encode
            const textWidget = originNode.widgets?.find(w => w.type === "customtext" || w.type === "text" || w.name === "text" || w.name === "string" || typeof w.value === "string");

            if (textWidget && textWidget.value !== undefined) {
                // Копируем текст во внутреннее превью нашей ноды прямо на лету!
                node.display_widget.value = String(textWidget.value);
            } else {
                node.display_widget.value = ` [Подключен узел: ${originNode.title || originNode.type}, но текст не найден]`;
            }
            node.setDirtyCanvas(true);
        };

        // Настраиваем callback изменения индекса (зацикливание + мгновенное превью)
        if (indexWidget) {
            indexWidget.callback = function(value) {
                const connectedCount = node.inputs ? node.inputs.filter(i => i.name.startsWith("text_") && i.link !== null).length : 0;
                
                if (connectedCount > 0) {
                    if (value > connectedCount) {
                        indexWidget.value = 1;
                    } else if (value < 1) {
                        indexWidget.value = connectedCount;
                    }
                } else {
                    indexWidget.value = 1;
                }

                // Вызываем мгновенное обновление текста при клике на стрелочки
                updatePreviewFromConnectedNode();
            };
        }

        // Синхронизация структуры слотов и ограничений
        const syncInputsAndLimits = () => {
            if (!node.inputs) node.inputs = [];

            const connected = node.inputs.filter(i => i.name.startsWith("text_") && i.link !== null);
            const totalConnected = connected.length;

            const cleanInputs = [];
            connected.forEach((input, index) => {
                input.name = `text_${index + 1}`;
                cleanInputs.push(input);
            });
            node.inputs = cleanInputs;

            const nextEmptyIdx = node.inputs.length + 1;
            node.addInput(`text_${nextEmptyIdx}`, "STRING", { forceInput: true });

            if (indexWidget) {
                if (totalConnected > 0) {
                    indexWidget.options.min = 1;
                    indexWidget.options.max = totalConnected;
                    if (indexWidget.value > totalConnected) {
                        indexWidget.value = totalConnected;
                    }
                } else {
                    indexWidget.options.min = 1;
                    indexWidget.options.max = 1;
                    indexWidget.value = 1;
                }
            }

            // После перестройки слотов проверяем текст
            updatePreviewFromConnectedNode();
            node.setSize(node.computeSize());
            app.canvas.setDirty(true, true);
        };

        // Обработка интерактивного изменения связей
        node.onConnectionsChange = function(type, slot, connected, link_info) {
            if (type === 1) { 
                setTimeout(syncInputsAndLimits, 20);
            }
        };

        // Первичный запуск
        syncInputsAndLimits();
    }
});
