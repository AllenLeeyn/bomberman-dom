/**
 * Recursively renders a virtual DOM node (string, array, or object) into a real DOM node.
 * - Strings become TextNodes.
 * - Arrays become DocumentFragments (for fragments/multiple siblings).
 * - Objects become DOM elements.
 * - Invalid nodes are handled gracefully with warnings.
 */

export function h(tag, attrs = {}, children = [], key = null) {
    return {
        tag,
        attrs,
        children: Array.isArray(children) ? children : [children],
        key,
    };
}

function setAttributes(el, attrs = {}) {
    const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";
    for (const [key, value] of Object.entries(attrs)) {
        if (typeof value === 'object' && value !== null) {
            value.current = el;

        } else if (key.startsWith("on") && typeof value === "function") {
            el.__listeners = el.__listeners || {};
            const eventName = key.slice(2).toLowerCase();

            const oldListener = el.__listeners[eventName];
            if (oldListener) {
                el.removeEventListener(eventName, oldListener);
            }
            el.addEventListener(eventName, value);
            el.__listeners[eventName] = value;

        } else if (value === undefined || value === null) {
            el.removeAttribute(key);

        } else if (!isSvg && key in el) {
            el[key] = value;

        } else {
            // Always use setAttribute for SVG
            el.setAttribute(key, value);
        }
    }
}

function prepareTargetElement(tag, isSvg = false) {
    if (tag === "body") {
        const el = document.body;
        while (el.firstChild) el.removeChild(el.firstChild);
        return el;
    }
    if (isSvg) {
        return document.createElementNS("http://www.w3.org/2000/svg", tag);
    }
    return document.createElement(tag);
}

function renderChildren(parent, children = [], isSvg = false) {
    children
        .filter(child => child !== null && child !== undefined && child !== false)
        .forEach(child => {
            parent.appendChild(renderElement(child, isSvg));
        });
}

export function renderElement(node, isSvg = false) {
    console.log('renderElement called with node:', node);
    try {
        if (typeof node === "string") {
            return document.createTextNode(node);
        }

        if (Array.isArray(node)) {
            console.warn("Arrays are not allowed as root nodes in renderElement:", node);
            return document.createTextNode("");
        }

        if (!node || !node.tag) {
            console.warn("Invalid node passed to renderElement:", node);
            return document.createTextNode("");
        }

        // If this node is <svg>, set isSvg = true for it and its children
        const thisIsSvg = isSvg || node.tag === "svg";
        const el = prepareTargetElement(node.tag, thisIsSvg);
        setAttributes(el, node.attrs);
        renderChildren(el, node.children, thisIsSvg);
        return el;

    } catch (error) {
        console.error("Error rendering element:", error, node);
        return document.createTextNode("Render Error");
    }
}


// Diff two virtual DOM nodes and return a patch object describing the change
// the patch object will be used by `patch` to update the real DOM
export function diff(oldVNode, newVNode) {
    // 1. If the old node doesn't exist, create the new node
    if (!oldVNode) return { type: "CREATE", newVNode };

    // 2. If the new node doesn't exist, remove the old node
    if (!newVNode) return { type: "REMOVE" };

    // 3. If both are text nodes and different, update the text
    if (typeof oldVNode === "string" && typeof newVNode === "string") {
        if (oldVNode !== newVNode) {
            return { type: "TEXT", text: newVNode };
        }
        return null; // No change
    }

    // 4. If tags/types are different, replace the node
    if (oldVNode.tag !== newVNode.tag) {
        return { type: "REPLACE", newVNode };
    }
    
    // 5. If tags are the same, diff attributes and children (expand later)
    return {
        type: "UPDATE",
        props: diffProps(oldVNode.attrs, newVNode.attrs),
        children: diffChildren(oldVNode.children, newVNode.children),
    };
}

// Helper: Diff attributes/props between two virtual DOM nodes.
// returns an array of changes to be applied.
function diffProps(oldProps = {}, newProps = {}) {
    const patches = [];
    // Removed or changed attributes
    for (const key in oldProps) {
        if (!(key in newProps)) {
        patches.push({ key, value: undefined });
        }
    }
    // Added or changed attributes
    for (const key in newProps) {
        if (oldProps[key] !== newProps[key]) {
        patches.push({ key, value: newProps[key] });
        }
    }
    return patches;
}

// Helper: Diff children 
// Handles both keyed and non-keyed children.
// uses position-based diffing by default, with key support for more reliable updates.
function diffChildren(oldChildren = [], newChildren = []) {
    // Simple position-based diffing (more reliable for filtered lists)
    const patches = [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];

        // For keyed elements, check if they're the same item
        if (
            oldChild && newChild &&
            typeof oldChild === "object" &&
            typeof newChild === "object" &&
            oldChild.key && newChild.key
        ) {
            // Same key = update in place
            if (oldChild.key === newChild.key) {
                patches[i] = diff(oldChild, newChild);
            }
            // Different key = replace (this handles filter changes properly)
            else {
                patches[i] = { type: "REPLACE", newVNode: newChild };
            }
        } else {
            // Standard diff for non-keyed or position changes
            patches[i] = diff(oldChild, newChild);
        }
    }
    return patches;
}

