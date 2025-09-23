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

    width, height - размеры сетки (40×22 клеток)

    cells: Cell[][] - двумерный массив клеток

    persons: Person[] - список персонажей

    walls: Wall[] - список стен

Cell

    x, y - координаты

    isWall: boolean - является ли стеной

    persons: Person[] - персонажи в клетке

    goal: Position | null - цель в клетке

    directionOfWall: string - направление стены

Person

    id: number - идентификатор

    position: Position - текущая позиция

    goal: Position - целевая позиция

    reachedGoal: boolean - достигнута ли цель

```

## Интеграция с бэкендом

Проект готов к интеграции с бэкендом через функции в src/api.ts:
```typescript

export const SendGridDataToBackend = async (grid: Grid): Promise<void> => {
  // Реализовать вызов к бэкенду
};

export const GetRoutesFromBackend = async (): Promise<RouteResponse[]> => {
  // Реализовать получение маршрутов
};
```

## Замечания
- При значительный изменениях структуры кода, новых import, может возникать ошибка  "неверный MIME-тип". Иногда (не всегда) таком случае сервер требуется перезапустить.
- Координата стены - нижний левый угол соответвующей координате клетки. При задании стены ей в том числе присваивается направление - `horizontal` или `vertical`, так же, как и самим клеткам. В GridComponent.css в зависимости от этого значения красится либо боковая левая граница клетки, либо нижняя граница. В функции `AddWall` в `./models/Grid ` выполняются присваивания значений клеткам между заданными крайними точками стены. Это нужно учитывать при смене логики координат для стен.
