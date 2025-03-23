# DomMover

DomMover is a lightweight, dependency-free JavaScript library that makes DOM elements draggable and reorderable. It's flexible, customizable, and works seamlessly with lists, table rows, grid items, and more.

## Features

*   **Simple Drag-and-Drop:**  Easily make any set of sibling elements draggable and reorderable.
*   **Customizable:**  Control the appearance and behavior with CSS classes and options.
*   **Callbacks:**  Hook into key events (pickup, drag, drop, beforeDrop) for custom logic.
*   **Data Attributes:**  Automatically extract data attributes from dragged elements.
*   **Drop Indicator:**  Optionally display a visual indicator of the drop position.
*   **Custom Drag Image:**  Use a custom drag image for improved visual feedback.
*   **Instance-Specific:** Multiple instances of DomMover can coexist on the same page without conflicts.
*   **No Dependencies:**  Written in pure JavaScript, with no external library dependencies (optional jQuery integration).
*   **Lightweight:** Small file size for fast loading.
*   **Cross-Browser Compatible:**  Works reliably in modern browsers.
*   **Mobile Support** (Planned - via touch events)
*   **Element Type Validation:** Prevents sorting of invalid element types (e.g., `<tbody>`, `<thead>`).
*   **Duplicate callback control**: The drag callback won't be triggered unnecessarily.

## Installation

**Direct Download:**

