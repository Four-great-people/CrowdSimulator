# Middle Services

### Purpose
This services are working with many computation-lite requests like signing up, saving map etc. This services are also between frontend and backend on finding paths requests.

# Flask сервер
Этот сервис для взаимодействия между фронтом и C++-бэкендом:
- принимает карту от фронта и сохраняет её в MONGODB
- по ID отдаёт карту
- по ID отправляет карту на C++ и возвращает рассчитанные маршруты

## Быстрый старт
1. Зависимости и окружение
```bash 
cd middle-services
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
MongoDB должен быть запущен (см. ниже)

2. Запуск фласк
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run --port 5000

```
## Эндпоинты
### POST /maps - сохранить карту
сохраняет документ и возвращает _id
```bash
curl -X POST http://127.0.0.1:5000/maps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Моя карта",
    "up_right_point": {"x": 10, "y": 10},
    "down_left_point": {"x": 0, "y": 0},
    "borders": [
      {"first": {"x": 0, "y": 0}, "second": {"x": 10, "y": 0}},
      {"first": {"x": 10, "y": 0}, "second": {"x": 10, "y": 10}}
    ],
    "persons": [
      {"id": 1, "position": {"x": 1, "y": 1}, "goal": {"x": 5, "y": 5}}
    ]
  }'

```
Ответ:
```json
{ "_id": "..." }
```

### PUT /maps/\<id\> — обновить карту
Обновляет существующую карту в базе по её ID.
```bash
curl -X PUT http://127.0.0.1:5000/maps/<id> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Моя карта",
    "up_right_point": {"x": 20, "y": 20},
    "down_left_point": {"x": 0, "y": 0},
    "borders": [
      {"first": {"x": 0, "y": 0}, "second": {"x": 10, "y": 0}}
    ],
    "persons": [
      {"id": 1, "position": {"x": 1, "y": 1}, "goal": {"x": 5, "y": 5}}
    ]
  }'
```

### DELETE /maps/<id> - удалить карту по ID
Удаляет документ из базы по его идентификатору.
Возвращает статус выполнения операции.
```bash
curl -X DELETE http://127.0.0.1:5000/maps/<id>
```
### GET /maps — получить список из ID и названий всех карт
```bash
curl http://127.0.0.1:5000/maps
```

### GET /maps/\<id\> — получить карту по ID
Возвращает карту в «правильном» порядке ключей (как выше).
```bash
curl http://127.0.0.1:5000/maps/<id>
```
### GET /maps/\<id\>/statistics/{algo name} — получить статистику по маршрутам
"algo name" - это одно из simple, dense, random
- Достаёт карту из БД,
- формирует JSON в нужном порядке ключей,
- отправляет на C++ POST CPP_BACKEND_URL/simple и CPP_BACKEND_URL/{algo name} (1 раз, если "algo name" == simple),
- вычисляет статистику (ideal - без пересечений маршрутов, обычный А*, valid - текущая реализация).
- считает один шаг за 10 секунд, диагональ - 15 секунд, возвращает ответ в секундах и маршрут valid
- null - отсутствие маршрута
```bash
curl -X GET http://127.0.0.1:5000/maps/<id>/statistics/{algo name}
```
```
{
    "ideal": {
      "value": null,
      "problematic": 2,
    },
    "valid": {
      "value": 25,
      "problematic": 3,
    },
    "routes": [
      {
          "id": 0,
          "route": [
              "UP",
              "LEFT",
              "UP",
              "RIGHT",
              "DOWN",
              "RIGHT",
          ]
      }
  ]
}
```
Пустой маршрут тоже возможен. Если добраться невозможно:
```
[{"id":0,"route":null}]
```

### POST /animations - создать анимацию
Сохраняет анимацию и возвращает id

```bash
 curl -X POST http://127.0.0.1:5000/animations
```

```json
  -H "Content-Type: application/json"
  -d '{
    "name": "Моя анимация",
    "up_right_point": {"x": 10, "y": 10},
    "down_left_point": {"x": 0, "y": 0},
    "borders": [...],
    "persons": [...],
    "routes": [...],
    "statistics": {...}
  }'
```
Ответ:
```json
{ "_id": "..." }
```
### GET /animations — получить список всех анимаций
```bash
curl http://127.0.0.1:5000/animations
```