// ----------------------------- //

// Patch: Apply a patch object (from `diff`) to the real DOM
// handles all patch types (CREATE, REMOVE, TEXT, REPLACE, UPDATE) and is recursive for children.
// see below `patch` to see helper function
export function patch(parent, domNode, patchObj, index = 0) {
    if (!patchObj) {
        console.log(`[patch] No patch object provided at index ${index}, returning current DOM node.`);
        return domNode;
    }

    try {
        console.log(`[patch] Applying patch of type "${patchObj.type}" at index ${index} on DOM node:`, domNode);

        switch (patchObj.type) {
            case "CREATE":
                console.log(`[patch] Creating new node.`);
                return patchCreate(parent, patchObj);

            case "REMOVE":
                console.log(`[patch] Removing node.`);
                return patchRemove(parent, domNode);

            case "TEXT":
                console.log(`[patch] Updating text content to: "${patchObj.text}"`);
                return patchText(domNode, patchObj);

            case "REPLACE":
                console.log(`[patch] Replacing node with new node.`);
                return patchReplace(parent, domNode, patchObj);

            case "UPDATE":
                console.log(`[patch] Updating node attributes and children.`);
                return patchUpdate(domNode, patchObj);

            default:
                console.warn(`[patch] Unknown patch type: "${patchObj.type}"`);
                return domNode;
        }
    } catch (error) {
        console.error(`[patch] Error applying patch:`, error, patchObj);
        return domNode;
    }
}


function patchCreate(parent, patchObj) {
    const newDom = renderElement(patchObj.newVNode);
    parent.appendChild(newDom);
    return newDom;
}

function patchRemove(parent, domNode) {
    removeListeners(domNode);
    if (domNode && domNode.parentNode === parent) {
        parent.removeChild(domNode);
    }
    return null;
}

function patchText(domNode, patchObj) {
    if (domNode && domNode.nodeType === Node.TEXT_NODE) {
        domNode.textContent = patchObj.text;
    }
    return domNode;
}

function patchReplace(parent, domNode, patchObj) {
    removeListeners(domNode);
    const newDom = renderElement(patchObj.newVNode);
    if (domNode && domNode.parentNode === parent) {
        parent.replaceChild(newDom, domNode);
    }
    return newDom;
}

function patchUpdate(domNode, patchObj) {
    if (!domNode) return domNode;
    // Update attributes
    patchObj.props.forEach(({ key, value }) => {
        setAttributes(domNode, { [key]: value });
    });

    // Patch children
    patchChildren(domNode, patchObj.children);
    return domNode;
}

function patchChildren(domNode, childrenPatches) {
    const childNodes = Array.from(domNode.childNodes);
    let domChildIndex = 0;

    for (let i = 0; i < childrenPatches.length; i++) {
        const childPatch = childrenPatches[i];
        const currentNode = childNodes[domChildIndex];

        if (!childPatch || !childPatch.type) continue; 
        if (!currentNode) {
            // No existing DOM node at this position: CREATE
            if (childPatch.type === "CREATE") {
                const newChildDom = renderElement(childPatch.newVNode);
                domNode.appendChild(newChildDom);
            }

        } else if (childPatch.type === "CREATE") {
            // Insert before existing node
            const newChildDom = renderElement(childPatch.newVNode);
            domNode.insertBefore(newChildDom, currentNode);
            domChildIndex++;

        } else if (childPatch.type === "REMOVE") {
            removeListeners(currentNode);
            if (currentNode.parentNode === domNode) {
                domNode.removeChild(currentNode);
            }
            // Do not increment domChildIndex since node was removed
            
        } else {
            patch(domNode, currentNode, childPatch, i);
            domChildIndex++;
        }
    }

    // Remove any extra old nodes
    while (domNode.childNodes.length > childrenPatches.length) {
        const last = domNode.lastChild;
        if (last && last.parentNode === domNode) {
            domNode.removeChild(last);
        } else {
            break;
        }
    }
}

function removeListeners(el) {
    if (!el) return;

    if (el.__listeners) {
        for (const [eventName, handler] of Object.entries(el.__listeners)) {
            el.removeEventListener(eventName, handler);
        }
        delete el.__listeners;
    }

    for (const child of el.childNodes) {
        removeListeners(child);
    }
}

export function mount(parent, vNode) {
    const el = renderElement(vNode);
    parent.appendChild(el);
    vNode._el = el; // Save reference to actual DOM
    return el;
}

export function update(parent, oldVNode, newVNode) {
    console.log('[update] called');
    console.log('oldVNode:', oldVNode);
    console.log('newVNode:', newVNode);

    if (!oldVNode) {
        console.log('[update] No oldVNode — performing initial mount');
        const el = mount(parent, newVNode);
        newVNode._el = el;
        return newVNode;
    }

    const oldEl = oldVNode._el; 
    console.log('[update] Found old DOM element:', oldEl);

    const patchObj = diff(oldVNode, newVNode);
    console.log('[update] Patch diff result:', patchObj);

    const updatedEl = patch(parent, oldEl, patchObj);
    console.log('[update] Updated element:', updatedEl);

    newVNode._el = updatedEl;
    return newVNode;
}

