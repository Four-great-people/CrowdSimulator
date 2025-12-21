## Frontend Service

## Purpose

React приложение для отображения карты и визуализации движения персонажей по лабиринту.

## Сборка

Проект использует Vite в качестве системы сборки.

## Технологии

- `Vite` - инструмент для сборки фронтенд-приложений
- `React 18` - библиотека для построения пользовательских интерфейсов
- `TypeScript` - типизированная надстройка над JavaScript

## Предварительные требования

- Node.js версии 20.19 или выше
- npm (поставляется с Node.js)

## Быстрый старт

- Windows: Установите Node.js с официального сайта: https://nodejs.org/
- Mac: brew install node
- Linux (Ubuntu/Debian): sudo apt install nodejs npm

Установите зависимости проекта:

```bash
	npm install
```
Запустите приложение:

```bash
	npm run dev
```

Запуск с заглушками вместо обращения к middle-end:

```bash
	MODE=debug npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

Доступные команды
```bash
npm run dev        # Запуск development сервера (Vite)
npm run build      # Сборка для production (Vite)
npm run preview    # Предпросмотр production сборки (Vite)
```
## Структура проекта

```
frontend/
├── src/
│   ├── components/     # многоразовые компоненты React (отрисовка сетки на сайте)
│   ├── models/         # Классы объектов
│   ├── services/       # Внешние сервисы (взаимодействие с бэкендом)
│   └── styles/         # Стили
├── App.tsx            # Основной компонент приложения. Ввод новых объектов, анимация.
├── eslint.config.js   # ESLint конфигурация
├── index.html         # точка входа для html
├── main.jsx           # точка входа для JavaScript
├── package-lock.json
├── package.json       # зависимости
└── vite.config.js     # Vite конфигурация
```

## Модели данных

```
Grid

    width, height - размеры сетки (40×22 клеток по умолчанию)

    cells: Cell[][] - двумерный массив клеток

    persons: NamedPoint[] - список персонажей

    goals: NamedPoint[] - список целей

    groups: Group[] - список групп

    walls: Wall[] - список стен

    maxTicks: number - максимальное среди всех клеток число тиков, где был человек

Cell

    x, y - координаты

    isWall: boolean - является ли стеной

    persons: NamedPoint[] - список персонажей

    goals: NamedPoint[] - цель в клетке

    usedTicks: number - число тиков для конкретной клетки

    lastTick: number - последний раз, когда на этой клетке был человек 

    directionOfWall: string[] - направление стены

Group
    id: number - ID группы
    start_position: { x: number; y: number } - начальная позиция
    total_count: number - количество участников в группе
    person_ids: number[] - список ID участников в группе

NamedPoint

    id: number - идентификатор
    position: Position - текущая позиция
    reachedGoal: boolean - достигнута ли цель

Wall
    first: { x: number; y: number } - первая точка стены
    second: { x: number; y: number } - вторая точка стены
    direction: 'horizontal' | 'vertical' - направление стены
```

## Замечания
- При значительный изменениях структуры кода, новых import, может возникать ошибка  "неверный MIME-тип". Иногда (не всегда) таком случае сервер требуется перезапустить.
- Координата стены - нижний левый угол соответвующей координате клетки. При задании стены ей в том числе присваивается направление - `horizontal` или `vertical`, так же, как и самим клеткам. В GridComponent.css в зависимости от этого значения красится либо боковая левая граница клетки, либо нижняя граница. В функции `AddWall` в `./models/Grid ` выполняются присваивания значений клеткам между заданными крайними точками стены. Это нужно учитывать при смене логики координат для стен.
- NamedPoint отвечает как за человека, так и за цель
