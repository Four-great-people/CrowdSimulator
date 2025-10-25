# Backend Service

### Purpose
This service calculates optimal paths for people to take

# Backend. Python

Для интеграционного тестирования всего сервиса здесь используется Python.
Если хотите запустить эти тесты, выполните следующее:
```
sudo apt install -y python3-venv 
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Затем скомпилируйте и запустите сервис:
```
mkdir build
cd build
cmake ..
make backend
./backend
```
Затем запустите тесты:
```
pytest integration_tests/
```

# Backend. Установка библиотек

Устанавливать библиотеки лучше на Linux/WSL

```
sudo apt install libasio-dev zlib1g-dev libgtest-dev libssl-dev libgmock-dev
wget https://github.com/CrowCpp/Crow/releases/download/v1.2.1.2/Crow-1.2.1-Linux.deb
dpkg -i Crow-1.2.1-Linux.deb
```

# Backend. Запросы на сервер

Формат запросов:
```
POST /route/{route name}
Сейчас поддерживается simple, dense и random
```
Request:
```
{
    "_id": "0",
    "up_right_point": { "x": 100, "y": 100 },
    "down_left_point": { "x": 0, "y": 0 },
    "borders": [
        { "first": { "x": 0, "y": 0 }, "second": { "x": 10, "y": 0 } },
        { "first": { "x": 10, "y": 0 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 10 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 0 }, "second": { "x": 0, "y": 10 } }
    ],
    "persons": [
        {
            "id": 0,
            "position": { "x": 0, "y": 1 },
            "goal": { "x": 20, "y": 1 }
        }
    ]
}
```
Response:
```
[
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
```
Пустой маршрут тоже возможен.
Если добраться невозможно:
```
[{"id":0,"route":null}]
```

# Backend. Система сборки

Проект на C++ с системой сборки CMake и различными вариантами компиляции для тестирования и анализа. Всё тестировалось под Linux, однако
большая часть опций должна быть кроссплатформенной

## Структура проекта

```
project/
├── main/
│   ├── include/     # Заголовочные файлы основного кода
│   └── src/         # Исходные файлы основного кода
├── test/
│   ├── include/     # Заголовочные файлы тестов
│   └── src/         # Исходные файлы тестов
└── CMakeLists.txt   # Файл конфигурации сборки
```

## Требования

- CMake версии 3.5 или выше
- Компилятор C++ с поддержкой стандарта C++20
- Библиотеки для тестирования: gmock, gtest

## Сборка проекта

```bash
mkdir build
cd build
cmake ..
make
```

## Цели сборки

### Основные цели

- **`backend`** - стандартная сборка
- **`backend_test`** - стандартная сборка тестов
- **`backend_test_sans`** - тесты с санитайзерами AddressSanitizer и UndefinedBehaviorSanitizer
- **`backend_test_gcov`** - тесты с покрытием кода (gcov)
- **`backend_test_tsan`** - тесты с ThreadSanitizer
- **`backend_test_gprof`** - тесты с профилировщиком gprof

### Вспомогательные цели

- **`vg`** - запуск valgrind для проверки утечек памяти
- **`hg`** - запуск helgrind для проверки race conditions
- **`perf_profile`** - профилирование производительности с perf
- **`cov`** - генерация отчета о покрытии кода
- **`docs`** - генерация документации с doxygen

## Опции компиляции

### Флаги компилятора

Проект использует строгие флаги компиляции:
- `-Werror` - трактовать предупреждения как ошибки
- `-Wall`, `-Wextra`, `-Wpedantic` - максимальный уровень предупреждений
- Различные специфичные флаги для контроля качества кода

### Специализированные сборки

#### Санитайзеры (ASan + UBSan)
```bash
make backend_test_sans
```
- Обнаружение ошибок памяти и неопределенного поведения
- Требует файлов подавления: `asan_ignore.txt`, `ubsan_ignore.txt`

#### Покрытие кода (gcov)
```bash
make backend_test_gcov
make cov  # для генерации HTML-отчета
```
- Генерирует отчет о покрытии кода в директории `cov-report/`

#### ThreadSanitizer
```bash
make backend_test_tsan
```
- Обнаружение race conditions и проблем многопоточности
- Требует файла подавления: `tsan_ignore.txt`

#### Профилирование (gprof)
```bash
make backend_test_gprof
```
- Генерирует данные для профилирования
- Результаты сохраняются в `profile_data.txt`

## Запуск тестов

### Стандартные тесты
```bash
make backend_test
./backend_test
```

### С санитайзерами
```bash
make backend_test_sans
# Автоматически запускается с настройками санитайзеров
```

### С покрытием кода
```bash
make backend_test_gcov
make cov  # генерация отчета
```

## Анализ кода

### Проверка памяти (Valgrind)
```bash
make vg  # для проверки утечек памяти
make hg  # для проверки многопоточности
```
Требует файла подавления: `valgrind_ignore.txt`

### Профилирование производительности
```bash
make perf_profile
```
Результаты сохраняются в `perf_data.txt`

## Генерация документации

```bash
make docs
```

## Конфигурационные файлы

Для подавления ложных срабатываний создайте следующие файлы:
- `asan_ignore.txt` - для AddressSanitizer
- `ubsan_ignore.txt` - для UndefinedBehaviorSanitizer
- `tsan_ignore.txt` - для ThreadSanitizer
- `valgrind_ignore.txt` - для Valgrind

## Примечания

- Большинство специализированных сборок работают только в режиме `Debug`
- Некоторые инструменты (perf, valgrind) могут требовать прав суперпользователя
- Для ThreadSanitizer может потребоваться настройка ядра: `sudo sysctl vm.mmap_rnd_bits=30`
- Для perf может потребоваться: `sudo sysctl kernel.perf_event_paranoid=-1`
