# Middle Services

### Purpose
This services are working with many computation-lite requests like signing up, saving map etc. This services are also between frontend and backend on finding paths requests.

#Crowd DB
Проект представляет собой базу данных для хранения карт и людей для симуляции толпы.
В качестве хранилища используется MongoDB. Работа с базой выполняется через Python (библиотека pymongo).

## Структура проекта

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
