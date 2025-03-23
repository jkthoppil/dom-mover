/*
 * DomMover - A JavaScript library for interactive drag-and-drop reordering of DOM elements.
 * Author: Jayakrishnan Thoppil
 * Version: 1.0.0
 * License: MIT
 *
 * Copyright (c) 2025 Jayakrishnan Thoppil
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * Contributions to this project in any way are welcome.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Options:
 * @param {string|Element|NodeList|Array} elementOrSelector - The element(s) to make draggable, or a selector string.
 * @param {object} [options] - Configuration options for DomMover.
 *
 * @param {object} [options.pickup] - Options related to picking up an element.
 * @param {string|null} [options.pickup.parent=null] - Selector for a parent element to constrain dragging.  If null, uses the closest common parent.
 * @param {string} [options.pickup.disabledClass='sortable-disabled'] - Class to disable dragging on an element.
 * @param {string} [options.pickup.addClass='sortable-dragging'] - Class added to the dragged element during drag.
 * @param {string} [options.pickup.removeClass=''] - Class removed from the dragged element during drag.
 *
 * @param {object} [options.drop] - Options related to dropping an element.
 * @param {string|null} [options.drop.parent=null] - Selector for a parent element to constrain dropping (usually the same as pickup.parent).
 * @param {string} [options.drop.addClass=''] - Class added to the drop target.
 * @param {string} [options.drop.removeClass=''] - Class removed from the drop target.
 *
 * @param {object} [options.callbacks] - Callback functions.
 * @param {function} [options.callbacks.pickup=null] - Called when an element is picked up.  Arguments: (draggedElement, draggedElementData, previousElement, nextElement)
 * @param {function} [options.callbacks.drag=null] - Called during dragging. Arguments: (event, draggedElement, elementBelow, placeholderPosition)
 * @param {function} [options.callbacks.drop=null] - Called when an element is dropped. Arguments: (draggedElement, previousElement, draggedElementData, beforeElementData, nextElement)
 * @param {function} [options.callbacks.beforeDrop=null] - Called *before* a drop. Return `false` to cancel. Arguments: (draggedElement, previousElement, draggedItemData, beforeElementData, nextElement)
 *
 * @param {string[]} [options.dataAttributes=['id', 'sort']] - Data attributes to extract from dragged elements.
 * @param {string} [options.dropIndicatorClass='sortable-drop-indicator'] - Class for the drop indicator.
 * @param {boolean} [options.dropIndicator=true] - Whether to show a drop indicator.
 * @param {string} [options.dragImageClass='sortable-drag-image'] - Class for the custom drag image.
 * @param {string} [options.placeholderClass='sortable-placeholder'] - Class for the placeholder element.
 * @param {boolean} [options.debug=false] - Enable debug logging.
 * @param {boolean} [options.allowDuplicateCallbacks=false] - Whether to allow duplicate 'drag' callbacks.
 */