### GET /animations/<id> — получить анимацию по ID
```bash
curl http://127.0.0.1:5000/animations/<id>
```

### PUT /animations/<id> — обновить имя анимации
Меняет только имя у анимации.
```bash
curl -X PUT http://127.0.0.1:5000/animations/<id>
```

```json
-H "Content-Type: application/json"
-d '{"name": "Новое имя"}'
```

### DELETE /animations/<id> — удалить анимацию по ID
Удаляет сохранённую анимацию из базы данных.
Возвращает статус выполнения операции.
```bash
curl -X DELETE http://127.0.0.1:5000/animations/<id>
```

## Тесты
```bash
pytest -q tests_api
```
# Crowd DB
Проект представляет собой базу данных для хранения карт и людей для симуляции толпы.
В качестве хранилища используется MongoDB. Работа с базой выполняется через Python (библиотека pymongo).

## Структура проекта
```
crowd_db/
├── pytest.ini
├── requirements.txt
├── db
│   ├── __init__.py
│   ├── __pycache__
│   ├── client.py
│   ├── config.py
│   ├── models.py
│   ├── repository.py     
│   └── validators.py
├── scripts
│   ├── __pycache__
│   ├── install_mongodb_ubuntu.sh
│   ├── install_mongodb_wsl.sh
│   ├── seed_example_map.py
│   └── setup_db.py
└── tests
    ├── __init__.py
    ├── __pycache__
    ├── conftest.py
    ├── test_models_roundtrip.py
    ├── test_repository_integration.py
    ├── test_repository_unit.py
    └── test_validator_integration.py
```
## Установка MONGODB и python-окружения

- Если ОС - linux (Ubuntu), то запустите скрипт install_mongodb_ubuntu.sh

```bash 
chmod +x scripts/install_mongodb_ubuntu.sh 
./scripts/install_mongodb_ubuntu.sh 
``` 

- Если WSL, то запустите скрипт install_mongodb_wsl.sh

```bash 
chmod +x scripts/install_mongodb_wsl.sh
./scripts/install_mongodb_wsl.sh
```
    
- Создайте виртуальное окружение:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

- Установите зависимости:
```bash
pip install -r requirements.txt
```

## Настройка БД

- Скопировать файл окружения:
```bash
cp .env.example .env
```

- Запустить mongosh и добавить соответствующего пользователя
```
test> use admin
switched to db admin
admin> db.createUser({
...   user: "user",
...   pwd: "password",
...   roles: ["root"]
... })
{ ok: 1 }
admin> exit
```

- Применить схему и индексы:
```bash
python -m scripts.setup_db
```

## Формат документа карты

- _id — уникальный идентификатор (ObjectId)
- up_right_point — верхняя правая граница (x, y)
- down_left_point — нижняя левая граница (x, y)
- borders — список отрезков-препятствий
- persons — список людей, каждый с полями:
- id, position (точка), goal (точка)

### Пример:

```bash 
[
  {
    _id: ObjectId('68c6acce98c09cfb5864f43e'),
    up_right_point: { x: 10, y: 10 },
    down_left_point: { x: 0, y: 0 },
    borders: [
      { first: { x: 0, y: 0 }, second: { x: 10, y: 0 } },
      { first: { x: 10, y: 0 }, second: { x: 10, y: 10 } }
    ],
    persons: [ { position: { x: 0, y: 1 }, goal: { x: 1, y: 1 }, id: 0 } ]
  }
] 
```

## Тесты

Тесты написаны на pytest и делятся на:
- Unit-тесты — работают с mongomock (эмуляция MongoDB).
- Интеграционные — используют настоящую MongoDB.

Команды:
- pytest -q — запуск unit тестов
- pytest -vv -rs — показать причины skip
- pytest -q --integration — запуск всех

### БЫСТРЫЙ СТАРТ

1. Запустить MongoDB:
```bash
   sudo systemctl start mongod
```
2. Настроить коллекцию:
```bash
   python -m scripts.setup_db
```
3. Запустить тесты:
```bash
   pytest -q --integration
```
## ЗАВИСИМОСТИ

- Python 3.10+
- MongoDB 7.0+
- pymongo
- pytest
- mongomock
