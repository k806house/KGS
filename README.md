# KGS

Необходимо при помощи API KGS создать лидерборд (рейтинговую таблицу) и отобразить игры для клиента. Формирование лидерборда и отображение игр делается для ТОП-100 игроков. Работа производится только с последними двумя играми каждого игрока.

Требования к лидерборду:
* Отсортированные партии (2 последние игры ТОП-100 пользователей)
* Описание позиции рейтинга: имя игрока 1, имя игрока 2, счёт партии, длительность партии, цвет камней игрока 1, цвет камней игрока 2, дополнительная аналитика партии.

Требования к отображению игры:
* Переход по клику на позицию из рейтинга на экран, где можно посмотреть партию
* Отображение игровой доски
* Отображение последовательности ходов
* Возможность прокручивать вперед/назад ход игры

Решение:
Используемый стек технологий - React + Bootstrap + Snap.svg
Был написан скрипт parsePlayers, для обращения к API, скрипт полностью рабочий, выполняется с ноды, но из-за cors-политик вышеупомянутого апи, демо было записано с испольлзованием тестовых данных и парсинга.