(function () {
    'use strict';

    class DomMover {
        static defaults = {
            pickup: {
                parent: null,
                disabledClass: 'sortable-disabled',
                addClass: 'sortable-dragging',
                removeClass: ''
            },
            drop: {
                parent: null,
                addClass: '',
                removeClass: ''
            },
            callbacks: {
                pickup: null,
                drag: null,
                drop: null,
                beforeDrop: null
            },
            dataAttributes: ['id', 'sort'],
            dropIndicatorClass: 'sortable-drop-indicator',
            dropIndicator: true,
            dragImageClass: 'sortable-drag-image',
            placeholderClass: 'sortable-placeholder',
            debug: false,
            allowDuplicateCallbacks: false
        };

        constructor(elementOrSelector, options) {
            this.elements = [];
            this.elementOrSelector = elementOrSelector;
            this.lastMouseY = 0;
            this.instanceId = this.generateInstanceId();
            this.tagNameCopy = null;
            this.lastDraggedOver = null;
            this.lastMouseDirection = null;

            if (typeof elementOrSelector === 'string') {
                this.elements = Array.from(document.querySelectorAll(elementOrSelector));
            } else if (elementOrSelector instanceof Element) {
                this.elements = [elementOrSelector];
            } else if (elementOrSelector instanceof NodeList || Array.isArray(elementOrSelector)) {
                this.elements = Array.from(elementOrSelector);
            } else {
                console.error("DomMover: Invalid element or selector provided.");
                return;
            }

            this.options = Object.assign({}, DomMover.defaults, options);
            this.draggedItem = null;
            this.draggedItemData = null;
            this.placeholder = null;

            this.log = function (...args) {
                if (this.options.debug) {
                    console.log(`[DomMover ${this.instanceId}]`, ...args);
                }
            };

            this.init();
        }

        generateInstanceId() {
            return 'dm' + Math.random().toString(36).substring(2, 9); // Short, random ID
        }

        init() {
            this.bindEvents();
            this.elements.forEach(element => {
                element.setAttribute('draggable', 'true');
                element.classList.add(this.instanceId);
            });
        }

        bindEvents() {
            const parentElement = this.getParentElement('pickup');
            if (!parentElement) {
                this.log('No valid parent for delegation');
                return;
            }
            parentElement.addEventListener('dragstart', this.handleDragStart.bind(this));
            parentElement.addEventListener('dragend', this.handleDragEnd.bind(this));
            parentElement.addEventListener('dragover', this.handleDragOver.bind(this));
            parentElement.addEventListener('dragenter', this.handleDragEnter.bind(this));
            parentElement.addEventListener('drop', this.handleDrop.bind(this));
        }

        handleDragStart(e) {
            if (!this.isDraggable(e.target)) {
                return;
            }
            this.draggedItem = e.target;
            this.tagNameCopy = this.draggedItem.tagName.toUpperCase();

            if (!this.isValidSortableElement(this.tagNameCopy)) {
                console.error(`DomMover: "${this.tagNameCopy}" elements cannot be sorted.`, this.draggedItem);
                e.preventDefault();
                return;
            }

            this.draggedItemData = this.getItemData(this.draggedItem);
            this.addClasses(this.draggedItem, this.options.pickup.addClass);
            this.removeClasses(this.draggedItem, this.options.pickup.removeClass);

            const prevElem = this.draggedItem.previousElementSibling;
            const nextElem = this.draggedItem.nextElementSibling;
            if (typeof this.options.callbacks.pickup === 'function') {
                this.options.callbacks.pickup(this.draggedItem, this.draggedItemData, prevElem, nextElem);
            }

            this.createPlaceholder();
            this.setCustomDragImage(e);
        }

        isValidSortableElement(tagName) {
            const invalidTags = ['TBODY', 'THEAD', 'TFOOT', 'CAPTION', 'COLGROUP', 'COL', 'HTML', 'HEAD', 'BODY'];
            return !invalidTags.includes(tagName);
        }

        createPlaceholder() {
            this.placeholder = document.createElement(this.tagNameCopy);

            if (this.tagNameCopy === 'TR') {
                const td = document.createElement('td');
                const colCount = this.draggedItem.children.length || 1;
                td.setAttribute('colspan', colCount.toString());
                td.innerHTML = ' ';
                this.placeholder.appendChild(td);
            }

            this.placeholder.classList.add(this.options.placeholderClass);
            this.placeholder.classList.add(this.instanceId);
            if (this.options.dropIndicator) {
                this.placeholder.classList.add(this.options.dropIndicatorClass);
            }
        }

        setCustomDragImage(e) {
            const dragImage = this.draggedItem.cloneNode(true);
            dragImage.classList.add(this.options.dragImageClass);
            dragImage.classList.add(this.instanceId);
            dragImage.style.width = `${this.draggedItem.offsetWidth}px`;
            dragImage.style.height = `${this.draggedItem.offsetHeight}px`;
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            requestAnimationFrame(() => document.body.removeChild(dragImage));
        }

        handleDragEnd(e) {
            this.removeClasses(this.draggedItem, this.options.pickup.addClass);
            if (this.placeholder && this.placeholder.parentNode) {
                this.placeholder.parentNode.removeChild(this.placeholder);
            }
            this.draggedItem = null;
            this.draggedItemData = null;
            this.placeholder = null;
            this.tagNameCopy = null;
            this.lastDraggedOver = null;
            this.lastMouseDirection = null;
        }

        handleDragOver(e) {
            e.preventDefault();
            const closestManagedElement = e.target.closest(`${this.elementOrSelector}.${this.instanceId}`);
            if (!closestManagedElement || closestManagedElement === this.draggedItem || closestManagedElement === this.placeholder) {
                return;
            }

            let mouseDirection = 'down';
            if (e.clientY < this.lastMouseY) {
                mouseDirection = 'up';
            }

            if (e.clientY > this.lastMouseY) {
                if (closestManagedElement.nextElementSibling !== this.placeholder) {
                    closestManagedElement.parentNode.insertBefore(this.placeholder, closestManagedElement.nextSibling);
                }
            } else if (e.clientY < this.lastMouseY) {
                if (closestManagedElement.previousElementSibling !== this.placeholder) {
                    closestManagedElement.parentNode.insertBefore(this.placeholder, closestManagedElement);
                }
            }

            this.lastMouseY = e.clientY;

            let placeholderPosition = 'bottom';
            if (this.placeholder.previousElementSibling === closestManagedElement) {
                placeholderPosition = 'top';
            }

            if (this.options.allowDuplicateCallbacks ||
                closestManagedElement !== this.lastDraggedOver || mouseDirection !== this.lastMouseDirection) {

                if (typeof this.options.callbacks.drag === 'function') {
                    this.options.callbacks.drag(e, this.draggedItem, closestManagedElement, placeholderPosition);
                }
            }

            this.lastDraggedOver = closestManagedElement;
            this.lastMouseDirection = mouseDirection;
        }

        handleDragEnter(e) {
            e.preventDefault();
            if (!this.isDraggable(e.target)) {
                return;
            }
            const closestManagedElement = e.target.closest(`${this.elementOrSelector}.${this.instanceId}`);
            if (closestManagedElement && closestManagedElement !== this.draggedItem) {
                // Placeholder insertion is handled in dragover
            }
        }

        handleDrop(e) {
            e.preventDefault();
            if (!this.draggedItem) return;

            const prevElem = this.placeholder.previousElementSibling;
            const nextElem = this.placeholder.nextElementSibling;

            let beforeElementData = null;
            if (prevElem) {
                beforeElementData = this.getItemData(prevElem);
            }

            if (typeof this.options.callbacks.beforeDrop === 'function') {
                if (this.options.callbacks.beforeDrop(this.draggedItem, prevElem, this.draggedItemData, beforeElementData, nextElem) === false) {
                    return;
                }
            }

            this.placeholder.parentNode.insertBefore(this.draggedItem, this.placeholder);

            if (typeof this.options.callbacks.drop === 'function') {
                this.options.callbacks.drop(this.draggedItem, prevElem, this.draggedItemData, beforeElementData, nextElem);
            }
        }

        isDraggable(element) {
            let current = element;
            while (current) {
                if (current.classList && current.classList.contains(this.options.pickup.disabledClass)) {
                    return false;
                }
                if (this.options.pickup.parent && current.matches(this.options.pickup.parent)) {
                    break;
                }
                if (current === document.body) {
                    break;
                }
                current = current.parentNode;
            }
            return this.isWithinParent(element, 'pickup');
        }

        isWithinParent(element, type) {
            const parentSelector = type === 'pickup' ? this.options.pickup.parent : this.options.drop.parent;
            if (!parentSelector) return true;
            const parentElement = document.querySelector(parentSelector);
            if (!parentElement) return true;
            return parentElement.contains(element) && element.classList.contains(this.instanceId);
        }

        getParentElement(type) {
            const parentSelector = type === 'pickup' ? this.options.pickup.parent : this.options.drop.parent;
            if (parentSelector) {
                return document.querySelector(parentSelector);
            }
            if (this.elements.length > 0) {
                let commonParent = this.elements[0].parentNode;
                while (commonParent) {
                    let allChildren = true;
                    for (let i = 0; i < this.elements.length; i++) {
                        if (!commonParent.contains(this.elements[i]) || !this.elements[i].classList.contains(this.instanceId)) {
                            allChildren = false;
                            break;
                        }
                    }
                    if (allChildren) {
                        return commonParent;
                    }
                    commonParent = commonParent.parentNode;
                }
            }
            return null;
        }

        getItemData(item) {
            const data = {};
            this.options.dataAttributes.forEach(attr => {
                data[attr] = item.dataset[attr];
            });
            return data;
        }

        addClasses(element, classes) {
            if (classes) {
                classes.split(' ').forEach(cls => element.classList.add(cls));
            }
        }

        removeClasses(element, classes) {
            if (classes) {
                classes.split(' ').forEach(cls => element.classList.remove(cls));
            }
        }
    }

    if (typeof jQuery !== 'undefined') {
        jQuery.fn.domMover = function (options) {
            this.each(function () {
                if (!$.data(this, 'plugin_domMover')) {
                    $.data(this, 'plugin_domMover', new DomMover(this, options));
                }
            });
            return this;
        };
    }

    window.DomMover = DomMover;
})();