Download the `dom-mover.js` file from the [releases](https://github.com/jkthoppil/dom-mover/releases/tag/v1.0.0) page and include it in your HTML:

```html
<script src="path/to/dom-mover/dom-mover.js"></script>
```

**NPM:**

```bash
npm install dom-mover --save
```

Then, import it into your project:

```javascript
import DomMover from 'dom-mover';
```

**CDN:**

```html
<script src="https://cdn.jsdelivr.net/gh/jkthoppil/dom-mover@1.0.0/dom-mover.min.js"></script>
```

## Usage

### Basic Usage

```html
<ul id="my-list">
  <li data-id="1">Item 1</li>
  <li data-id="2">Item 2</li>
  <li data-id="3">Item 3</li>
</ul>

<script>
  new DomMover('#my-list li');
</script>
```

### With Options and Callbacks

```javascript
new DomMover('table tr', {
    pickup: {
        addClass: 'dragging', // Class added when dragging
        disabledClass: 'no-drag' // Class to prevent dragging on an element
    },
    callbacks: {
        pickup: (draggedItem, draggedItemData, prevElem, nextElem) => {
            console.log('Picked up:', draggedItem, draggedItemData);
            if (prevElem) console.log('Previous element:', prevElem);
            if (nextElem) console.log('Next element:', nextElem);
        },
        drag: (event, draggedItem, elementBelow, placeholderPosition) => {
           console.log("Drag:", draggedItem, "over", elementBelow, "placeholder is", placeholderPosition);
        },
        beforeDrop: (draggedItem, prevElem, draggedItemData, beforeElementData, nextElem) => {
            console.log('Before drop:', draggedItem, draggedItemData);
            // You can cancel the drop by returning false
             if (prevElem && prevElem.dataset.id === '2') {
                console.log('Cannot drop before item with ID 2');
                return false; // Prevent the drop
            }
        },
        drop: (draggedItem, prevElem, draggedItemData, beforeElementData, nextElem) => {
            console.log('Dropped:', draggedItem, draggedItemData);
            if (prevElem) console.log('Dropped after:', prevElem, 'with data', beforeElementData);
            if (nextElem) console.log('Dropped before:', nextElem);

            // Perform any actions after the drop (e.g., update server)
            updateOrderOnServer();
        }
    },
    dataAttributes: ['id', 'custom-data'], // Extract these data attributes
    dropIndicator: true,
    debug: true // Enable console logging
});

function updateOrderOnServer() {
    // ... (Implementation to send the new order to your server) ...
}
```
### jQuery Integration (Optional)

If jQuery is present, DomMover automatically adds a jQuery plugin:

```javascript
$('#my-list li').domMover({
  // ... options ...
});

```

## Options

| Option                     | Type          | Default                       | Description                                                                                                                   |
| :------------------------- | :------------ | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `pickup`                   | `object`      | `{}`                          | Options for picking up an element.                                                                                            |
| `pickup.parent`            | `string`      | `null`                        | Selector for a parent to constrain dragging.  If `null`, the closest common parent of all draggable elements is used.        |
| `pickup.disabledClass`    | `string`      | `'sortable-disabled'`        | Class that prevents an element from being dragged.                                                                            |
| `pickup.addClass`        | `string`      | `'sortable-dragging'`        | Class added to the dragged element.                                                                                          |
| `pickup.removeClass`     | `string`      | `''`                          | Class removed from the dragged element.                                                                                       |
| `drop`                     | `object`      | `{}`                          | Options for dropping an element.                                                                                              |
| `drop.parent`              | `string`      | `null`                        | Selector for a parent to constrain dropping (usually the same as `pickup.parent`).                                             |
| `drop.addClass`          | `string`      | `''`                          | Class added to the drop target (not commonly used, as placeholder is typically used instead).                            |
| `drop.removeClass`       | `string`      | `''`                          | Class removed from the drop target.                                                                                         |
| `callbacks`                | `object`      | `{}`                          | Callback functions.                                                                                                          |
| `callbacks.pickup`         | `function`    | `null`                        | Called when an element is picked up.  `(draggedItem, draggedItemData, prevElem, nextElem)`                                     |
| `callbacks.drag`         | `function`    | `null`                       | Called during dragging. `(event, draggedItem, elementBelow, placeholderPosition)`                                           |
| `callbacks.drop`           | `function`    | `null`                        | Called when an element is dropped. `(draggedItem, prevElem, draggedItemData, beforeElementData, nextElem)`                       |
| `callbacks.beforeDrop`     | `function`    | `null`                        | Called *before* dropping. Return `false` to cancel. `(draggedItem, prevElem, draggedItemData, beforeElementData, nextElem)`   |
| `dataAttributes`           | `string[]`    | `['id', 'sort']`              | Array of data attribute names to extract from dragged elements.                                                               |
| `dropIndicatorClass`       | `string`      | `'sortable-drop-indicator'`   | Class applied to the drop indicator element.                                                                                  |
| `dropIndicator`            | `boolean`     | `true`                        | Whether to show a drop indicator.                                                                                            |
| `dragImageClass`           | `string`      | `'sortable-drag-image'`       | Class applied to the custom drag image.                                                                                       |
| `placeholderClass`         | `string`      | `'sortable-placeholder'`      | Class applied to the placeholder element.                                                                                     |
| `debug`                    | `boolean`     | `false`                       | Enable debug logging to the console.                                                                                          |
| `allowDuplicateCallbacks` | `boolean`     | `false`                       | If `true`, the `drag` callback will fire repeatedly even over the same element.  If `false`, it only fires when the element under the cursor or the mouse direction changes. |

## Callback Arguments

The callback functions receive the following arguments:

*   **`pickup(draggedItem, draggedItemData, prevElem, nextElem)`**
    *   `draggedItem`: The DOM element being dragged.
    *   `draggedItemData`: An object containing the data attributes extracted from the `draggedItem`.
    *   `prevElem`: The sibling element *before* the `draggedItem` in its original position (can be `null`).
    *   `nextElem`: The sibling element *after* the `draggedItem` in its original position (can be `null`).

*   **`drag(event, draggedItem, elementBelow, placeholderPosition)`**
    *   `event`: The `dragover` event object.
    *   `draggedItem`: The DOM element being dragged.
    *   `elementBelow`: The DOM element currently underneath the mouse cursor (within the sortable area).
    *  `placeholderPosition`: String indicating the position of the placeholder, it'll be either *top* or *bottom*.

*   **`beforeDrop(draggedItem, prevElem, draggedItemData, beforeElementData, nextElem)`**
    *   `draggedItem`: The DOM element being dragged.
    *   `prevElem`: The element the `draggedItem` will be placed *after* (can be `null`).  This is where the placeholder was *before* the `drop` event.
    *   `draggedItemData`: Data attributes from the `draggedItem`.
    *  `beforeElementData`: Data attributes from the `prevElem`.
    *   `nextElem`: The element the `draggedItem` will be placed *before* (can be `null`). This is where placeholder was.

*   **`drop(draggedItem, prevElem, draggedItemData, beforeElementData, nextElem)`**
    *   `draggedItem`: The DOM element being dragged.
    *   `prevElem`: The element the `draggedItem` was placed *after* (can be `null`).
    *   `draggedItemData`: Data attributes from the `draggedItem`.
    *   `beforeElementData`: Data attributes from the `prevElem`.
    *   `nextElem`: The element the `draggedItem` was placed *before* (can be `null`).

## Browser Compatibility

DomMover is compatible with modern browsers that support the HTML Drag and Drop API. This includes:

*   Chrome
*   Firefox
*   Safari
*   Edge
*   Opera

## License

[MIT](LICENSE) - See the `LICENSE` file for details.  You are free to use, modify, and distribute this library, but you must include the original copyright and license notice. Contributions are welcome!

## Contributing

Contributions are welcome!  If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/jkthoppil/dom-mover).  If you'd like to contribute code, please fork the repository and submit a pull request.

## Author

DomMover is created by Jayakrishnan Thoppil ([@jkthoppil](https://github.com/jkthoppil)).

Copyright (c) 2025 Jayakrishnan Thoppil.
