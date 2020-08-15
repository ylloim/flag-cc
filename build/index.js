/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
const isDirective = o => {
  return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = window.customElements !== undefined && window.customElements.polyfillWrapFlushCallback !== undefined;
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */

const removeNodes = (container, start, end = null) => {
  while (start !== end) {
    const n = start.nextSibling;
    container.removeChild(start);
    start = n;
  }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */

const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */

const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */

const boundAttributeSuffix = '$lit$';
/**
 * An updateable Template that tracks the location of dynamic parts.
 */

class Template {
  constructor(result, element) {
    this.parts = [];
    this.element = element;
    const nodesToRemove = [];
    const stack = []; // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null

    const walker = document.createTreeWalker(element.content, 133
    /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
    , null, false); // Keeps track of the last index associated with a part. We try to delete
    // unnecessary nodes, but we never want to associate two different parts
    // to the same index. They must have a constant node between.

    let lastPartIndex = 0;
    let index = -1;
    let partIndex = 0;
    const {
      strings,
      values: {
        length
      }
    } = result;

    while (partIndex < length) {
      const node = walker.nextNode();

      if (node === null) {
        // We've exhausted the content inside a nested template element.
        // Because we still have parts (the outer for-loop), we know:
        // - There is a template in the stack
        // - The walker will find a nextNode outside the template
        walker.currentNode = stack.pop();
        continue;
      }

      index++;

      if (node.nodeType === 1
      /* Node.ELEMENT_NODE */
      ) {
          if (node.hasAttributes()) {
            const attributes = node.attributes;
            const {
              length
            } = attributes; // Per
            // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
            // attributes are not guaranteed to be returned in document order.
            // In particular, Edge/IE can return them out of order, so we cannot
            // assume a correspondence between part index and attribute index.

            let count = 0;

            for (let i = 0; i < length; i++) {
              if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                count++;
              }
            }

            while (count-- > 0) {
              // Get the template literal section leading up to the first
              // expression in this attribute
              const stringForPart = strings[partIndex]; // Find the attribute name

              const name = lastAttributeNameRegex.exec(stringForPart)[2]; // Find the corresponding attribute
              // All bound attributes have had a suffix added in
              // TemplateResult#getHTML to opt out of special attribute
              // handling. To look up the attribute value we also need to add
              // the suffix.

              const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
              const attributeValue = node.getAttribute(attributeLookupName);
              node.removeAttribute(attributeLookupName);
              const statics = attributeValue.split(markerRegex);
              this.parts.push({
                type: 'attribute',
                index,
                name,
                strings: statics
              });
              partIndex += statics.length - 1;
            }
          }

          if (node.tagName === 'TEMPLATE') {
            stack.push(node);
            walker.currentNode = node.content;
          }
        } else if (node.nodeType === 3
      /* Node.TEXT_NODE */
      ) {
          const data = node.data;

          if (data.indexOf(marker) >= 0) {
            const parent = node.parentNode;
            const strings = data.split(markerRegex);
            const lastIndex = strings.length - 1; // Generate a new text node for each literal section
            // These nodes are also used as the markers for node parts

            for (let i = 0; i < lastIndex; i++) {
              let insert;
              let s = strings[i];

              if (s === '') {
                insert = createMarker();
              } else {
                const match = lastAttributeNameRegex.exec(s);

                if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                  s = s.slice(0, match.index) + match[1] + match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                }

                insert = document.createTextNode(s);
              }

              parent.insertBefore(insert, node);
              this.parts.push({
                type: 'node',
                index: ++index
              });
            } // If there's no text, we must insert a comment to mark our place.
            // Else, we can trust it will stick around after cloning.


            if (strings[lastIndex] === '') {
              parent.insertBefore(createMarker(), node);
              nodesToRemove.push(node);
            } else {
              node.data = strings[lastIndex];
            } // We have a part for each match found


            partIndex += lastIndex;
          }
        } else if (node.nodeType === 8
      /* Node.COMMENT_NODE */
      ) {
          if (node.data === marker) {
            const parent = node.parentNode; // Add a new marker node to be the startNode of the Part if any of
            // the following are true:
            //  * We don't have a previousSibling
            //  * The previousSibling is already the start of a previous part

            if (node.previousSibling === null || index === lastPartIndex) {
              index++;
              parent.insertBefore(createMarker(), node);
            }

            lastPartIndex = index;
            this.parts.push({
              type: 'node',
              index
            }); // If we don't have a nextSibling, keep this node so we have an end.
            // Else, we can remove it to save future costs.

            if (node.nextSibling === null) {
              node.data = '';
            } else {
              nodesToRemove.push(node);
              index--;
            }

            partIndex++;
          } else {
            let i = -1;

            while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
              // Comment node has a binding marker inside, make an inactive part
              // The binding won't work, but subsequent bindings will
              // TODO (justinfagnani): consider whether it's even worth it to
              // make bindings in comments work
              this.parts.push({
                type: 'node',
                index: -1
              });
              partIndex++;
            }
          }
        }
    } // Remove text binding nodes after the walk to not disturb the TreeWalker


    for (const n of nodesToRemove) {
      n.parentNode.removeChild(n);
    }
  }

}

const endsWith = (str, suffix) => {
  const index = str.length - suffix.length;
  return index >= 0 && str.slice(index) === suffix;
};

const isTemplatePartActive = part => part.index !== -1; // Allows `document.createComment('')` to be renamed for a
// small manual size-savings.

const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */

const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */

class TemplateInstance {
  constructor(template, processor, options) {
    this.__parts = [];
    this.template = template;
    this.processor = processor;
    this.options = options;
  }

  update(values) {
    let i = 0;

    for (const part of this.__parts) {
      if (part !== undefined) {
        part.setValue(values[i]);
      }

      i++;
    }

    for (const part of this.__parts) {
      if (part !== undefined) {
        part.commit();
      }
    }
  }

  _clone() {
    // There are a number of steps in the lifecycle of a template instance's
    // DOM fragment:
    //  1. Clone - create the instance fragment
    //  2. Adopt - adopt into the main document
    //  3. Process - find part markers and create parts
    //  4. Upgrade - upgrade custom elements
    //  5. Update - set node, attribute, property, etc., values
    //  6. Connect - connect to the document. Optional and outside of this
    //     method.
    //
    // We have a few constraints on the ordering of these steps:
    //  * We need to upgrade before updating, so that property values will pass
    //    through any property setters.
    //  * We would like to process before upgrading so that we're sure that the
    //    cloned fragment is inert and not disturbed by self-modifying DOM.
    //  * We want custom elements to upgrade even in disconnected fragments.
    //
    // Given these constraints, with full custom elements support we would
    // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
    //
    // But Safari dooes not implement CustomElementRegistry#upgrade, so we
    // can not implement that order and still have upgrade-before-update and
    // upgrade disconnected fragments. So we instead sacrifice the
    // process-before-upgrade constraint, since in Custom Elements v1 elements
    // must not modify their light DOM in the constructor. We still have issues
    // when co-existing with CEv0 elements like Polymer 1, and with polyfills
    // that don't strictly adhere to the no-modification rule because shadow
    // DOM, which may be created in the constructor, is emulated by being placed
    // in the light DOM.
    //
    // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
    // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
    // in one step.
    //
    // The Custom Elements v1 polyfill supports upgrade(), so the order when
    // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
    // Connect.
    const fragment = isCEPolyfill ? this.template.element.content.cloneNode(true) : document.importNode(this.template.element.content, true);
    const stack = [];
    const parts = this.template.parts; // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null

    const walker = document.createTreeWalker(fragment, 133
    /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
    , null, false);
    let partIndex = 0;
    let nodeIndex = 0;
    let part;
    let node = walker.nextNode(); // Loop through all the nodes and parts of a template

    while (partIndex < parts.length) {
      part = parts[partIndex];

      if (!isTemplatePartActive(part)) {
        this.__parts.push(undefined);

        partIndex++;
        continue;
      } // Progress the tree walker until we find our next part's node.
      // Note that multiple parts may share the same node (attribute parts
      // on a single element), so this loop may not run at all.


      while (nodeIndex < part.index) {
        nodeIndex++;

        if (node.nodeName === 'TEMPLATE') {
          stack.push(node);
          walker.currentNode = node.content;
        }

        if ((node = walker.nextNode()) === null) {
          // We've exhausted the content inside a nested template element.
          // Because we still have parts (the outer for-loop), we know:
          // - There is a template in the stack
          // - The walker will find a nextNode outside the template
          walker.currentNode = stack.pop();
          node = walker.nextNode();
        }
      } // We've arrived at our part's node.


      if (part.type === 'node') {
        const part = this.processor.handleTextExpression(this.options);
        part.insertAfterNode(node.previousSibling);

        this.__parts.push(part);
      } else {
        this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
      }

      partIndex++;
    }

    if (isCEPolyfill) {
      document.adoptNode(fragment);
      customElements.upgrade(fragment);
    }

    return fragment;
  }

}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const commentMarker = ` ${marker} `;
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */

class TemplateResult {
  constructor(strings, values, type, processor) {
    this.strings = strings;
    this.values = values;
    this.type = type;
    this.processor = processor;
  }
  /**
   * Returns a string of HTML used to create a `<template>` element.
   */


  getHTML() {
    const l = this.strings.length - 1;
    let html = '';
    let isCommentBinding = false;

    for (let i = 0; i < l; i++) {
      const s = this.strings[i]; // For each binding we want to determine the kind of marker to insert
      // into the template source before it's parsed by the browser's HTML
      // parser. The marker type is based on whether the expression is in an
      // attribute, text, or comment poisition.
      //   * For node-position bindings we insert a comment with the marker
      //     sentinel as its text content, like <!--{{lit-guid}}-->.
      //   * For attribute bindings we insert just the marker sentinel for the
      //     first binding, so that we support unquoted attribute bindings.
      //     Subsequent bindings can use a comment marker because multi-binding
      //     attributes must be quoted.
      //   * For comment bindings we insert just the marker sentinel so we don't
      //     close the comment.
      //
      // The following code scans the template source, but is *not* an HTML
      // parser. We don't need to track the tree structure of the HTML, only
      // whether a binding is inside a comment, and if not, if it appears to be
      // the first binding in an attribute.

      const commentOpen = s.lastIndexOf('<!--'); // We're in comment position if we have a comment open with no following
      // comment close. Because <-- can appear in an attribute value there can
      // be false positives.

      isCommentBinding = (commentOpen > -1 || isCommentBinding) && s.indexOf('-->', commentOpen + 1) === -1; // Check to see if we have an attribute-like sequence preceeding the
      // expression. This can match "name=value" like structures in text,
      // comments, and attribute values, so there can be false-positives.

      const attributeMatch = lastAttributeNameRegex.exec(s);

      if (attributeMatch === null) {
        // We're only in this branch if we don't have a attribute-like
        // preceeding sequence. For comments, this guards against unusual
        // attribute values like <div foo="<!--${'bar'}">. Cases like
        // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
        // below.
        html += s + (isCommentBinding ? commentMarker : nodeMarker);
      } else {
        // For attributes we use just a marker sentinel, and also append a
        // $lit$ suffix to the name to opt-out of attribute-specific parsing
        // that IE and Edge do for style and certain SVG attributes.
        html += s.substr(0, attributeMatch.index) + attributeMatch[1] + attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] + marker;
      }
    }

    html += this.strings[l];
    return html;
  }

  getTemplateElement() {
    const template = document.createElement('template');
    template.innerHTML = this.getHTML();
    return template;
  }

}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = value => {
  return value === null || !(typeof value === 'object' || typeof value === 'function');
};
const isIterable = value => {
  return Array.isArray(value) || // tslint:disable-next-line:no-any
  !!(value && value[Symbol.iterator]);
};
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attibute. The value is only set once even if there are multiple parts
 * for an attribute.
 */

class AttributeCommitter {
  constructor(element, name, strings) {
    this.dirty = true;
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.parts = [];

    for (let i = 0; i < strings.length - 1; i++) {
      this.parts[i] = this._createPart();
    }
  }
  /**
   * Creates a single part. Override this to create a differnt type of part.
   */


  _createPart() {
    return new AttributePart(this);
  }

  _getValue() {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const part = this.parts[i];

      if (part !== undefined) {
        const v = part.value;

        if (isPrimitive(v) || !isIterable(v)) {
          text += typeof v === 'string' ? v : String(v);
        } else {
          for (const t of v) {
            text += typeof t === 'string' ? t : String(t);
          }
        }
      }
    }

    text += strings[l];
    return text;
  }

  commit() {
    if (this.dirty) {
      this.dirty = false;
      this.element.setAttribute(this.name, this._getValue());
    }
  }

}
/**
 * A Part that controls all or part of an attribute value.
 */

class AttributePart {
  constructor(committer) {
    this.value = undefined;
    this.committer = committer;
  }

  setValue(value) {
    if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
      this.value = value; // If the value is a not a directive, dirty the committer so that it'll
      // call setAttribute. If the value is a directive, it'll dirty the
      // committer if it calls setValue().

      if (!isDirective(value)) {
        this.committer.dirty = true;
      }
    }
  }

  commit() {
    while (isDirective(this.value)) {
      const directive = this.value;
      this.value = noChange;
      directive(this);
    }

    if (this.value === noChange) {
      return;
    }

    this.committer.commit();
  }

}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */

class NodePart {
  constructor(options) {
    this.value = undefined;
    this.__pendingValue = undefined;
    this.options = options;
  }
  /**
   * Appends this part into a container.
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  appendInto(container) {
    this.startNode = container.appendChild(createMarker());
    this.endNode = container.appendChild(createMarker());
  }
  /**
   * Inserts this part after the `ref` node (between `ref` and `ref`'s next
   * sibling). Both `ref` and its next sibling must be static, unchanging nodes
   * such as those that appear in a literal section of a template.
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  insertAfterNode(ref) {
    this.startNode = ref;
    this.endNode = ref.nextSibling;
  }
  /**
   * Appends this part into a parent part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  appendIntoPart(part) {
    part.__insert(this.startNode = createMarker());

    part.__insert(this.endNode = createMarker());
  }
  /**
   * Inserts this part after the `ref` part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  insertAfterPart(ref) {
    ref.__insert(this.startNode = createMarker());

    this.endNode = ref.endNode;
    ref.endNode = this.startNode;
  }

  setValue(value) {
    this.__pendingValue = value;
  }

  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange;
      directive(this);
    }

    const value = this.__pendingValue;

    if (value === noChange) {
      return;
    }

    if (isPrimitive(value)) {
      if (value !== this.value) {
        this.__commitText(value);
      }
    } else if (value instanceof TemplateResult) {
      this.__commitTemplateResult(value);
    } else if (value instanceof Node) {
      this.__commitNode(value);
    } else if (isIterable(value)) {
      this.__commitIterable(value);
    } else if (value === nothing) {
      this.value = nothing;
      this.clear();
    } else {
      // Fallback, will render the string representation
      this.__commitText(value);
    }
  }

  __insert(node) {
    this.endNode.parentNode.insertBefore(node, this.endNode);
  }

  __commitNode(value) {
    if (this.value === value) {
      return;
    }

    this.clear();

    this.__insert(value);

    this.value = value;
  }

  __commitText(value) {
    const node = this.startNode.nextSibling;
    value = value == null ? '' : value; // If `value` isn't already a string, we explicitly convert it here in case
    // it can't be implicitly converted - i.e. it's a symbol.

    const valueAsString = typeof value === 'string' ? value : String(value);

    if (node === this.endNode.previousSibling && node.nodeType === 3
    /* Node.TEXT_NODE */
    ) {
        // If we only have a single text node between the markers, we can just
        // set its value, rather than replacing it.
        // TODO(justinfagnani): Can we just check if this.value is primitive?
        node.data = valueAsString;
      } else {
      this.__commitNode(document.createTextNode(valueAsString));
    }

    this.value = value;
  }

  __commitTemplateResult(value) {
    const template = this.options.templateFactory(value);

    if (this.value instanceof TemplateInstance && this.value.template === template) {
      this.value.update(value.values);
    } else {
      // Make sure we propagate the template processor from the TemplateResult
      // so that we use its syntax extension, etc. The template factory comes
      // from the render function options so that it can control template
      // caching and preprocessing.
      const instance = new TemplateInstance(template, value.processor, this.options);

      const fragment = instance._clone();

      instance.update(value.values);

      this.__commitNode(fragment);

      this.value = instance;
    }
  }

  __commitIterable(value) {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
    // If _value is an array, then the previous render was of an
    // iterable and _value will contain the NodeParts from the previous
    // render. If _value is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(this.value)) {
      this.value = [];
      this.clear();
    } // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render


    const itemParts = this.value;
    let partIndex = 0;
    let itemPart;

    for (const item of value) {
      // Try to reuse an existing part
      itemPart = itemParts[partIndex]; // If no existing part, create a new one

      if (itemPart === undefined) {
        itemPart = new NodePart(this.options);
        itemParts.push(itemPart);

        if (partIndex === 0) {
          itemPart.appendIntoPart(this);
        } else {
          itemPart.insertAfterPart(itemParts[partIndex - 1]);
        }
      }

      itemPart.setValue(item);
      itemPart.commit();
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex;
      this.clear(itemPart && itemPart.endNode);
    }
  }

  clear(startNode = this.startNode) {
    removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
  }

}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */

class BooleanAttributePart {
  constructor(element, name, strings) {
    this.value = undefined;
    this.__pendingValue = undefined;

    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error('Boolean attributes can only contain a single expression');
    }

    this.element = element;
    this.name = name;
    this.strings = strings;
  }

  setValue(value) {
    this.__pendingValue = value;
  }

  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange;
      directive(this);
    }

    if (this.__pendingValue === noChange) {
      return;
    }

    const value = !!this.__pendingValue;

    if (this.value !== value) {
      if (value) {
        this.element.setAttribute(this.name, '');
      } else {
        this.element.removeAttribute(this.name);
      }

      this.value = value;
    }

    this.__pendingValue = noChange;
  }

}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */

class PropertyCommitter extends AttributeCommitter {
  constructor(element, name, strings) {
    super(element, name, strings);
    this.single = strings.length === 2 && strings[0] === '' && strings[1] === '';
  }

  _createPart() {
    return new PropertyPart(this);
  }

  _getValue() {
    if (this.single) {
      return this.parts[0].value;
    }

    return super._getValue();
  }

  commit() {
    if (this.dirty) {
      this.dirty = false; // tslint:disable-next-line:no-any

      this.element[this.name] = this._getValue();
    }
  }

}
class PropertyPart extends AttributePart {} // Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the thrid
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.

let eventOptionsSupported = false;

try {
  const options = {
    get capture() {
      eventOptionsSupported = true;
      return false;
    }

  }; // tslint:disable-next-line:no-any

  window.addEventListener('test', options, options); // tslint:disable-next-line:no-any

  window.removeEventListener('test', options, options);
} catch (_e) {}

class EventPart {
  constructor(element, eventName, eventContext) {
    this.value = undefined;
    this.__pendingValue = undefined;
    this.element = element;
    this.eventName = eventName;
    this.eventContext = eventContext;

    this.__boundHandleEvent = e => this.handleEvent(e);
  }

  setValue(value) {
    this.__pendingValue = value;
  }

  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange;
      directive(this);
    }

    if (this.__pendingValue === noChange) {
      return;
    }

    const newListener = this.__pendingValue;
    const oldListener = this.value;
    const shouldRemoveListener = newListener == null || oldListener != null && (newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive);
    const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);

    if (shouldRemoveListener) {
      this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
    }

    if (shouldAddListener) {
      this.__options = getOptions(newListener);
      this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
    }

    this.value = newListener;
    this.__pendingValue = noChange;
  }

  handleEvent(event) {
    if (typeof this.value === 'function') {
      this.value.call(this.eventContext || this.element, event);
    } else {
      this.value.handleEvent(event);
    }
  }

} // We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.

const getOptions = o => o && (eventOptionsSupported ? {
  capture: o.capture,
  passive: o.passive,
  once: o.once
} : o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */

class DefaultTemplateProcessor {
  /**
   * Create parts for an attribute-position binding, given the event, attribute
   * name, and string literals.
   *
   * @param element The element containing the binding
   * @param name  The attribute name
   * @param strings The string literals. There are always at least two strings,
   *   event for fully-controlled bindings with a single expression.
   */
  handleAttributeExpressions(element, name, strings, options) {
    const prefix = name[0];

    if (prefix === '.') {
      const committer = new PropertyCommitter(element, name.slice(1), strings);
      return committer.parts;
    }

    if (prefix === '@') {
      return [new EventPart(element, name.slice(1), options.eventContext)];
    }

    if (prefix === '?') {
      return [new BooleanAttributePart(element, name.slice(1), strings)];
    }

    const committer = new AttributeCommitter(element, name, strings);
    return committer.parts;
  }
  /**
   * Create parts for a text-position binding.
   * @param templateFactory
   */


  handleTextExpression(options) {
    return new NodePart(options);
  }

}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */

function templateFactory(result) {
  let templateCache = templateCaches.get(result.type);

  if (templateCache === undefined) {
    templateCache = {
      stringsArray: new WeakMap(),
      keyString: new Map()
    };
    templateCaches.set(result.type, templateCache);
  }

  let template = templateCache.stringsArray.get(result.strings);

  if (template !== undefined) {
    return template;
  } // If the TemplateStringsArray is new, generate a key from the strings
  // This key is shared between all templates with identical content


  const key = result.strings.join(marker); // Check if we already have a Template for this key

  template = templateCache.keyString.get(key);

  if (template === undefined) {
    // If we have not seen this key before, create a new Template
    template = new Template(result, result.getTemplateElement()); // Cache the Template for this key

    templateCache.keyString.set(key, template);
  } // Cache all future queries for this TemplateStringsArray


  templateCache.stringsArray.set(result.strings, template);
  return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */

const render = (result, container, options) => {
  let part = parts.get(container);

  if (part === undefined) {
    removeNodes(container, container.firstChild);
    parts.set(container, part = new NodePart(Object.assign({
      templateFactory
    }, options)));
    part.appendInto(container);
  }

  part.setValue(result);
  part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time

(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.1.2');
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */

const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const walkerNodeFilter = 133
/* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
;
/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 *
 * As the template is walked the removal state is tracked and
 * part indices are adjusted as needed.
 *
 * div
 *   div#1 (remove) <-- start removing (removing node is div#1)
 *     div
 *       div#2 (remove)  <-- continue removing (removing node is still div#1)
 *         div
 * div <-- stop removing since previous sibling is the removing node (div#1,
 * removed 4 nodes)
 */

function removeNodesFromTemplate(template, nodesToRemove) {
  const {
    element: {
      content
    },
    parts
  } = template;
  const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
  let partIndex = nextActiveIndexInTemplateParts(parts);
  let part = parts[partIndex];
  let nodeIndex = -1;
  let removeCount = 0;
  const nodesToRemoveInTemplate = [];
  let currentRemovingNode = null;

  while (walker.nextNode()) {
    nodeIndex++;
    const node = walker.currentNode; // End removal if stepped past the removing node

    if (node.previousSibling === currentRemovingNode) {
      currentRemovingNode = null;
    } // A node to remove was found in the template


    if (nodesToRemove.has(node)) {
      nodesToRemoveInTemplate.push(node); // Track node we're removing

      if (currentRemovingNode === null) {
        currentRemovingNode = node;
      }
    } // When removing, increment count by which to adjust subsequent part indices


    if (currentRemovingNode !== null) {
      removeCount++;
    }

    while (part !== undefined && part.index === nodeIndex) {
      // If part is in a removed node deactivate it by setting index to -1 or
      // adjust the index as needed.
      part.index = currentRemovingNode !== null ? -1 : part.index - removeCount; // go to the next active part.

      partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
      part = parts[partIndex];
    }
  }

  nodesToRemoveInTemplate.forEach(n => n.parentNode.removeChild(n));
}

const countNodes = node => {
  let count = node.nodeType === 11
  /* Node.DOCUMENT_FRAGMENT_NODE */
  ? 0 : 1;
  const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);

  while (walker.nextNode()) {
    count++;
  }

  return count;
};

const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
  for (let i = startIndex + 1; i < parts.length; i++) {
    const part = parts[i];

    if (isTemplatePartActive(part)) {
      return i;
    }
  }

  return -1;
};
/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */


function insertNodeIntoTemplate(template, node, refNode = null) {
  const {
    element: {
      content
    },
    parts
  } = template; // If there's no refNode, then put node at end of template.
  // No part indices need to be shifted in this case.

  if (refNode === null || refNode === undefined) {
    content.appendChild(node);
    return;
  }

  const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
  let partIndex = nextActiveIndexInTemplateParts(parts);
  let insertCount = 0;
  let walkerIndex = -1;

  while (walker.nextNode()) {
    walkerIndex++;
    const walkerNode = walker.currentNode;

    if (walkerNode === refNode) {
      insertCount = countNodes(node);
      refNode.parentNode.insertBefore(node, refNode);
    }

    while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
      // If we've inserted the node, simply adjust all subsequent parts
      if (insertCount > 0) {
        while (partIndex !== -1) {
          parts[partIndex].index += insertCount;
          partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
        }

        return;
      }

      partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
    }
  }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;

let compatibleShadyCSSVersion = true;

if (typeof window.ShadyCSS === 'undefined') {
  compatibleShadyCSSVersion = false;
} else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
  console.warn(`Incompatible ShadyCSS version detected. ` + `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` + `@webcomponents/shadycss@1.3.1.`);
  compatibleShadyCSSVersion = false;
}
/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */


const shadyTemplateFactory = scopeName => result => {
  const cacheKey = getTemplateCacheKey(result.type, scopeName);
  let templateCache = templateCaches.get(cacheKey);

  if (templateCache === undefined) {
    templateCache = {
      stringsArray: new WeakMap(),
      keyString: new Map()
    };
    templateCaches.set(cacheKey, templateCache);
  }

  let template = templateCache.stringsArray.get(result.strings);

  if (template !== undefined) {
    return template;
  }

  const key = result.strings.join(marker);
  template = templateCache.keyString.get(key);

  if (template === undefined) {
    const element = result.getTemplateElement();

    if (compatibleShadyCSSVersion) {
      window.ShadyCSS.prepareTemplateDom(element, scopeName);
    }

    template = new Template(result, element);
    templateCache.keyString.set(key, template);
  }

  templateCache.stringsArray.set(result.strings, template);
  return template;
};

const TEMPLATE_TYPES = ['html', 'svg'];
/**
 * Removes all style elements from Templates for the given scopeName.
 */

const removeStylesFromLitTemplates = scopeName => {
  TEMPLATE_TYPES.forEach(type => {
    const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));

    if (templates !== undefined) {
      templates.keyString.forEach(template => {
        const {
          element: {
            content
          }
        } = template; // IE 11 doesn't support the iterable param Set constructor

        const styles = new Set();
        Array.from(content.querySelectorAll('style')).forEach(s => {
          styles.add(s);
        });
        removeNodesFromTemplate(template, styles);
      });
    }
  });
};

const shadyRenderSet = new Set();
/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered
 * output.
 */

const prepareTemplateStyles = (scopeName, renderedDOM, template) => {
  shadyRenderSet.add(scopeName); // If `renderedDOM` is stamped from a Template, then we need to edit that
  // Template's underlying template element. Otherwise, we create one here
  // to give to ShadyCSS, which still requires one while scoping.

  const templateElement = !!template ? template.element : document.createElement('template'); // Move styles out of rendered DOM and store.

  const styles = renderedDOM.querySelectorAll('style');
  const {
    length
  } = styles; // If there are no styles, skip unnecessary work

  if (length === 0) {
    // Ensure prepareTemplateStyles is called to support adding
    // styles via `prepareAdoptedCssText` since that requires that
    // `prepareTemplateStyles` is called.
    //
    // ShadyCSS will only update styles containing @apply in the template
    // given to `prepareTemplateStyles`. If no lit Template was given,
    // ShadyCSS will not be able to update uses of @apply in any relevant
    // template. However, this is not a problem because we only create the
    // template for the purpose of supporting `prepareAdoptedCssText`,
    // which doesn't support @apply at all.
    window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
    return;
  }

  const condensedStyle = document.createElement('style'); // Collect styles into a single style. This helps us make sure ShadyCSS
  // manipulations will not prevent us from being able to fix up template
  // part indices.
  // NOTE: collecting styles is inefficient for browsers but ShadyCSS
  // currently does this anyway. When it does not, this should be changed.

  for (let i = 0; i < length; i++) {
    const style = styles[i];
    style.parentNode.removeChild(style);
    condensedStyle.textContent += style.textContent;
  } // Remove styles from nested templates in this scope.


  removeStylesFromLitTemplates(scopeName); // And then put the condensed style into the "root" template passed in as
  // `template`.

  const content = templateElement.content;

  if (!!template) {
    insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
  } else {
    content.insertBefore(condensedStyle, content.firstChild);
  } // Note, it's important that ShadyCSS gets the template that `lit-html`
  // will actually render so that it can update the style inside when
  // needed (e.g. @apply native Shadow DOM case).


  window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
  const style = content.querySelector('style');

  if (window.ShadyCSS.nativeShadow && style !== null) {
    // When in native Shadow DOM, ensure the style created by ShadyCSS is
    // included in initially rendered output (`renderedDOM`).
    renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
  } else if (!!template) {
    // When no style is left in the template, parts will be broken as a
    // result. To fix this, we put back the style node ShadyCSS removed
    // and then tell lit to remove that node from the template.
    // There can be no style in the template in 2 cases (1) when Shady DOM
    // is in use, ShadyCSS removes all styles, (2) when native Shadow DOM
    // is in use ShadyCSS removes the style if it contains no content.
    // NOTE, ShadyCSS creates its own style so we can safely add/remove
    // `condensedStyle` here.
    content.insertBefore(condensedStyle, content.firstChild);
    const removes = new Set();
    removes.add(condensedStyle);
    removeNodesFromTemplate(template, removes);
  }
};
/**
 * Extension to the standard `render` method which supports rendering
 * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
 * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
 * or when the webcomponentsjs
 * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
 *
 * Adds a `scopeName` option which is used to scope element DOM and stylesheets
 * when native ShadowDOM is unavailable. The `scopeName` will be added to
 * the class attribute of all rendered DOM. In addition, any style elements will
 * be automatically re-written with this `scopeName` selector and moved out
 * of the rendered DOM and into the document `<head>`.
 *
 * It is common to use this render method in conjunction with a custom element
 * which renders a shadowRoot. When this is done, typically the element's
 * `localName` should be used as the `scopeName`.
 *
 * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
 * custom properties (needed only on older browsers like IE11) and a shim for
 * a deprecated feature called `@apply` that supports applying a set of css
 * custom properties to a given location.
 *
 * Usage considerations:
 *
 * * Part values in `<style>` elements are only applied the first time a given
 * `scopeName` renders. Subsequent changes to parts in style elements will have
 * no effect. Because of this, parts in style elements should only be used for
 * values that will never change, for example parts that set scope-wide theme
 * values or parts which render shared style elements.
 *
 * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
 * custom element's `constructor` is not supported. Instead rendering should
 * either done asynchronously, for example at microtask timing (for example
 * `Promise.resolve()`), or be deferred until the first time the element's
 * `connectedCallback` runs.
 *
 * Usage considerations when using shimmed custom properties or `@apply`:
 *
 * * Whenever any dynamic changes are made which affect
 * css custom properties, `ShadyCSS.styleElement(element)` must be called
 * to update the element. There are two cases when this is needed:
 * (1) the element is connected to a new parent, (2) a class is added to the
 * element that causes it to match different custom properties.
 * To address the first case when rendering a custom element, `styleElement`
 * should be called in the element's `connectedCallback`.
 *
 * * Shimmed custom properties may only be defined either for an entire
 * shadowRoot (for example, in a `:host` rule) or via a rule that directly
 * matches an element with a shadowRoot. In other words, instead of flowing from
 * parent to child as do native css custom properties, shimmed custom properties
 * flow only from shadowRoots to nested shadowRoots.
 *
 * * When using `@apply` mixing css shorthand property names with
 * non-shorthand names (for example `border` and `border-width`) is not
 * supported.
 */


const render$1 = (result, container, options) => {
  if (!options || typeof options !== 'object' || !options.scopeName) {
    throw new Error('The `scopeName` option is required.');
  }

  const scopeName = options.scopeName;
  const hasRendered = parts.has(container);
  const needsScoping = compatibleShadyCSSVersion && container.nodeType === 11
  /* Node.DOCUMENT_FRAGMENT_NODE */
  && !!container.host; // Handle first render to a scope specially...

  const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName); // On first scope render, render into a fragment; this cannot be a single
  // fragment that is reused since nested renders can occur synchronously.

  const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
  render(result, renderContainer, Object.assign({
    templateFactory: shadyTemplateFactory(scopeName)
  }, options)); // When performing first scope render,
  // (1) We've rendered into a fragment so that there's a chance to
  // `prepareTemplateStyles` before sub-elements hit the DOM
  // (which might cause them to render based on a common pattern of
  // rendering in a custom element's `connectedCallback`);
  // (2) Scope the template with ShadyCSS one time only for this scope.
  // (3) Render the fragment into the container and make sure the
  // container knows its `part` is the one we just rendered. This ensures
  // DOM will be re-used on subsequent renders.

  if (firstScopeRender) {
    const part = parts.get(renderContainer);
    parts.delete(renderContainer); // ShadyCSS might have style sheets (e.g. from `prepareAdoptedCssText`)
    // that should apply to `renderContainer` even if the rendered value is
    // not a TemplateInstance. However, it will only insert scoped styles
    // into the document if `prepareTemplateStyles` has already been called
    // for the given scope name.

    const template = part.value instanceof TemplateInstance ? part.value.template : undefined;
    prepareTemplateStyles(scopeName, renderContainer, template);
    removeNodes(container, container.firstChild);
    container.appendChild(renderContainer);
    parts.set(container, part);
  } // After elements have hit the DOM, update styling if this is the
  // initial render to this container.
  // This is needed whenever dynamic changes are made so it would be
  // safest to do every render; however, this would regress performance
  // so we leave it up to the user to call `ShadyCSS.styleElement`
  // for dynamic changes.


  if (!hasRendered && needsScoping) {
    window.ShadyCSS.styleElement(container.host);
  }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
var _a;
/**
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */


window.JSCompiler_renameProperty = (prop, _obj) => prop;

const defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value ? '' : null;

      case Object:
      case Array:
        // if the value is `null` or `undefined` pass this through
        // to allow removing/no change behavior.
        return value == null ? value : JSON.stringify(value);
    }

    return value;
  },

  fromAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value !== null;

      case Number:
        return value === null ? null : Number(value);

      case Object:
      case Array:
        return JSON.parse(value);
    }

    return value;
  }

};
/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */

const notEqual = (value, old) => {
  // This ensures (old==NaN, value==NaN) always returns false
  return old !== value && (old === old || value === value);
};
const defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
const microtaskPromise = Promise.resolve(true);
const STATE_HAS_UPDATED = 1;
const STATE_UPDATE_REQUESTED = 1 << 2;
const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
const STATE_HAS_CONNECTED = 1 << 5;
/**
 * The Closure JS Compiler doesn't currently have good support for static
 * property semantics where "this" is dynamic (e.g.
 * https://github.com/google/closure-compiler/issues/3177 and others) so we use
 * this hack to bypass any rewriting by the compiler.
 */

const finalized = 'finalized';
/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 */

class UpdatingElement extends HTMLElement {
  constructor() {
    super();
    this._updateState = 0;
    this._instanceProperties = undefined;
    this._updatePromise = microtaskPromise;
    this._hasConnectedResolver = undefined;
    /**
     * Map with keys for any properties that have changed since the last
     * update cycle with previous values.
     */

    this._changedProperties = new Map();
    /**
     * Map with keys of properties that should be reflected when updated.
     */

    this._reflectingProperties = undefined;
    this.initialize();
  }
  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   */


  static get observedAttributes() {
    // note: piggy backing on this to ensure we're finalized.
    this.finalize();
    const attributes = []; // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays

    this._classProperties.forEach((v, p) => {
      const attr = this._attributeNameForProperty(p, v);

      if (attr !== undefined) {
        this._attributeToPropertyMap.set(attr, p);

        attributes.push(attr);
      }
    });

    return attributes;
  }
  /**
   * Ensures the private `_classProperties` property metadata is created.
   * In addition to `finalize` this is also called in `createProperty` to
   * ensure the `@property` decorator can add property metadata.
   */

  /** @nocollapse */


  static _ensureClassProperties() {
    // ensure private storage for property declarations.
    if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
      this._classProperties = new Map(); // NOTE: Workaround IE11 not supporting Map constructor argument.

      const superProperties = Object.getPrototypeOf(this)._classProperties;

      if (superProperties !== undefined) {
        superProperties.forEach((v, k) => this._classProperties.set(k, v));
      }
    }
  }
  /**
   * Creates a property accessor on the element prototype if one does not exist.
   * The property setter calls the property's `hasChanged` property option
   * or uses a strict identity check to determine whether or not to request
   * an update.
   * @nocollapse
   */


  static createProperty(name, options = defaultPropertyDeclaration) {
    // Note, since this can be called by the `@property` decorator which
    // is called before `finalize`, we ensure storage exists for property
    // metadata.
    this._ensureClassProperties();

    this._classProperties.set(name, options); // Do not generate an accessor if the prototype already has one, since
    // it would be lost otherwise and that would never be the user's intention;
    // Instead, we expect users to call `requestUpdate` themselves from
    // user-defined accessors. Note that if the super has an accessor we will
    // still overwrite it


    if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
      return;
    }

    const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
    Object.defineProperty(this.prototype, name, {
      // tslint:disable-next-line:no-any no symbol in index
      get() {
        return this[key];
      },

      set(value) {
        const oldValue = this[name];
        this[key] = value;

        this._requestUpdate(name, oldValue);
      },

      configurable: true,
      enumerable: true
    });
  }
  /**
   * Creates property accessors for registered properties and ensures
   * any superclasses are also finalized.
   * @nocollapse
   */


  static finalize() {
    // finalize any superclasses
    const superCtor = Object.getPrototypeOf(this);

    if (!superCtor.hasOwnProperty(finalized)) {
      superCtor.finalize();
    }

    this[finalized] = true;

    this._ensureClassProperties(); // initialize Map populated in observedAttributes


    this._attributeToPropertyMap = new Map(); // make any properties
    // Note, only process "own" properties since this element will inherit
    // any properties defined on the superClass, and finalization ensures
    // the entire prototype chain is finalized.

    if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
      const props = this.properties; // support symbols in properties (IE11 does not support this)

      const propKeys = [...Object.getOwnPropertyNames(props), ...(typeof Object.getOwnPropertySymbols === 'function' ? Object.getOwnPropertySymbols(props) : [])]; // This for/of is ok because propKeys is an array

      for (const p of propKeys) {
        // note, use of `any` is due to TypeSript lack of support for symbol in
        // index types
        // tslint:disable-next-line:no-any no symbol in index
        this.createProperty(p, props[p]);
      }
    }
  }
  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */


  static _attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? undefined : typeof attribute === 'string' ? attribute : typeof name === 'string' ? name.toLowerCase() : undefined;
  }
  /**
   * Returns true if a property should request an update.
   * Called when a property value is set and uses the `hasChanged`
   * option for the property if present or a strict identity check.
   * @nocollapse
   */


  static _valueHasChanged(value, old, hasChanged = notEqual) {
    return hasChanged(value, old);
  }
  /**
   * Returns the property value for the given attribute value.
   * Called via the `attributeChangedCallback` and uses the property's
   * `converter` or `converter.fromAttribute` property option.
   * @nocollapse
   */


  static _propertyValueFromAttribute(value, options) {
    const type = options.type;
    const converter = options.converter || defaultConverter;
    const fromAttribute = typeof converter === 'function' ? converter : converter.fromAttribute;
    return fromAttribute ? fromAttribute(value, type) : value;
  }
  /**
   * Returns the attribute value for the given property value. If this
   * returns undefined, the property will *not* be reflected to an attribute.
   * If this returns null, the attribute will be removed, otherwise the
   * attribute will be set to the value.
   * This uses the property's `reflect` and `type.toAttribute` property options.
   * @nocollapse
   */


  static _propertyValueToAttribute(value, options) {
    if (options.reflect === undefined) {
      return;
    }

    const type = options.type;
    const converter = options.converter;
    const toAttribute = converter && converter.toAttribute || defaultConverter.toAttribute;
    return toAttribute(value, type);
  }
  /**
   * Performs element initialization. By default captures any pre-set values for
   * registered properties.
   */


  initialize() {
    this._saveInstanceProperties(); // ensures first update will be caught by an early access of
    // `updateComplete`


    this._requestUpdate();
  }
  /**
   * Fixes any properties set on the instance before upgrade time.
   * Otherwise these would shadow the accessor and break these properties.
   * The properties are stored in a Map which is played back after the
   * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
   * (<=41), properties created for native platform properties like (`id` or
   * `name`) may not have default values set in the element constructor. On
   * these browsers native properties appear on instances and therefore their
   * default value will overwrite any element default (e.g. if the element sets
   * this.id = 'id' in the constructor, the 'id' will become '' since this is
   * the native platform default).
   */


  _saveInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    this.constructor._classProperties.forEach((_v, p) => {
      if (this.hasOwnProperty(p)) {
        const value = this[p];
        delete this[p];

        if (!this._instanceProperties) {
          this._instanceProperties = new Map();
        }

        this._instanceProperties.set(p, value);
      }
    });
  }
  /**
   * Applies previously saved instance properties.
   */


  _applyInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    // tslint:disable-next-line:no-any
    this._instanceProperties.forEach((v, p) => this[p] = v);

    this._instanceProperties = undefined;
  }

  connectedCallback() {
    this._updateState = this._updateState | STATE_HAS_CONNECTED; // Ensure first connection completes an update. Updates cannot complete
    // before connection and if one is pending connection the
    // `_hasConnectionResolver` will exist. If so, resolve it to complete the
    // update, otherwise requestUpdate.

    if (this._hasConnectedResolver) {
      this._hasConnectedResolver();

      this._hasConnectedResolver = undefined;
    }
  }
  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   */


  disconnectedCallback() {}
  /**
   * Synchronizes property values when attributes change.
   */


  attributeChangedCallback(name, old, value) {
    if (old !== value) {
      this._attributeToProperty(name, value);
    }
  }

  _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
    const ctor = this.constructor;

    const attr = ctor._attributeNameForProperty(name, options);

    if (attr !== undefined) {
      const attrValue = ctor._propertyValueToAttribute(value, options); // an undefined value does not change the attribute.


      if (attrValue === undefined) {
        return;
      } // Track if the property is being reflected to avoid
      // setting the property again via `attributeChangedCallback`. Note:
      // 1. this takes advantage of the fact that the callback is synchronous.
      // 2. will behave incorrectly if multiple attributes are in the reaction
      // stack at time of calling. However, since we process attributes
      // in `update` this should not be possible (or an extreme corner case
      // that we'd like to discover).
      // mark state reflecting


      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;

      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      } // mark state not reflecting


      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
    }
  }

  _attributeToProperty(name, value) {
    // Use tracking info to avoid deserializing attribute value if it was
    // just set from a property setter.
    if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
      return;
    }

    const ctor = this.constructor;

    const propName = ctor._attributeToPropertyMap.get(name);

    if (propName !== undefined) {
      const options = ctor._classProperties.get(propName) || defaultPropertyDeclaration; // mark state reflecting

      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
      this[propName] = // tslint:disable-next-line:no-any
      ctor._propertyValueFromAttribute(value, options); // mark state not reflecting

      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
    }
  }
  /**
   * This private version of `requestUpdate` does not access or return the
   * `updateComplete` promise. This promise can be overridden and is therefore
   * not free to access.
   */


  _requestUpdate(name, oldValue) {
    let shouldRequestUpdate = true; // If we have a property key, perform property update steps.

    if (name !== undefined) {
      const ctor = this.constructor;
      const options = ctor._classProperties.get(name) || defaultPropertyDeclaration;

      if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
        if (!this._changedProperties.has(name)) {
          this._changedProperties.set(name, oldValue);
        } // Add to reflecting properties set.
        // Note, it's important that every change has a chance to add the
        // property to `_reflectingProperties`. This ensures setting
        // attribute + property reflects correctly.


        if (options.reflect === true && !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
          if (this._reflectingProperties === undefined) {
            this._reflectingProperties = new Map();
          }

          this._reflectingProperties.set(name, options);
        }
      } else {
        // Abort the request if the property should not be considered changed.
        shouldRequestUpdate = false;
      }
    }

    if (!this._hasRequestedUpdate && shouldRequestUpdate) {
      this._enqueueUpdate();
    }
  }
  /**
   * Requests an update which is processed asynchronously. This should
   * be called when an element should update based on some state not triggered
   * by setting a property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored. Returns the `updateComplete` Promise which is resolved
   * when the update completes.
   *
   * @param name {PropertyKey} (optional) name of requesting property
   * @param oldValue {any} (optional) old value of requesting property
   * @returns {Promise} A Promise that is resolved when the update completes.
   */


  requestUpdate(name, oldValue) {
    this._requestUpdate(name, oldValue);

    return this.updateComplete;
  }
  /**
   * Sets up the element to asynchronously update.
   */


  async _enqueueUpdate() {
    // Mark state updating...
    this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
    let resolve;
    let reject;
    const previousUpdatePromise = this._updatePromise;
    this._updatePromise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await previousUpdatePromise;
    } catch (e) {// Ignore any previous errors. We only care that the previous cycle is
      // done. Any error should have been handled in the previous update.
    } // Make sure the element has connected before updating.


    if (!this._hasConnected) {
      await new Promise(res => this._hasConnectedResolver = res);
    }

    try {
      const result = this.performUpdate(); // If `performUpdate` returns a Promise, we await it. This is done to
      // enable coordinating updates with a scheduler. Note, the result is
      // checked to avoid delaying an additional microtask unless we need to.

      if (result != null) {
        await result;
      }
    } catch (e) {
      reject(e);
    }

    resolve(!this._hasRequestedUpdate);
  }

  get _hasConnected() {
    return this._updateState & STATE_HAS_CONNECTED;
  }

  get _hasRequestedUpdate() {
    return this._updateState & STATE_UPDATE_REQUESTED;
  }

  get hasUpdated() {
    return this._updateState & STATE_HAS_UPDATED;
  }
  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * You can override this method to change the timing of updates. If this
   * method is overridden, `super.performUpdate()` must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```
   * protected async performUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.performUpdate();
   * }
   * ```
   */


  performUpdate() {
    // Mixin instance properties once, if they exist.
    if (this._instanceProperties) {
      this._applyInstanceProperties();
    }

    let shouldUpdate = false;
    const changedProperties = this._changedProperties;

    try {
      shouldUpdate = this.shouldUpdate(changedProperties);

      if (shouldUpdate) {
        this.update(changedProperties);
      }
    } catch (e) {
      // Prevent `firstUpdated` and `updated` from running when there's an
      // update exception.
      shouldUpdate = false;
      throw e;
    } finally {
      // Ensure element can accept additional updates after an exception.
      this._markUpdated();
    }

    if (shouldUpdate) {
      if (!(this._updateState & STATE_HAS_UPDATED)) {
        this._updateState = this._updateState | STATE_HAS_UPDATED;
        this.firstUpdated(changedProperties);
      }

      this.updated(changedProperties);
    }
  }

  _markUpdated() {
    this._changedProperties = new Map();
    this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
  }
  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * To await additional asynchronous work, override the `_getUpdateComplete`
   * method. For example, it is sometimes useful to await a rendered element
   * before fulfilling this Promise. To do this, first await
   * `super._getUpdateComplete()`, then any subsequent state.
   *
   * @returns {Promise} The Promise returns a boolean that indicates if the
   * update resolved without triggering another update.
   */


  get updateComplete() {
    return this._getUpdateComplete();
  }
  /**
   * Override point for the `updateComplete` promise.
   *
   * It is not safe to override the `updateComplete` getter directly due to a
   * limitation in TypeScript which means it is not possible to call a
   * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
   * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
   * This method should be overridden instead. For example:
   *
   *   class MyElement extends LitElement {
   *     async _getUpdateComplete() {
   *       await super._getUpdateComplete();
   *       await this._myChild.updateComplete;
   *     }
   *   }
   */


  _getUpdateComplete() {
    return this._updatePromise;
  }
  /**
   * Controls whether or not `update` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  shouldUpdate(_changedProperties) {
    return true;
  }
  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  update(_changedProperties) {
    if (this._reflectingProperties !== undefined && this._reflectingProperties.size > 0) {
      // Use forEach so this works even if for/of loops are compiled to for
      // loops expecting arrays
      this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));

      this._reflectingProperties = undefined;
    }
  }
  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  updated(_changedProperties) {}
  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  firstUpdated(_changedProperties) {}

}
_a = finalized;
/**
 * Marks class as having finished creating properties.
 */

UpdatingElement[_a] = true;

/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
const supportsAdoptingStyleSheets = 'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time

(window['litElementVersions'] || (window['litElementVersions'] = [])).push('2.2.1');
/**
 * Minimal implementation of Array.prototype.flat
 * @param arr the array to flatten
 * @param result the accumlated result
 */

function arrayFlat(styles, result = []) {
  for (let i = 0, length = styles.length; i < length; i++) {
    const value = styles[i];

    if (Array.isArray(value)) {
      arrayFlat(value, result);
    } else {
      result.push(value);
    }
  }

  return result;
}
/** Deeply flattens styles array. Uses native flat if available. */


const flattenStyles = styles => styles.flat ? styles.flat(Infinity) : arrayFlat(styles);

class LitElement extends UpdatingElement {
  /** @nocollapse */
  static finalize() {
    // The Closure JS Compiler does not always preserve the correct "this"
    // when calling static super methods (b/137460243), so explicitly bind.
    super.finalize.call(this); // Prepare styling that is stamped at first render time. Styling
    // is built from user provided `styles` or is inherited from the superclass.

    this._styles = this.hasOwnProperty(JSCompiler_renameProperty('styles', this)) ? this._getUniqueStyles() : this._styles || [];
  }
  /** @nocollapse */


  static _getUniqueStyles() {
    // Take care not to call `this.styles` multiple times since this generates
    // new CSSResults each time.
    // TODO(sorvell): Since we do not cache CSSResults by input, any
    // shared styles will generate new stylesheet objects, which is wasteful.
    // This should be addressed when a browser ships constructable
    // stylesheets.
    const userStyles = this.styles;
    const styles = [];

    if (Array.isArray(userStyles)) {
      const flatStyles = flattenStyles(userStyles); // As a performance optimization to avoid duplicated styling that can
      // occur especially when composing via subclassing, de-duplicate styles
      // preserving the last item in the list. The last item is kept to
      // try to preserve cascade order with the assumption that it's most
      // important that last added styles override previous styles.

      const styleSet = flatStyles.reduceRight((set, s) => {
        set.add(s); // on IE set.add does not return the set.

        return set;
      }, new Set()); // Array.from does not work on Set in IE

      styleSet.forEach(v => styles.unshift(v));
    } else if (userStyles) {
      styles.push(userStyles);
    }

    return styles;
  }
  /**
   * Performs element initialization. By default this calls `createRenderRoot`
   * to create the element `renderRoot` node and captures any pre-set values for
   * registered properties.
   */


  initialize() {
    super.initialize();
    this.renderRoot = this.createRenderRoot(); // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
    // element's getRootNode(). While this could be done, we're choosing not to
    // support this now since it would require different logic around de-duping.

    if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
      this.adoptStyles();
    }
  }
  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   * @returns {Element|DocumentFragment} Returns a node into which to render.
   */


  createRenderRoot() {
    return this.attachShadow({
      mode: 'open'
    });
  }
  /**
   * Applies styling to the element shadowRoot using the `static get styles`
   * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
   * available and will fallback otherwise. When Shadow DOM is polyfilled,
   * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
   * is available but `adoptedStyleSheets` is not, styles are appended to the
   * end of the `shadowRoot` to [mimic spec
   * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
   */


  adoptStyles() {
    const styles = this.constructor._styles;

    if (styles.length === 0) {
      return;
    } // There are three separate cases here based on Shadow DOM support.
    // (1) shadowRoot polyfilled: use ShadyCSS
    // (2) shadowRoot.adoptedStyleSheets available: use it.
    // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
    // rendering


    if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
      window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(s => s.cssText), this.localName);
    } else if (supportsAdoptingStyleSheets) {
      this.renderRoot.adoptedStyleSheets = styles.map(s => s.styleSheet);
    } else {
      // This must be done after rendering so the actual style insertion is done
      // in `update`.
      this._needsShimAdoptedStyleSheets = true;
    }
  }

  connectedCallback() {
    super.connectedCallback(); // Note, first update/render handles styleElement so we only call this if
    // connected after first update.

    if (this.hasUpdated && window.ShadyCSS !== undefined) {
      window.ShadyCSS.styleElement(this);
    }
  }
  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * * @param _changedProperties Map of changed properties with old values
   */


  update(changedProperties) {
    super.update(changedProperties);
    const templateResult = this.render();

    if (templateResult instanceof TemplateResult) {
      this.constructor.render(templateResult, this.renderRoot, {
        scopeName: this.localName,
        eventContext: this
      });
    } // When native Shadow DOM is used but adoptedStyles are not supported,
    // insert styling after rendering to ensure adoptedStyles have highest
    // priority.


    if (this._needsShimAdoptedStyleSheets) {
      this._needsShimAdoptedStyleSheets = false;

      this.constructor._styles.forEach(s => {
        const style = document.createElement('style');
        style.textContent = s.cssText;
        this.renderRoot.appendChild(style);
      });
    }
  }
  /**
   * Invoked on each update to perform rendering tasks. This method must return
   * a lit-html TemplateResult. Setting properties inside this method will *not*
   * trigger the element to update.
   */


  render() {}

}
/**
 * Ensure this class is marked as `finalized` as an optimization ensuring
 * it will not needlessly try to `finalize`.
 *
 * Note this property name is a string to prevent breaking Closure JS Compiler
 * optimizations. See updating-element.ts for more information.
 */

LitElement['finalized'] = true;
/**
 * Render method used to render the lit-html TemplateResult to the element's
 * DOM.
 * @param {TemplateResult} Template to render.
 * @param {Element|DocumentFragment} Node into which to render.
 * @param {String} Element name.
 * @nocollapse
 */

LitElement.render = render$1;

/**
 * `countries-data`
 */
class CountriesDataProvider {
  constructor() {}

} // Statically defines the data of the component


if (!CountriesDataProvider.data) {
  CountriesDataProvider.data = {
    list: [{
      flag: 'af.svg',
      name: 'Afghanistan',
      code2: 'AF',
      code3: 'AFG',
      currency: 'AFN',
      symbol: '؋',
      currencyFull: 'Afghani',
      capital: 'Kabul'
    }, {
      flag: 'al.svg',
      name: 'Albania',
      code2: 'AL',
      code3: 'ALB',
      currency: 'ALL',
      symbol: 'Lek',
      currencyFull: 'Lek',
      capital: 'Tirana'
    }, {
      flag: 'dz.svg',
      name: 'Algeria',
      code2: 'DZ',
      code3: 'DZA',
      currency: 'DZD',
      symbol: '',
      currencyFull: 'Algerian Dinar',
      capital: 'Algiers'
    }, {
      flag: 'as.svg',
      name: 'American Samoa',
      code2: 'AS',
      code3: 'ASM',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US Dollar',
      capital: 'Pago Pago'
    }, {
      flag: 'ad.svg',
      name: 'Andorra',
      code2: 'AD',
      code3: 'AND',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Andorra la Vella'
    }, {
      flag: 'ao.svg',
      name: 'Angola',
      code2: 'AO',
      code3: 'AGO',
      currency: 'AOA',
      symbol: '',
      currencyFull: 'Kwanza',
      capital: 'Luanda'
    }, {
      flag: 'ai.svg',
      name: 'Anguilla',
      code2: 'AI',
      code3: 'AIA',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'East Caribbean Dollar',
      capital: 'The Valley'
    }, {
      flag: 'ag.svg',
      name: 'Antigua and Barbuda',
      code2: 'AG',
      code3: 'ATG',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'East Caribbean Dollar',
      capital: 'St John\'s'
    }, {
      flag: 'ar.svg',
      name: 'Argentina',
      code2: 'AR',
      code3: 'ARG',
      currency: 'ARS',
      symbol: '$',
      currencyFull: 'Argentine Peso',
      capital: 'Buenos Aires'
    }, {
      flag: 'am.svg',
      name: 'Armenia',
      code2: 'AM',
      code3: 'ARM',
      currency: 'AMD',
      symbol: '',
      currencyFull: 'Armenian Dram',
      capital: 'Yerevan'
    }, {
      flag: 'aw.svg',
      name: 'Aruba',
      code2: 'AW',
      code3: 'ABW',
      currency: 'AWG',
      symbol: 'ƒ',
      currencyFull: 'Aruban Florin',
      capital: 'Oranjestad'
    }, {
      flag: 'au.svg',
      name: 'Australia',
      code2: 'AU',
      code3: 'AUS',
      currency: 'AUD',
      symbol: '$',
      currencyFull: 'Australian Dollar',
      capital: 'Canberra'
    }, {
      flag: 'at.svg',
      name: 'Austria',
      code2: 'AT',
      code3: 'AUT',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Vienna'
    }, {
      flag: 'az.svg',
      name: 'Azerbaijan',
      code2: 'AZ',
      code3: 'AZE',
      currency: 'AZN',
      symbol: '₼',
      currencyFull: 'Azerbaijan Manat',
      capital: 'Baku'
    }, {
      flag: 'bs.svg',
      name: 'The Bahamas',
      code2: 'BS',
      code3: 'BHS',
      currency: 'BSD',
      symbol: '$',
      currencyFull: 'Bahamian Dollar',
      capital: 'Nassau'
    }, {
      flag: 'bh.svg',
      name: 'Bahrain',
      code2: 'BH',
      code3: 'BHR',
      currency: 'BHD',
      symbol: '',
      currencyFull: 'Bahraini Dinar',
      capital: 'Manama'
    }, {
      flag: 'bd.svg',
      name: 'Bangladesh',
      code2: 'BD',
      code3: 'BGD',
      currency: 'BDT',
      symbol: '',
      currencyFull: 'Taka',
      capital: 'Dhaka'
    }, {
      flag: 'bb.svg',
      name: 'Barbados',
      code2: 'BB',
      code3: 'BRB',
      currency: 'BBD',
      symbol: '$',
      currencyFull: 'Barbados Dollar',
      capital: 'Bridgetown'
    }, {
      flag: 'by.svg',
      name: 'Belarus',
      code2: 'BY',
      code3: 'BLR',
      currency: 'BYN',
      symbol: 'Br',
      currencyFull: 'Belarusian Ruble',
      capital: 'Minsk'
    }, {
      flag: 'be.svg',
      name: 'Belgium',
      code2: 'BE',
      code3: 'BEL',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Brussels'
    }, {
      flag: 'bz.svg',
      name: 'Belize',
      code2: 'BZ',
      code3: 'BLZ',
      currency: 'BZD',
      symbol: 'BZ$',
      currencyFull: 'Belize Dollar',
      capital: 'Belmopan'
    }, {
      flag: 'bj.svg',
      name: 'Benin',
      code2: 'BJ',
      code3: 'BEN',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA Franc BCEAO',
      capital: 'Porto Novo'
    }, {
      flag: 'bm.svg',
      name: 'Bermuda',
      code2: 'BM',
      code3: 'BMU',
      currency: 'BMD',
      symbol: '$',
      currencyFull: 'Bermudian Dollar',
      capital: 'Hamilton'
    }, {
      flag: 'bt.svg',
      name: 'Bhutan',
      code2: 'BT',
      code3: 'BTN',
      currency: 'BTN',
      symbol: '',
      currencyFull: 'Indian Rupee',
      capital: 'Thimphu'
    }, {
      flag: 'bo.svg',
      name: 'Bolivia',
      code2: 'BO',
      code3: 'BOL',
      currency: 'BOB',
      symbol: '$b',
      currencyFull: 'boliviano',
      capital: 'Sucre'
    }, {
      flag: 'ba.svg',
      name: 'Bosnia and Herzegovina',
      code2: 'BA',
      code3: 'BIH',
      currency: 'BAM',
      symbol: 'KM',
      currencyFull: 'Convertible Mark',
      capital: 'Sarajevo'
    }, {
      flag: 'bw.svg',
      name: 'Botswana',
      code2: 'BW',
      code3: 'BWA',
      currency: 'BWP',
      symbol: 'P',
      currencyFull: 'Pula',
      capital: 'Gaborone'
    }, {
      flag: 'bv.svg',
      name: 'Bouvet Island',
      code2: 'BV',
      code3: 'BVT',
      currency: 'NOK',
      symbol: 'kr',
      currencyFull: 'Norwegian Krone',
      capital: '-'
    }, {
      flag: 'br.svg',
      name: 'Brazil',
      code2: 'BR',
      code3: 'BRA',
      currency: 'BRL',
      symbol: 'R$',
      currencyFull: 'Brazilian Real',
      capital: 'Brasilia'
    }, {
      flag: 'vg.svg',
      name: 'British Virgin Islands',
      code2: 'VG',
      code3: 'VGB',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US Dollar',
      capital: 'Road Town'
    }, {
      flag: 'bn.svg',
      name: 'Brunei',
      code2: 'BN',
      code3: 'BRN',
      currency: 'BND',
      symbol: '$',
      currencyFull: 'Brunei Dollar',
      capital: 'Bandar Seri Begawan'
    }, {
      flag: 'bg.svg',
      name: 'Bulgaria',
      code2: 'BG',
      code3: 'BGR',
      currency: 'BGN',
      symbol: 'лв',
      currencyFull: 'Bulgarian Lev',
      capital: 'Sofia'
    }, {
      flag: 'bf.svg',
      name: 'Burkina Faso',
      code2: 'BF',
      code3: 'BFA',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA Franc BCEAO',
      capital: 'Ouagadougou'
    }, {
      flag: 'bi.svg',
      name: 'Burundi',
      code2: 'BI',
      code3: 'BDI',
      currency: 'BIF',
      symbol: '',
      currencyFull: 'Burundi Franc',
      capital: 'Bujumbura'
    }, {
      flag: 'kh.svg',
      name: 'Cambodia',
      code2: 'KH',
      code3: 'KHM',
      currency: 'KHR',
      symbol: '៛',
      currencyFull: 'Riel',
      capital: 'Phnom Penh'
    }, {
      flag: 'cm.svg',
      name: 'Cameroon',
      code2: 'CM',
      code3: 'CMR',
      currency: 'XAF',
      symbol: '',
      currencyFull: 'CFA Franc BEAC',
      capital: 'Yaound'
    }, {
      flag: 'ca.svg',
      name: 'Canada',
      code2: 'CA',
      code3: 'CAN',
      currency: 'CAD',
      symbol: '$',
      currencyFull: 'Canadian Dollar',
      capital: 'Ottawa'
    }, {
      flag: 'cv.svg',
      name: 'Cape Verde',
      code2: 'CV',
      code3: 'CPV',
      currency: 'CVE',
      symbol: '',
      currencyFull: 'Cape Verde escudo',
      capital: 'Praia'
    }, {
      flag: 'ky.svg',
      name: 'Cayman Islands',
      code2: 'KY',
      code3: 'CYM',
      currency: 'KYD',
      symbol: '$',
      currencyFull: 'Cayman Islands dollar',
      capital: 'George Town'
    }, {
      flag: 'cf.svg',
      name: 'Central African Republic',
      code2: 'CF',
      code3: 'CAF',
      currency: 'XAF',
      symbol: '',
      currencyFull: 'CFA franc',
      capital: 'Bangui'
    }, {
      flag: 'td.svg',
      name: 'Chad',
      code2: 'TD',
      code3: 'TCD',
      currency: 'XAF',
      symbol: '',
      currencyFull: 'CFA Franc BEAC',
      capital: 'N\'Djamena'
    }, {
      flag: 'cl.svg',
      name: 'Chile',
      code2: 'CL',
      code3: 'CHL',
      currency: 'CLP',
      symbol: '$',
      currencyFull: 'Chilean Peso',
      capital: 'Santiago'
    }, {
      flag: 'cn.svg',
      name: 'China',
      code2: 'CN',
      code3: 'CHN',
      currency: 'CNY',
      symbol: '¥',
      currencyFull: 'Yuan Renminbi',
      capital: 'Beijing'
    }, {
      flag: 'hk.svg',
      name: 'Hong Kong',
      code2: 'HK',
      code3: 'HKG',
      currency: 'HKD',
      symbol: '$',
      currencyFull: 'Hong Kong Dollar',
      capital: 'Victoria City'
    }, {
      flag: 'mo.svg',
      name: 'Macau',
      code2: 'MO',
      code3: 'MAC',
      currency: 'MOP',
      symbol: '',
      currencyFull: 'pataca',
      capital: 'Macau'
    }, {
      flag: 'cx.svg',
      name: 'Christmas Island',
      code2: 'CX',
      code3: 'CXR',
      currency: 'AUD',
      symbol: '$',
      currencyFull: 'Australian Dollar',
      capital: 'Flying Fish Cove'
    }, {
      flag: 'cc.svg',
      name: 'Cocos (Keeling) Islands',
      code2: 'CC',
      code3: 'CCK',
      currency: 'AUD',
      symbol: '$',
      currencyFull: 'Australian dollar',
      capital: 'Bantam'
    }, {
      flag: 'co.svg',
      name: 'Colombia',
      code2: 'CO',
      code3: 'COL',
      currency: 'COP',
      symbol: '$',
      currencyFull: 'Colombian Peso',
      capital: 'Santa Fe de Bogot'
    }, {
      flag: 'km.svg',
      name: 'Comoros',
      code2: 'KM',
      code3: 'COM',
      currency: 'KMF',
      symbol: '',
      currencyFull: 'Comorian franc',
      capital: 'Moroni'
    }, {
      flag: 'cg.svg',
      name: 'Congo',
      code2: 'CG',
      code3: 'COG',
      currency: 'XAF',
      symbol: '',
      currencyFull: 'CFA franc',
      capital: 'Brazzaville'
    }, {
      flag: 'cd.svg',
      name: 'Democratic Republic of the Congo',
      code2: 'CD',
      code3: 'COD',
      currency: 'CDF',
      symbol: '',
      currencyFull: 'Congolese franc',
      capital: 'Kinshasa'
    }, {
      flag: 'ck.svg',
      name: 'Cook Islands',
      code2: 'CK',
      code3: 'COK',
      currency: 'NZD',
      symbol: '$',
      currencyFull: 'New Zealand dollar',
      capital: 'Avarua'
    }, {
      flag: 'cr.svg',
      name: 'Costa Rica',
      code2: 'CR',
      code3: 'CRI',
      currency: 'CRC',
      symbol: '₡',
      currencyFull: 'Costa Rican Colon',
      capital: 'San Jos'
    }, {
      flag: 'ci.svg',
      name: 'Cote D\'Ivoire',
      code2: 'CI',
      code3: 'CIV',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA Franc BCEAO',
      capital: 'Yamoussoukro'
    }, {
      flag: 'hr.svg',
      name: 'Croatia',
      code2: 'HR',
      code3: 'HRV',
      currency: 'HRK',
      symbol: 'kn',
      currencyFull: 'Kuna',
      capital: 'Zagreb'
    }, {
      flag: 'cu.svg',
      name: 'Cuba',
      code2: 'CU',
      code3: 'CUB',
      currency: 'CUP',
      symbol: '₱',
      currencyFull: 'Cuban Peso',
      capital: 'Havana'
    }, {
      flag: 'cy.svg',
      name: 'Cyprus',
      code2: 'CY',
      code3: 'CYP',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Nicosia'
    }, {
      flag: 'cz.svg',
      name: 'Czech Republic',
      code2: 'CZ',
      code3: 'CZE',
      currency: 'CZK',
      symbol: 'Kč',
      currencyFull: 'Czech koruna (pl. koruny)',
      capital: 'Prague'
    }, {
      flag: 'dk.svg',
      name: 'Denmark',
      code2: 'DK',
      code3: 'DNK',
      currency: 'DKK',
      symbol: 'kr',
      currencyFull: 'Danish Krone',
      capital: 'Copenhagen'
    }, {
      flag: 'dj.svg',
      name: 'Djibouti',
      code2: 'DJ',
      code3: 'DJI',
      currency: 'DJF',
      symbol: '',
      currencyFull: 'Djibouti Franc',
      capital: 'Djibouti'
    }, {
      flag: 'dm.svg',
      name: 'Dominica',
      code2: 'DM',
      code3: 'DMA',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'East Caribbean Dollar',
      capital: 'Roseau'
    }, {
      flag: 'do.svg',
      name: 'Dominican Republic',
      code2: 'DO',
      code3: 'DOM',
      currency: 'DOP',
      symbol: 'RD$',
      currencyFull: 'Dominican peso',
      capital: 'Santo Domingo'
    }, {
      flag: 'ec.svg',
      name: 'Ecuador',
      code2: 'EC',
      code3: 'ECU',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US Dollar',
      capital: 'Quito'
    }, {
      flag: 'eg.svg',
      name: 'Egypt',
      code2: 'EG',
      code3: 'EGY',
      currency: 'EGP',
      symbol: '£',
      currencyFull: 'Egyptian Pound',
      capital: 'Cairo'
    }, {
      flag: 'sv.svg',
      name: 'El Salvador',
      code2: 'SV',
      code3: 'SLV',
      currency: 'SVC',
      symbol: '$',
      currencyFull: 'El Salvador Colon',
      capital: 'San Salvador'
    }, {
      flag: 'gq.svg',
      name: 'Equatorial Guinea',
      code2: 'GQ',
      code3: 'GNQ',
      currency: 'XAF',
      symbol: '',
      currencyFull: 'CFA Franc BEAC',
      capital: 'Malabo'
    }, {
      flag: 'er.svg',
      name: 'Eritrea',
      code2: 'ER',
      code3: 'ERI',
      currency: 'ERN',
      symbol: '',
      currencyFull: 'Nakfa',
      capital: 'Asmara'
    }, {
      flag: 'ee.svg',
      name: 'Estonia',
      code2: 'EE',
      code3: 'EST',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Tallinn'
    }, {
      flag: 'et.svg',
      name: 'Ethiopia',
      code2: 'ET',
      code3: 'ETH',
      currency: 'ETB',
      symbol: '',
      currencyFull: 'Ethiopian Birr',
      capital: 'Addis Ababa'
    }, {
      flag: 'fk.svg',
      name: 'Falkland Islands',
      code2: 'FK',
      code3: 'FLK',
      currency: 'FKP',
      symbol: '£',
      currencyFull: 'Falkland Islands pound',
      capital: 'Stanley'
    }, {
      flag: 'fo.svg',
      name: 'Faeroe Islands',
      code2: 'FO',
      code3: 'FRO',
      currency: 'DKK',
      symbol: 'kr',
      currencyFull: 'Danish krone (pl. kroner)',
      capital: 'Thorshavn'
    }, {
      flag: 'fj.svg',
      name: 'Fiji',
      code2: 'FJ',
      code3: 'FJI',
      currency: 'FJD',
      symbol: '$',
      currencyFull: 'Fiji Dollar',
      capital: 'Suva'
    }, {
      flag: 'fi.svg',
      name: 'Finland',
      code2: 'FI',
      code3: 'FIN',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Helsinki'
    }, {
      flag: 'fr.svg',
      name: 'France',
      code2: 'FR',
      code3: 'FRA',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Paris'
    }, {
      flag: 'gf.svg',
      name: 'French Guiana',
      code2: 'GF',
      code3: 'GUF',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Cayenne'
    }, {
      flag: 'pf.svg',
      name: 'French Polynesia',
      code2: 'PF',
      code3: 'PYF',
      currency: 'XPF',
      symbol: '',
      currencyFull: 'CFP Franc',
      capital: 'Papeete'
    }, {
      flag: 'ga.svg',
      name: 'Gabon',
      code2: 'GA',
      code3: 'GAB',
      currency: 'XAF',
      symbol: '',
      currencyFull: 'CFA Franc BEAC',
      capital: 'Libreville'
    }, {
      flag: 'gm.svg',
      name: 'The Gambia',
      code2: 'GM',
      code3: 'GMB',
      currency: 'GMD',
      symbol: '',
      currencyFull: 'dalasi (inv.)',
      capital: 'Banjul'
    }, {
      flag: 'ge.svg',
      name: 'Georgia',
      code2: 'GE',
      code3: 'GEO',
      currency: 'GEL',
      symbol: '',
      currencyFull: 'Lari',
      capital: 'Tbilisi'
    }, {
      flag: 'de.svg',
      name: 'Germany',
      code2: 'DE',
      code3: 'DEU',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Berlin'
    }, {
      flag: 'gh.svg',
      name: 'Ghana',
      code2: 'GH',
      code3: 'GHA',
      currency: 'GHS',
      symbol: '¢',
      currencyFull: 'Ghana Cedi',
      capital: 'Accra'
    }, {
      flag: 'gi.svg',
      name: 'Gibraltar',
      code2: 'GI',
      code3: 'GIB',
      currency: 'GIP',
      symbol: '£',
      currencyFull: 'Gibraltar Pound',
      capital: 'Gibraltar'
    }, {
      flag: 'gr.svg',
      name: 'Greece',
      code2: 'GR',
      code3: 'GRC',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Athens'
    }, {
      flag: 'gl.svg',
      name: 'Greenland',
      code2: 'GL',
      code3: 'GRL',
      currency: 'DKK',
      symbol: 'kr',
      currencyFull: 'Danish Krone',
      capital: 'Nuuk'
    }, {
      flag: 'gd.svg',
      name: 'Grenada',
      code2: 'GD',
      code3: 'GRD',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'East Caribbean Dollar',
      capital: 'St George\'s'
    }, {
      flag: 'gp.svg',
      name: 'Guadeloupe',
      code2: 'GP',
      code3: 'GLP',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Basse Terre'
    }, {
      flag: 'gu.svg',
      name: 'Guam',
      code2: 'GU',
      code3: 'GUM',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US Dollar',
      capital: 'Hagtana'
    }, {
      flag: 'gt.svg',
      name: 'Guatemala',
      code2: 'GT',
      code3: 'GTM',
      currency: 'GTQ',
      symbol: 'Q',
      currencyFull: 'Quetzal',
      capital: 'Guatemala City'
    }, {
      flag: 'gn.svg',
      name: 'Guinea',
      code2: 'GN',
      code3: 'GIN',
      currency: 'GNF',
      symbol: '',
      currencyFull: 'Guinean Franc',
      capital: 'Conakry'
    }, {
      flag: 'gw.svg',
      name: 'Guinea-Bissau',
      code2: 'GW',
      code3: 'GNB',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA Franc BCEAO',
      capital: 'Bissau'
    }, {
      flag: 'gy.svg',
      name: 'Guyana',
      code2: 'GY',
      code3: 'GUY',
      currency: 'GYD',
      symbol: '$',
      currencyFull: 'Guyana Dollar',
      capital: 'Georgetown'
    }, {
      flag: 'ht.svg',
      name: 'Haiti',
      code2: 'HT',
      code3: 'HTI',
      currency: 'HTG',
      symbol: '',
      currencyFull: 'Gourde',
      capital: 'Port-au-Prince'
    }, {
      flag: 'va.svg',
      name: 'The Hoy See (Vatican City State)',
      code2: 'VA',
      code3: 'VAT',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'euro',
      capital: 'Vatican City'
    }, {
      flag: 'hn.svg',
      name: 'Honduras',
      code2: 'HN',
      code3: 'HND',
      currency: 'HNL',
      symbol: 'L',
      currencyFull: 'Lempira',
      capital: 'Tegucigalpa'
    }, {
      flag: 'hu.svg',
      name: 'Hungary',
      code2: 'HU',
      code3: 'HUN',
      currency: 'HUF',
      symbol: 'Ft',
      currencyFull: 'Forint',
      capital: 'Budapest'
    }, {
      flag: 'is.svg',
      name: 'Iceland',
      code2: 'IS',
      code3: 'ISL',
      currency: 'ISK',
      symbol: 'kr',
      currencyFull: 'Iceland Krona',
      capital: 'Reykjavik'
    }, {
      flag: 'in.svg',
      name: 'India',
      code2: 'IN',
      code3: 'IND',
      currency: 'INR',
      symbol: '₹',
      currencyFull: 'Indian Rupee',
      capital: 'New Delhi'
    }, {
      flag: 'id.svg',
      name: 'Indonesia',
      code2: 'ID',
      code3: 'IDN',
      currency: 'IDR',
      symbol: 'Rp',
      currencyFull: 'Rupiah',
      capital: 'Jakarta'
    }, {
      flag: 'ir.svg',
      name: 'Iran',
      code2: 'IR',
      code3: 'IRN',
      currency: 'IRR',
      symbol: '﷼',
      currencyFull: 'Iranian rial',
      capital: 'Tehran'
    }, {
      flag: 'iq.svg',
      name: 'Iraq',
      code2: 'IQ',
      code3: 'IRQ',
      currency: 'IQD',
      symbol: '',
      currencyFull: 'Iraqi Dinar',
      capital: 'Baghdad'
    }, {
      flag: 'ie.svg',
      name: 'Ireland',
      code2: 'IE',
      code3: 'IRL',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Dublin'
    }, {
      flag: 'il.svg',
      name: 'Israel',
      code2: 'IL',
      code3: 'ISR',
      currency: 'ILS',
      symbol: '₪',
      currencyFull: 'New Israeli Sheqel',
      capital: 'Jerusalem'
    }, {
      flag: 'it.svg',
      name: 'Italy',
      code2: 'IT',
      code3: 'ITA',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Rome'
    }, {
      flag: 'jm.svg',
      name: 'Jamaica',
      code2: 'JM',
      code3: 'JAM',
      currency: 'JMD',
      symbol: 'J$',
      currencyFull: 'Jamaican Dollar',
      capital: 'Kingston'
    }, {
      flag: 'jp.svg',
      name: 'Japan',
      code2: 'JP',
      code3: 'JPN',
      currency: 'JPY',
      symbol: '¥',
      currencyFull: 'Yen',
      capital: 'Tokyo'
    }, {
      flag: 'jo.svg',
      name: 'Jordan',
      code2: 'JO',
      code3: 'JOR',
      currency: 'JOD',
      symbol: '',
      currencyFull: 'Jordanian Dinar',
      capital: 'Amman'
    }, {
      flag: 'kz.svg',
      name: 'Kazakhstan',
      code2: 'KZ',
      code3: 'KAZ',
      currency: 'KZT',
      symbol: 'лв',
      currencyFull: 'Tenge',
      capital: 'Astana'
    }, {
      flag: 'ke.svg',
      name: 'Kenya',
      code2: 'KE',
      code3: 'KEN',
      currency: 'KES',
      symbol: '',
      currencyFull: 'Kenyan Shilling',
      capital: 'Nairobi'
    }, {
      flag: 'ki.svg',
      name: 'Kiribati',
      code2: 'KI',
      code3: 'KIR',
      currency: 'AUD',
      symbol: '$',
      currencyFull: 'Australian Dollar',
      capital: 'Tarawa'
    }, {
      flag: 'kp.svg',
      name: 'North Korea',
      code2: 'KP',
      code3: 'PRK',
      currency: 'KPW',
      symbol: '₩',
      currencyFull: 'North Korean won (inv.)',
      capital: 'Pyongyang'
    }, {
      flag: 'kr.svg',
      name: 'South Korea',
      code2: 'KR',
      code3: 'KOR',
      currency: 'KRW',
      symbol: '₩',
      currencyFull: 'South Korean won (inv.)',
      capital: 'Seoul'
    }, {
      flag: 'kw.svg',
      name: 'Kuwait',
      code2: 'KW',
      code3: 'KWT',
      currency: 'KWD',
      symbol: '',
      currencyFull: 'Kuwaiti Dinar',
      capital: 'Kuwait City'
    }, {
      flag: 'kg.svg',
      name: 'Kyrgyzstan',
      code2: 'KG',
      code3: 'KGZ',
      currency: 'KGS',
      symbol: 'лв',
      currencyFull: 'Som',
      capital: 'Bishkek'
    }, {
      flag: 'la.svg',
      name: 'Laos',
      code2: 'LA',
      code3: 'LAO',
      currency: 'LAK',
      symbol: '₭',
      currencyFull: 'kip (inv.)',
      capital: 'Vientiane'
    }, {
      flag: 'lv.svg',
      name: 'Latvia',
      code2: 'LV',
      code3: 'LVA',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Riga'
    }, {
      flag: 'lb.svg',
      name: 'Lebanon',
      code2: 'LB',
      code3: 'LBN',
      currency: 'LBP',
      symbol: '£',
      currencyFull: 'Lebanese Pound',
      capital: 'Beirut'
    }, {
      flag: 'ls.svg',
      name: 'Lesotho',
      code2: 'LS',
      code3: 'LSO',
      currency: 'LSL',
      symbol: '',
      currencyFull: 'Loti',
      capital: 'Maseru'
    }, {
      flag: 'lr.svg',
      name: 'Liberia',
      code2: 'LR',
      code3: 'LBR',
      currency: 'LRD',
      symbol: '$',
      currencyFull: 'Liberian Dollar',
      capital: 'Monrovia'
    }, {
      flag: 'ly.svg',
      name: 'Libya',
      code2: 'LY',
      code3: 'LBY',
      currency: 'LYD',
      symbol: '',
      currencyFull: 'Libyan Dinar',
      capital: 'Tripoli'
    }, {
      flag: 'li.svg',
      name: 'Liechtenstein',
      code2: 'LI',
      code3: 'LIE',
      currency: 'CHF',
      symbol: 'CHF',
      currencyFull: 'Swiss Franc',
      capital: 'Vaduz'
    }, {
      flag: 'lt.svg',
      name: 'Lithuania',
      code2: 'LT',
      code3: 'LTU',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Vilnius'
    }, {
      flag: 'lu.svg',
      name: 'Luxembourg',
      code2: 'LU',
      code3: 'LUX',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Luxembourg'
    }, {
      flag: 'mk.svg',
      name: 'Former Yugoslav Republic of Macedonia',
      code2: 'MK',
      code3: 'MKD',
      currency: 'MKD',
      symbol: 'ден',
      currencyFull: 'denar (inv.)',
      capital: 'Skopje'
    }, {
      flag: 'mg.svg',
      name: 'Madagascar',
      code2: 'MG',
      code3: 'MDG',
      currency: 'MGA',
      symbol: '',
      currencyFull: 'Malagasy Ariary',
      capital: 'Antananarivo'
    }, {
      flag: 'mw.svg',
      name: 'Malawi',
      code2: 'MW',
      code3: 'MWI',
      currency: 'MWK',
      symbol: '',
      currencyFull: 'Malawi Kwacha',
      capital: 'Lilongwe'
    }, {
      flag: 'my.svg',
      name: 'Malaysia',
      code2: 'MY',
      code3: 'MYS',
      currency: 'MYR',
      symbol: 'RM',
      currencyFull: 'Malaysian Ringgit',
      capital: 'Kuala Lumpur'
    }, {
      flag: 'mv.svg',
      name: 'Maldives',
      code2: 'MV',
      code3: 'MDV',
      currency: 'MVR',
      symbol: '',
      currencyFull: 'Rufiyaa',
      capital: 'Male'
    }, {
      flag: 'ml.svg',
      name: 'Mali',
      code2: 'ML',
      code3: 'MLI',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA Franc BCEAO',
      capital: 'Bamako'
    }, {
      flag: 'mt.svg',
      name: 'Malta',
      code2: 'MT',
      code3: 'MLT',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Valletta'
    }, {
      flag: 'mh.svg',
      name: 'Marshall Islands',
      code2: 'MH',
      code3: 'MHL',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US dollar',
      capital: 'Majuro'
    }, {
      flag: 'mq.svg',
      name: 'Martinique',
      code2: 'MQ',
      code3: 'MTQ',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Fort-de-France'
    }, {
      flag: 'mr.svg',
      name: 'Mauritania',
      code2: 'MR',
      code3: 'MRT',
      currency: 'MRO',
      symbol: '',
      currencyFull: 'Ouguiya',
      capital: 'Nouakchott'
    }, {
      flag: 'mu.svg',
      name: 'Mauritius',
      code2: 'MU',
      code3: 'MUS',
      currency: 'MUR',
      symbol: '₨',
      currencyFull: 'Mauritius Rupee',
      capital: 'Port Louis'
    }, {
      flag: 'yt.svg',
      name: 'Mayotte',
      code2: 'YT',
      code3: 'MYT',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Mamoudzou'
    }, {
      flag: 'mx.svg',
      name: 'Mexico',
      code2: 'MX',
      code3: 'MEX',
      currency: 'MXN',
      symbol: '$',
      currencyFull: 'Mexican Peso',
      capital: 'Mexico City'
    }, {
      flag: 'fm.svg',
      name: 'Micronesia',
      code2: 'FM',
      code3: 'FSM',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US dollar',
      capital: 'Palikir'
    }, {
      flag: 'md.svg',
      name: 'Moldova',
      code2: 'MD',
      code3: 'MDA',
      currency: 'MDL',
      symbol: '',
      currencyFull: 'Moldovan leu (pl. lei)',
      capital: 'Chisinau'
    }, {
      flag: 'mc.svg',
      name: 'Monaco',
      code2: 'MC',
      code3: 'MCO',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Monaco'
    }, {
      flag: 'mn.svg',
      name: 'Mongolia',
      code2: 'MN',
      code3: 'MNG',
      currency: 'MNT',
      symbol: '₮',
      currencyFull: 'Tugrik',
      capital: 'Ulan Bator'
    }, {
      flag: 'ms.svg',
      name: 'Montserrat',
      code2: 'MS',
      code3: 'MSR',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'East Caribbean Dollar',
      capital: 'Plymouth'
    }, {
      flag: 'ma.svg',
      name: 'Morocco',
      code2: 'MA',
      code3: 'MAR',
      currency: 'MAD',
      symbol: '',
      currencyFull: 'Moroccan Dirham',
      capital: 'Rabat'
    }, {
      flag: 'mz.svg',
      name: 'Mozambique',
      code2: 'MZ',
      code3: 'MOZ',
      currency: 'MZN',
      symbol: 'MT',
      currencyFull: 'Mozambique Metical',
      capital: 'Maputo'
    }, {
      flag: 'mm.svg',
      name: 'Myanmar',
      code2: 'MM',
      code3: 'MMR',
      currency: 'MMK',
      symbol: '',
      currencyFull: 'Kyat',
      capital: 'Yangon'
    }, {
      flag: 'na.svg',
      name: 'Namibia',
      code2: 'NA',
      code3: 'NAM',
      currency: 'NAD',
      symbol: '$',
      currencyFull: 'Namibia Dollar',
      capital: 'Windhoek'
    }, {
      flag: 'nr.svg',
      name: 'Nauru',
      code2: 'NR',
      code3: 'NRU',
      currency: 'AUD',
      symbol: '$',
      currencyFull: 'Australian Dollar',
      capital: 'Yaren'
    }, {
      flag: 'np.svg',
      name: 'Nepal',
      code2: 'NP',
      code3: 'NPL',
      currency: 'NPR',
      symbol: '₨',
      currencyFull: 'Nepalese Rupee',
      capital: 'Kathmandu'
    }, {
      flag: 'nl.svg',
      name: 'Netherlands',
      code2: 'NL',
      code3: 'NLD',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'euro',
      capital: 'Amsterdam'
    }, {
      flag: 'an.svg',
      name: 'Netherlands Antilles',
      code2: 'AN',
      code3: 'ANT',
      currency: 'ANG',
      symbol: 'ƒ',
      currencyFull: 'Netherlands Antillean guilder',
      capital: 'Willemstad'
    }, {
      flag: 'nc.svg',
      name: 'New Caledonia',
      code2: 'NC',
      code3: 'NCL',
      currency: 'XPF',
      symbol: '',
      currencyFull: 'CFP Franc',
      capital: 'Noumea'
    }, {
      flag: 'nz.svg',
      name: 'New Zealand',
      code2: 'NZ',
      code3: 'NZL',
      currency: 'NZD',
      symbol: '$',
      currencyFull: 'New Zealand Dollar',
      capital: 'Wellington'
    }, {
      flag: 'ni.svg',
      name: 'Nicaragua',
      code2: 'NI',
      code3: 'NIC',
      currency: 'NIO',
      symbol: 'C$',
      currencyFull: 'Cordoba Oro',
      capital: 'Managua'
    }, {
      flag: 'ne.svg',
      name: 'Niger',
      code2: 'NE',
      code3: 'NER',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA franc',
      capital: 'Niamey'
    }, {
      flag: 'ng.svg',
      name: 'Nigeria',
      code2: 'NG',
      code3: 'NGA',
      currency: 'NGN',
      symbol: '₦',
      currencyFull: 'Naira',
      capital: 'Abuja'
    }, {
      flag: 'nu.svg',
      name: 'Niue',
      code2: 'NU',
      code3: 'NIU',
      currency: 'NZD',
      symbol: '$',
      currencyFull: 'New Zealand Dollar',
      capital: 'Alofi'
    }, {
      flag: 'nf.svg',
      name: 'Norfolk Island',
      code2: 'NF',
      code3: 'NFK',
      currency: 'AUD',
      symbol: '$',
      currencyFull: 'Australian Dollar',
      capital: 'Kingston'
    }, {
      flag: 'mp.svg',
      name: 'Northern Marianas',
      code2: 'MP',
      code3: 'MNP',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US dollar',
      capital: 'Garapan'
    }, {
      flag: 'no.svg',
      name: 'Norway',
      code2: 'NO',
      code3: 'NOR',
      currency: 'NOK',
      symbol: 'kr',
      currencyFull: 'Norwegian Krone',
      capital: 'Oslo'
    }, {
      flag: 'om.svg',
      name: 'Oman',
      code2: 'OM',
      code3: 'OMN',
      currency: 'OMR',
      symbol: '﷼',
      currencyFull: 'Rial Omani',
      capital: 'Muscat'
    }, {
      flag: 'pk.svg',
      name: 'Pakistan',
      code2: 'PK',
      code3: 'PAK',
      currency: 'PKR',
      symbol: '₨',
      currencyFull: 'Pakistan Rupee',
      capital: 'Islamabad'
    }, {
      flag: 'pw.svg',
      name: 'Palau',
      code2: 'PW',
      code3: 'PLW',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US Dollar',
      capital: 'Koror'
    }, {
      flag: 'pa.svg',
      name: 'Panama',
      code2: 'PA',
      code3: 'PAN',
      currency: 'PAB',
      symbol: 'B/.',
      currencyFull: 'Balboa',
      capital: 'Panama City'
    }, {
      flag: 'pg.svg',
      name: 'Papua New Guinea',
      code2: 'PG',
      code3: 'PNG',
      currency: 'PGK',
      symbol: '',
      currencyFull: 'Kina',
      capital: 'Port Moresby'
    }, {
      flag: 'py.svg',
      name: 'Paraguay',
      code2: 'PY',
      code3: 'PRY',
      currency: 'PYG',
      symbol: 'Gs',
      currencyFull: 'Guarani',
      capital: 'Asuncion'
    }, {
      flag: 'pe.svg',
      name: 'Peru',
      code2: 'PE',
      code3: 'PER',
      currency: 'PEN',
      symbol: 'S/.',
      currencyFull: 'Sol',
      capital: 'Lima'
    }, {
      flag: 'ph.svg',
      name: 'Philippines',
      code2: 'PH',
      code3: 'PHL',
      currency: 'PHP',
      symbol: '₱',
      currencyFull: 'Philippine peso',
      capital: 'Manila'
    }, {
      flag: 'pn.svg',
      name: 'Pitcairn Islands',
      code2: 'PN',
      code3: 'PCN',
      currency: 'NZD',
      symbol: '$',
      currencyFull: 'New Zealand Dollar',
      capital: 'Adamstown'
    }, {
      flag: 'pl.svg',
      name: 'Poland',
      code2: 'PL',
      code3: 'POL',
      currency: 'PLN',
      symbol: 'zł',
      currencyFull: 'Zloty',
      capital: 'Warsaw'
    }, {
      flag: 'pt.svg',
      name: 'Portugal',
      code2: 'PT',
      code3: 'PRT',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Lisbon'
    }, {
      flag: 'pr.svg',
      name: 'Puerto Rico',
      code2: 'PR',
      code3: 'PRI',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US Dollar',
      capital: 'San Juan'
    }, {
      flag: 'qa.svg',
      name: 'Qatar',
      code2: 'QA',
      code3: 'QAT',
      currency: 'QAR',
      symbol: '﷼',
      currencyFull: 'Qatari Rial',
      capital: 'Doha'
    }, {
      flag: 're.svg',
      name: 'Reunion',
      code2: 'RE',
      code3: 'REU',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Saint-Denis'
    }, {
      flag: 'ro.svg',
      name: 'Romania',
      code2: 'RO',
      code3: 'ROU',
      currency: 'RON',
      symbol: 'lei',
      currencyFull: 'Romanian Leu',
      capital: 'Bucharest'
    }, {
      flag: 'ru.svg',
      name: 'Russia',
      code2: 'RU',
      code3: 'RUS',
      currency: 'RUB',
      symbol: '₽',
      currencyFull: 'rouble',
      capital: 'Moscow'
    }, {
      flag: 'rw.svg',
      name: 'Rwanda',
      code2: 'RW',
      code3: 'RWA',
      currency: 'RWF',
      symbol: '',
      currencyFull: 'Rwanda Franc',
      capital: 'Kigali'
    }, {
      flag: 'sh.svg',
      name: 'Saint Helena',
      code2: 'SH',
      code3: 'SHN',
      currency: 'SHP',
      symbol: '£',
      currencyFull: 'Saint Helena pound',
      capital: 'Jamestown'
    }, {
      flag: 'kn.svg',
      name: 'Saint Kitts and Nevis',
      code2: 'KN',
      code3: 'KNA',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'East Caribbean Dollar',
      capital: 'Basseterre'
    }, {
      flag: 'lc.svg',
      name: 'Saint Lucia',
      code2: 'LC',
      code3: 'LCA',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'East Caribbean Dollar',
      capital: 'Castries'
    }, {
      flag: 'pm.svg',
      name: 'Saint Pierre and Miquelon',
      code2: 'PM',
      code3: 'SPM',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Saint-Pierre'
    }, {
      flag: 'vc.svg',
      name: 'Saint Vincent and the Grenadines',
      code2: 'VC',
      code3: 'VCT',
      currency: 'XCD',
      symbol: '$',
      currencyFull: 'Eastern Caribbean dollar',
      capital: 'Kingstown'
    }, {
      flag: 'ws.svg',
      name: 'Samoa',
      code2: 'WS',
      code3: 'WSM',
      currency: 'WST',
      symbol: '',
      currencyFull: 'Tala',
      capital: 'Apia'
    }, {
      flag: 'sm.svg',
      name: 'San Marino',
      code2: 'SM',
      code3: 'SMR',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'San Marino'
    }, {
      flag: 'st.svg',
      name: 'Sao tome and principle',
      code2: 'ST',
      code3: 'STP',
      currency: 'STD',
      symbol: '',
      currencyFull: 'Dobra',
      capital: 'Sao Tome & Principe Dobra'
    }, {
      flag: 'sa.svg',
      name: 'Saudi Arabia',
      code2: 'SA',
      code3: 'SAU',
      currency: 'SAR',
      symbol: '﷼',
      currencyFull: 'Saudi Riyal',
      capital: 'Riyadh'
    }, {
      flag: 'sn.svg',
      name: 'Senegal',
      code2: 'SN',
      code3: 'SEN',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA Franc BCEAO',
      capital: 'Dakar'
    }, {
      flag: 'rs.svg',
      name: 'Serbia',
      code2: 'RS',
      code3: 'SRB',
      currency: 'RSD',
      symbol: 'Дин.',
      currencyFull: 'Serbian Dinar',
      capital: 'Belgrade'
    }, {
      flag: 'sc.svg',
      name: 'Seychelles',
      code2: 'SC',
      code3: 'SYC',
      currency: 'SCR',
      symbol: '₨',
      currencyFull: 'Seychelles Rupee',
      capital: 'Victoria'
    }, {
      flag: 'sl.svg',
      name: 'Sierra Leone',
      code2: 'SL',
      code3: 'SLE',
      currency: 'SLL',
      symbol: '',
      currencyFull: 'Leone',
      capital: 'Freetown'
    }, {
      flag: 'sg.svg',
      name: 'Singapore',
      code2: 'SG',
      code3: 'SGP',
      currency: 'SGD',
      symbol: '$',
      currencyFull: 'Singapore Dollar',
      capital: 'Singapore'
    }, {
      flag: 'sk.svg',
      name: 'Slovakia',
      code2: 'SK',
      code3: 'SVK',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Bratislava'
    }, {
      flag: 'si.svg',
      name: 'Slovenia',
      code2: 'SI',
      code3: 'SVN',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Ljubljana'
    }, {
      flag: 'sb.svg',
      name: 'Solomon Islands',
      code2: 'SB',
      code3: 'SLB',
      currency: 'SBD',
      symbol: '$',
      currencyFull: 'Solomon Islands Dollar',
      capital: 'Honiara'
    }, {
      flag: 'so.svg',
      name: 'Somalia',
      code2: 'SO',
      code3: 'SOM',
      currency: 'SOS',
      symbol: 'S',
      currencyFull: 'Somali Shilling',
      capital: 'Mogadishu'
    }, {
      flag: 'za.svg',
      name: 'South Africa',
      code2: 'ZA',
      code3: 'ZAF',
      currency: 'ZAR',
      symbol: 'R',
      currencyFull: 'Rand',
      capital: 'Pretoria'
    }, {
      flag: 'ss.svg',
      name: 'South Sudan',
      code2: 'SS',
      code3: 'SSD',
      currency: 'SSP',
      symbol: '',
      currencyFull: 'South Sudanese Pound',
      capital: 'Juba'
    }, {
      flag: 'es.svg',
      name: 'Spain',
      code2: 'ES',
      code3: 'ESP',
      currency: 'EUR',
      symbol: '€',
      currencyFull: 'Euro',
      capital: 'Madrid'
    }, {
      flag: 'lk.svg',
      name: 'Sri Lanka',
      code2: 'LK',
      code3: 'LKA',
      currency: 'LKR',
      symbol: '₨',
      currencyFull: 'Sri Lanka Rupee',
      capital: 'Colombo'
    }, {
      flag: 'sd.svg',
      name: 'Sudan',
      code2: 'SD',
      code3: 'SDN',
      currency: 'SDD',
      symbol: '',
      currencyFull: 'Sudanese dinar',
      capital: 'Khartoum'
    }, {
      flag: 'sr.svg',
      name: 'Suriname',
      code2: 'SR',
      code3: 'SUR',
      currency: 'SRD',
      symbol: '$',
      currencyFull: 'Surinam Dollar',
      capital: 'Paramaribo'
    }, {
      flag: 'sj.svg',
      name: 'Svalbard and Jan Mayen',
      code2: 'SJ',
      code3: 'SJM',
      currency: 'NOK',
      symbol: 'kr',
      currencyFull: 'Norwegian krone (pl. kroner)',
      capital: 'Longyearbyen'
    }, {
      flag: 'sz.svg',
      name: 'Swaziland',
      code2: 'SZ',
      code3: 'SWZ',
      currency: 'SZL',
      symbol: '',
      currencyFull: 'Lilangeni',
      capital: 'Mbabane'
    }, {
      flag: 'se.svg',
      name: 'Sweden',
      code2: 'SE',
      code3: 'SWE',
      currency: 'SEK',
      symbol: 'kr',
      currencyFull: 'Swedish Krona',
      capital: 'Stockholm'
    }, {
      flag: 'ch.svg',
      name: 'Switzerland',
      code2: 'CH',
      code3: 'CHE',
      currency: 'CHF',
      symbol: 'CHF',
      currencyFull: 'Swiss Franc',
      capital: 'Berne'
    }, {
      flag: 'sy.svg',
      name: 'Syria',
      code2: 'SY',
      code3: 'SYR',
      currency: 'SYP',
      symbol: '£',
      currencyFull: 'Syrian pound',
      capital: 'Damascus'
    }, {
      flag: 'tw.svg',
      name: 'Taiwan',
      code2: 'TW',
      code3: 'TWN',
      currency: 'TWD',
      symbol: 'NT$',
      currencyFull: 'new Taiwan dollar',
      capital: 'Taipei'
    }, {
      flag: 'tj.svg',
      name: 'Tajikistan',
      code2: 'TJ',
      code3: 'TJK',
      currency: 'TJS',
      symbol: '',
      currencyFull: 'Somoni',
      capital: 'Dushanbe'
    }, {
      flag: 'tz.svg',
      name: 'Tanzania',
      code2: 'TZ',
      code3: 'TZA',
      currency: 'TZS',
      symbol: '',
      currencyFull: 'Tanzanian Shilling',
      capital: 'Dodoma'
    }, {
      flag: 'th.svg',
      name: 'Thailand',
      code2: 'TH',
      code3: 'THA',
      currency: 'THB',
      symbol: '฿',
      currencyFull: 'Baht',
      capital: 'Bangkok'
    }, {
      flag: 'tl.svg',
      name: 'Timor-Leste',
      code2: 'TL',
      code3: 'TLS',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US Dollar',
      capital: 'Dili'
    }, {
      flag: 'tg.svg',
      name: 'Togo',
      code2: 'TG',
      code3: 'TGO',
      currency: 'XOF',
      symbol: '',
      currencyFull: 'CFA Franc BCEAO',
      capital: 'Lome'
    }, {
      flag: 'tk.svg',
      name: 'Tokelau',
      code2: 'TK',
      code3: 'TKL',
      currency: 'NZD',
      symbol: '$',
      currencyFull: 'New Zealand Dollar',
      capital: 'Fakaofo'
    }, {
      flag: 'to.svg',
      name: 'Tonga',
      code2: 'TO',
      code3: 'TON',
      currency: 'TOP',
      symbol: '',
      currencyFull: 'Pa__anga',
      capital: 'Nuku\'alofa'
    }, {
      flag: 'tt.svg',
      name: 'Trinidad and Tobago',
      code2: 'TT',
      code3: 'TTO',
      currency: 'TTD',
      symbol: 'TT$',
      currencyFull: 'Trinidad and Tobago Dollar',
      capital: 'Port of Spain'
    }, {
      flag: 'tn.svg',
      name: 'Tunisia',
      code2: 'TN',
      code3: 'TUN',
      currency: 'TND',
      symbol: '',
      currencyFull: 'Tunisian Dinar',
      capital: 'Tunis'
    }, {
      flag: 'tr.svg',
      name: 'Turkey',
      code2: 'TR',
      code3: 'TUR',
      currency: 'TRY',
      symbol: '₺',
      currencyFull: 'Turkish Lira',
      capital: 'Ankara'
    }, {
      flag: 'tm.svg',
      name: 'Turkmenistan',
      code2: 'TM',
      code3: 'TKM',
      currency: 'TMT',
      symbol: '',
      currencyFull: 'Turkmenistan New Manat',
      capital: 'Ashgabat'
    }, {
      flag: 'tc.svg',
      name: 'Turks and Caicos Islands',
      code2: 'TC',
      code3: 'TCA',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US dollar',
      capital: 'Cockburn Town'
    }, {
      flag: 'tv.svg',
      name: 'Tuvalu',
      code2: 'TV',
      code3: 'TUV',
      currency: 'AUD',
      symbol: '$',
      currencyFull: 'Australian Dollar',
      capital: 'Fongafale'
    }, {
      flag: 'ug.svg',
      name: 'Uganda',
      code2: 'UG',
      code3: 'UGA',
      currency: 'UGX',
      symbol: '',
      currencyFull: 'Uganda Shilling',
      capital: 'Kampala'
    }, {
      flag: 'ua.svg',
      name: 'Ukraine',
      code2: 'UA',
      code3: 'UKR',
      currency: 'UAH',
      symbol: '₴',
      currencyFull: 'Hryvnia',
      capital: 'Kiev'
    }, {
      flag: 'ae.svg',
      name: 'United Arab Emirates',
      code2: 'AE',
      code3: 'ARE',
      currency: 'AED',
      symbol: '',
      currencyFull: 'UAE dirham',
      capital: 'Abu Dhabi'
    }, {
      flag: 'gb.svg',
      name: 'United Kingdom',
      code2: 'GB',
      code3: 'GBR',
      currency: 'GBP',
      symbol: '£',
      currencyFull: 'pound sterling',
      capital: 'London'
    }, {
      flag: 'us.svg',
      name: 'United States',
      code2: 'US',
      code3: 'USA',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US dollar',
      capital: 'Washington DC'
    }, {
      flag: 'uy.svg',
      name: 'Uruguay',
      code2: 'UY',
      code3: 'URY',
      currency: 'UYU',
      symbol: '$U',
      currencyFull: 'Peso Uruguayo',
      capital: 'Montevideo'
    }, {
      flag: 'uz.svg',
      name: 'Uzbekistan',
      code2: 'UZ',
      code3: 'UZB',
      currency: 'UZS',
      symbol: 'лв',
      currencyFull: 'Uzbekistan Sum',
      capital: 'Tashkent'
    }, {
      flag: 'vu.svg',
      name: 'Vanuatu',
      code2: 'VU',
      code3: 'VUT',
      currency: 'VUV',
      symbol: '',
      currencyFull: 'Vatu',
      capital: 'Port Vila'
    }, {
      flag: 've.svg',
      name: 'Venezuela',
      code2: 'VE',
      code3: 'VEN',
      currency: 'VEB',
      symbol: '',
      currencyFull: 'bolivar',
      capital: 'Caracas'
    }, {
      flag: 'vn.svg',
      name: 'Vietnam',
      code2: 'VN',
      code3: 'VNM',
      currency: 'VND',
      symbol: '₫',
      currencyFull: 'dong',
      capital: 'Hanoi'
    }, {
      flag: 'vi.svg',
      name: 'US Virgin Islands',
      code2: 'VI',
      code3: 'VIR',
      currency: 'USD',
      symbol: '$',
      currencyFull: 'US dollar',
      capital: 'Charlotte Amalie'
    }, {
      flag: 'wf.svg',
      name: 'Wallis and Futuna',
      code2: 'WF',
      code3: 'WLF',
      currency: 'XPF',
      symbol: '',
      currencyFull: 'CFP franc',
      capital: 'Mata-Utu'
    }, {
      flag: 'eh.svg',
      name: 'Western Sahara',
      code2: 'EH',
      code3: 'ESH',
      currency: 'MAD',
      symbol: '',
      currencyFull: 'Moroccan Dirham',
      capital: 'Al aaiun'
    }, {
      flag: 'ye.svg',
      name: 'Yemen',
      code2: 'YE',
      code3: 'YEM',
      currency: 'YER',
      symbol: '﷼',
      currencyFull: 'Yemeni Rial',
      capital: 'San\'a'
    }, {
      flag: 'zm.svg',
      name: 'Zambia',
      code2: 'ZM',
      code3: 'ZMB',
      currency: 'ZMW',
      symbol: '',
      currencyFull: 'Zambian Kwacha',
      capital: 'Lusaka'
    }, {
      flag: 'zw.svg',
      name: 'Zimbabwe',
      code2: 'ZW',
      code3: 'ZWE',
      currency: 'ZWL',
      symbol: '',
      currencyFull: 'Zimbabwe Dollar',
      capital: 'Harare'
    }],
    byCode3: {
      AFG: {
        flag: 'af.svg',
        name: 'Afghanistan',
        code2: 'AF',
        code3: 'AFG',
        currency: 'AFN',
        symbol: '؋',
        currencyFull: 'Afghani',
        capital: 'Kabul'
      },
      ALB: {
        flag: 'al.svg',
        name: 'Albania',
        code2: 'AL',
        code3: 'ALB',
        currency: 'ALL',
        symbol: 'Lek',
        currencyFull: 'Lek',
        capital: 'Tirana'
      },
      DZA: {
        flag: 'dz.svg',
        name: 'Algeria',
        code2: 'DZ',
        code3: 'DZA',
        currency: 'DZD',
        symbol: '',
        currencyFull: 'Algerian Dinar',
        capital: 'Algiers'
      },
      ASM: {
        flag: 'as.svg',
        name: 'American Samoa',
        code2: 'AS',
        code3: 'ASM',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Pago Pago'
      },
      AND: {
        flag: 'ad.svg',
        name: 'Andorra',
        code2: 'AD',
        code3: 'AND',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Andorra la Vella'
      },
      AGO: {
        flag: 'ao.svg',
        name: 'Angola',
        code2: 'AO',
        code3: 'AGO',
        currency: 'AOA',
        symbol: '',
        currencyFull: 'Kwanza',
        capital: 'Luanda'
      },
      AIA: {
        flag: 'ai.svg',
        name: 'Anguilla',
        code2: 'AI',
        code3: 'AIA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'The Valley'
      },
      ATG: {
        flag: 'ag.svg',
        name: 'Antigua and Barbuda',
        code2: 'AG',
        code3: 'ATG',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'St John\'s'
      },
      ARG: {
        flag: 'ar.svg',
        name: 'Argentina',
        code2: 'AR',
        code3: 'ARG',
        currency: 'ARS',
        symbol: '$',
        currencyFull: 'Argentine Peso',
        capital: 'Buenos Aires'
      },
      ARM: {
        flag: 'am.svg',
        name: 'Armenia',
        code2: 'AM',
        code3: 'ARM',
        currency: 'AMD',
        symbol: '',
        currencyFull: 'Armenian Dram',
        capital: 'Yerevan'
      },
      ABW: {
        flag: 'aw.svg',
        name: 'Aruba',
        code2: 'AW',
        code3: 'ABW',
        currency: 'AWG',
        symbol: 'ƒ',
        currencyFull: 'Aruban Florin',
        capital: 'Oranjestad'
      },
      AUS: {
        flag: 'au.svg',
        name: 'Australia',
        code2: 'AU',
        code3: 'AUS',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Canberra'
      },
      AUT: {
        flag: 'at.svg',
        name: 'Austria',
        code2: 'AT',
        code3: 'AUT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Vienna'
      },
      AZE: {
        flag: 'az.svg',
        name: 'Azerbaijan',
        code2: 'AZ',
        code3: 'AZE',
        currency: 'AZN',
        symbol: '₼',
        currencyFull: 'Azerbaijan Manat',
        capital: 'Baku'
      },
      BHS: {
        flag: 'bs.svg',
        name: 'The Bahamas',
        code2: 'BS',
        code3: 'BHS',
        currency: 'BSD',
        symbol: '$',
        currencyFull: 'Bahamian Dollar',
        capital: 'Nassau'
      },
      BHR: {
        flag: 'bh.svg',
        name: 'Bahrain',
        code2: 'BH',
        code3: 'BHR',
        currency: 'BHD',
        symbol: '',
        currencyFull: 'Bahraini Dinar',
        capital: 'Manama'
      },
      BGD: {
        flag: 'bd.svg',
        name: 'Bangladesh',
        code2: 'BD',
        code3: 'BGD',
        currency: 'BDT',
        symbol: '',
        currencyFull: 'Taka',
        capital: 'Dhaka'
      },
      BRB: {
        flag: 'bb.svg',
        name: 'Barbados',
        code2: 'BB',
        code3: 'BRB',
        currency: 'BBD',
        symbol: '$',
        currencyFull: 'Barbados Dollar',
        capital: 'Bridgetown'
      },
      BLR: {
        flag: 'by.svg',
        name: 'Belarus',
        code2: 'BY',
        code3: 'BLR',
        currency: 'BYN',
        symbol: 'Br',
        currencyFull: 'Belarusian Ruble',
        capital: 'Minsk'
      },
      BEL: {
        flag: 'be.svg',
        name: 'Belgium',
        code2: 'BE',
        code3: 'BEL',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Brussels'
      },
      BLZ: {
        flag: 'bz.svg',
        name: 'Belize',
        code2: 'BZ',
        code3: 'BLZ',
        currency: 'BZD',
        symbol: 'BZ$',
        currencyFull: 'Belize Dollar',
        capital: 'Belmopan'
      },
      BEN: {
        flag: 'bj.svg',
        name: 'Benin',
        code2: 'BJ',
        code3: 'BEN',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Porto Novo'
      },
      BMU: {
        flag: 'bm.svg',
        name: 'Bermuda',
        code2: 'BM',
        code3: 'BMU',
        currency: 'BMD',
        symbol: '$',
        currencyFull: 'Bermudian Dollar',
        capital: 'Hamilton'
      },
      BTN: {
        flag: 'bt.svg',
        name: 'Bhutan',
        code2: 'BT',
        code3: 'BTN',
        currency: 'BTN',
        symbol: '',
        currencyFull: 'Indian Rupee',
        capital: 'Thimphu'
      },
      BOL: {
        flag: 'bo.svg',
        name: 'Bolivia',
        code2: 'BO',
        code3: 'BOL',
        currency: 'BOB',
        symbol: '$b',
        currencyFull: 'boliviano',
        capital: 'Sucre'
      },
      BIH: {
        flag: 'ba.svg',
        name: 'Bosnia and Herzegovina',
        code2: 'BA',
        code3: 'BIH',
        currency: 'BAM',
        symbol: 'KM',
        currencyFull: 'Convertible Mark',
        capital: 'Sarajevo'
      },
      BWA: {
        flag: 'bw.svg',
        name: 'Botswana',
        code2: 'BW',
        code3: 'BWA',
        currency: 'BWP',
        symbol: 'P',
        currencyFull: 'Pula',
        capital: 'Gaborone'
      },
      BVT: {
        flag: 'bv.svg',
        name: 'Bouvet Island',
        code2: 'BV',
        code3: 'BVT',
        currency: 'NOK',
        symbol: 'kr',
        currencyFull: 'Norwegian Krone',
        capital: '-'
      },
      BRA: {
        flag: 'br.svg',
        name: 'Brazil',
        code2: 'BR',
        code3: 'BRA',
        currency: 'BRL',
        symbol: 'R$',
        currencyFull: 'Brazilian Real',
        capital: 'Brasilia'
      },
      VGB: {
        flag: 'vg.svg',
        name: 'British Virgin Islands',
        code2: 'VG',
        code3: 'VGB',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Road Town'
      },
      BRN: {
        flag: 'bn.svg',
        name: 'Brunei',
        code2: 'BN',
        code3: 'BRN',
        currency: 'BND',
        symbol: '$',
        currencyFull: 'Brunei Dollar',
        capital: 'Bandar Seri Begawan'
      },
      BGR: {
        flag: 'bg.svg',
        name: 'Bulgaria',
        code2: 'BG',
        code3: 'BGR',
        currency: 'BGN',
        symbol: 'лв',
        currencyFull: 'Bulgarian Lev',
        capital: 'Sofia'
      },
      BFA: {
        flag: 'bf.svg',
        name: 'Burkina Faso',
        code2: 'BF',
        code3: 'BFA',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Ouagadougou'
      },
      BDI: {
        flag: 'bi.svg',
        name: 'Burundi',
        code2: 'BI',
        code3: 'BDI',
        currency: 'BIF',
        symbol: '',
        currencyFull: 'Burundi Franc',
        capital: 'Bujumbura'
      },
      KHM: {
        flag: 'kh.svg',
        name: 'Cambodia',
        code2: 'KH',
        code3: 'KHM',
        currency: 'KHR',
        symbol: '៛',
        currencyFull: 'Riel',
        capital: 'Phnom Penh'
      },
      CMR: {
        flag: 'cm.svg',
        name: 'Cameroon',
        code2: 'CM',
        code3: 'CMR',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'Yaound'
      },
      CAN: {
        flag: 'ca.svg',
        name: 'Canada',
        code2: 'CA',
        code3: 'CAN',
        currency: 'CAD',
        symbol: '$',
        currencyFull: 'Canadian Dollar',
        capital: 'Ottawa'
      },
      CPV: {
        flag: 'cv.svg',
        name: 'Cape Verde',
        code2: 'CV',
        code3: 'CPV',
        currency: 'CVE',
        symbol: '',
        currencyFull: 'Cape Verde escudo',
        capital: 'Praia'
      },
      CYM: {
        flag: 'ky.svg',
        name: 'Cayman Islands',
        code2: 'KY',
        code3: 'CYM',
        currency: 'KYD',
        symbol: '$',
        currencyFull: 'Cayman Islands dollar',
        capital: 'George Town'
      },
      CAF: {
        flag: 'cf.svg',
        name: 'Central African Republic',
        code2: 'CF',
        code3: 'CAF',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA franc',
        capital: 'Bangui'
      },
      TCD: {
        flag: 'td.svg',
        name: 'Chad',
        code2: 'TD',
        code3: 'TCD',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'N\'Djamena'
      },
      CHL: {
        flag: 'cl.svg',
        name: 'Chile',
        code2: 'CL',
        code3: 'CHL',
        currency: 'CLP',
        symbol: '$',
        currencyFull: 'Chilean Peso',
        capital: 'Santiago'
      },
      CHN: {
        flag: 'cn.svg',
        name: 'China',
        code2: 'CN',
        code3: 'CHN',
        currency: 'CNY',
        symbol: '¥',
        currencyFull: 'Yuan Renminbi',
        capital: 'Beijing'
      },
      HKG: {
        flag: 'hk.svg',
        name: 'Hong Kong',
        code2: 'HK',
        code3: 'HKG',
        currency: 'HKD',
        symbol: '$',
        currencyFull: 'Hong Kong Dollar',
        capital: 'Victoria City'
      },
      MAC: {
        flag: 'mo.svg',
        name: 'Macau',
        code2: 'MO',
        code3: 'MAC',
        currency: 'MOP',
        symbol: '',
        currencyFull: 'pataca',
        capital: 'Macau'
      },
      CXR: {
        flag: 'cx.svg',
        name: 'Christmas Island',
        code2: 'CX',
        code3: 'CXR',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Flying Fish Cove'
      },
      CCK: {
        flag: 'cc.svg',
        name: 'Cocos (Keeling) Islands',
        code2: 'CC',
        code3: 'CCK',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian dollar',
        capital: 'Bantam'
      },
      COL: {
        flag: 'co.svg',
        name: 'Colombia',
        code2: 'CO',
        code3: 'COL',
        currency: 'COP',
        symbol: '$',
        currencyFull: 'Colombian Peso',
        capital: 'Santa Fe de Bogot'
      },
      COM: {
        flag: 'km.svg',
        name: 'Comoros',
        code2: 'KM',
        code3: 'COM',
        currency: 'KMF',
        symbol: '',
        currencyFull: 'Comorian franc',
        capital: 'Moroni'
      },
      COG: {
        flag: 'cg.svg',
        name: 'Congo',
        code2: 'CG',
        code3: 'COG',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA franc',
        capital: 'Brazzaville'
      },
      COD: {
        flag: 'cd.svg',
        name: 'Democratic Republic of the Congo',
        code2: 'CD',
        code3: 'COD',
        currency: 'CDF',
        symbol: '',
        currencyFull: 'Congolese franc',
        capital: 'Kinshasa'
      },
      COK: {
        flag: 'ck.svg',
        name: 'Cook Islands',
        code2: 'CK',
        code3: 'COK',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand dollar',
        capital: 'Avarua'
      },
      CRI: {
        flag: 'cr.svg',
        name: 'Costa Rica',
        code2: 'CR',
        code3: 'CRI',
        currency: 'CRC',
        symbol: '₡',
        currencyFull: 'Costa Rican Colon',
        capital: 'San Jos'
      },
      CIV: {
        flag: 'ci.svg',
        name: 'Cote D\'Ivoire',
        code2: 'CI',
        code3: 'CIV',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Yamoussoukro'
      },
      HRV: {
        flag: 'hr.svg',
        name: 'Croatia',
        code2: 'HR',
        code3: 'HRV',
        currency: 'HRK',
        symbol: 'kn',
        currencyFull: 'Kuna',
        capital: 'Zagreb'
      },
      CUB: {
        flag: 'cu.svg',
        name: 'Cuba',
        code2: 'CU',
        code3: 'CUB',
        currency: 'CUP',
        symbol: '₱',
        currencyFull: 'Cuban Peso',
        capital: 'Havana'
      },
      CYP: {
        flag: 'cy.svg',
        name: 'Cyprus',
        code2: 'CY',
        code3: 'CYP',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Nicosia'
      },
      CZE: {
        flag: 'cz.svg',
        name: 'Czech Republic',
        code2: 'CZ',
        code3: 'CZE',
        currency: 'CZK',
        symbol: 'Kč',
        currencyFull: 'Czech koruna (pl. koruny)',
        capital: 'Prague'
      },
      DNK: {
        flag: 'dk.svg',
        name: 'Denmark',
        code2: 'DK',
        code3: 'DNK',
        currency: 'DKK',
        symbol: 'kr',
        currencyFull: 'Danish Krone',
        capital: 'Copenhagen'
      },
      DJI: {
        flag: 'dj.svg',
        name: 'Djibouti',
        code2: 'DJ',
        code3: 'DJI',
        currency: 'DJF',
        symbol: '',
        currencyFull: 'Djibouti Franc',
        capital: 'Djibouti'
      },
      DMA: {
        flag: 'dm.svg',
        name: 'Dominica',
        code2: 'DM',
        code3: 'DMA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Roseau'
      },
      DOM: {
        flag: 'do.svg',
        name: 'Dominican Republic',
        code2: 'DO',
        code3: 'DOM',
        currency: 'DOP',
        symbol: 'RD$',
        currencyFull: 'Dominican peso',
        capital: 'Santo Domingo'
      },
      ECU: {
        flag: 'ec.svg',
        name: 'Ecuador',
        code2: 'EC',
        code3: 'ECU',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Quito'
      },
      EGY: {
        flag: 'eg.svg',
        name: 'Egypt',
        code2: 'EG',
        code3: 'EGY',
        currency: 'EGP',
        symbol: '£',
        currencyFull: 'Egyptian Pound',
        capital: 'Cairo'
      },
      SLV: {
        flag: 'sv.svg',
        name: 'El Salvador',
        code2: 'SV',
        code3: 'SLV',
        currency: 'SVC',
        symbol: '$',
        currencyFull: 'El Salvador Colon',
        capital: 'San Salvador'
      },
      GNQ: {
        flag: 'gq.svg',
        name: 'Equatorial Guinea',
        code2: 'GQ',
        code3: 'GNQ',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'Malabo'
      },
      ERI: {
        flag: 'er.svg',
        name: 'Eritrea',
        code2: 'ER',
        code3: 'ERI',
        currency: 'ERN',
        symbol: '',
        currencyFull: 'Nakfa',
        capital: 'Asmara'
      },
      EST: {
        flag: 'ee.svg',
        name: 'Estonia',
        code2: 'EE',
        code3: 'EST',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Tallinn'
      },
      ETH: {
        flag: 'et.svg',
        name: 'Ethiopia',
        code2: 'ET',
        code3: 'ETH',
        currency: 'ETB',
        symbol: '',
        currencyFull: 'Ethiopian Birr',
        capital: 'Addis Ababa'
      },
      FLK: {
        flag: 'fk.svg',
        name: 'Falkland Islands',
        code2: 'FK',
        code3: 'FLK',
        currency: 'FKP',
        symbol: '£',
        currencyFull: 'Falkland Islands pound',
        capital: 'Stanley'
      },
      FRO: {
        flag: 'fo.svg',
        name: 'Faeroe Islands',
        code2: 'FO',
        code3: 'FRO',
        currency: 'DKK',
        symbol: 'kr',
        currencyFull: 'Danish krone (pl. kroner)',
        capital: 'Thorshavn'
      },
      FJI: {
        flag: 'fj.svg',
        name: 'Fiji',
        code2: 'FJ',
        code3: 'FJI',
        currency: 'FJD',
        symbol: '$',
        currencyFull: 'Fiji Dollar',
        capital: 'Suva'
      },
      FIN: {
        flag: 'fi.svg',
        name: 'Finland',
        code2: 'FI',
        code3: 'FIN',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Helsinki'
      },
      FRA: {
        flag: 'fr.svg',
        name: 'France',
        code2: 'FR',
        code3: 'FRA',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Paris'
      },
      GUF: {
        flag: 'gf.svg',
        name: 'French Guiana',
        code2: 'GF',
        code3: 'GUF',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Cayenne'
      },
      PYF: {
        flag: 'pf.svg',
        name: 'French Polynesia',
        code2: 'PF',
        code3: 'PYF',
        currency: 'XPF',
        symbol: '',
        currencyFull: 'CFP Franc',
        capital: 'Papeete'
      },
      GAB: {
        flag: 'ga.svg',
        name: 'Gabon',
        code2: 'GA',
        code3: 'GAB',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'Libreville'
      },
      GMB: {
        flag: 'gm.svg',
        name: 'The Gambia',
        code2: 'GM',
        code3: 'GMB',
        currency: 'GMD',
        symbol: '',
        currencyFull: 'dalasi (inv.)',
        capital: 'Banjul'
      },
      GEO: {
        flag: 'ge.svg',
        name: 'Georgia',
        code2: 'GE',
        code3: 'GEO',
        currency: 'GEL',
        symbol: '',
        currencyFull: 'Lari',
        capital: 'Tbilisi'
      },
      DEU: {
        flag: 'de.svg',
        name: 'Germany',
        code2: 'DE',
        code3: 'DEU',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Berlin'
      },
      GHA: {
        flag: 'gh.svg',
        name: 'Ghana',
        code2: 'GH',
        code3: 'GHA',
        currency: 'GHS',
        symbol: '¢',
        currencyFull: 'Ghana Cedi',
        capital: 'Accra'
      },
      GIB: {
        flag: 'gi.svg',
        name: 'Gibraltar',
        code2: 'GI',
        code3: 'GIB',
        currency: 'GIP',
        symbol: '£',
        currencyFull: 'Gibraltar Pound',
        capital: 'Gibraltar'
      },
      GRC: {
        flag: 'gr.svg',
        name: 'Greece',
        code2: 'GR',
        code3: 'GRC',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Athens'
      },
      GRL: {
        flag: 'gl.svg',
        name: 'Greenland',
        code2: 'GL',
        code3: 'GRL',
        currency: 'DKK',
        symbol: 'kr',
        currencyFull: 'Danish Krone',
        capital: 'Nuuk'
      },
      GRD: {
        flag: 'gd.svg',
        name: 'Grenada',
        code2: 'GD',
        code3: 'GRD',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'St George\'s'
      },
      GLP: {
        flag: 'gp.svg',
        name: 'Guadeloupe',
        code2: 'GP',
        code3: 'GLP',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Basse Terre'
      },
      GUM: {
        flag: 'gu.svg',
        name: 'Guam',
        code2: 'GU',
        code3: 'GUM',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Hagtana'
      },
      GTM: {
        flag: 'gt.svg',
        name: 'Guatemala',
        code2: 'GT',
        code3: 'GTM',
        currency: 'GTQ',
        symbol: 'Q',
        currencyFull: 'Quetzal',
        capital: 'Guatemala City'
      },
      GIN: {
        flag: 'gn.svg',
        name: 'Guinea',
        code2: 'GN',
        code3: 'GIN',
        currency: 'GNF',
        symbol: '',
        currencyFull: 'Guinean Franc',
        capital: 'Conakry'
      },
      GNB: {
        flag: 'gw.svg',
        name: 'Guinea-Bissau',
        code2: 'GW',
        code3: 'GNB',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Bissau'
      },
      GUY: {
        flag: 'gy.svg',
        name: 'Guyana',
        code2: 'GY',
        code3: 'GUY',
        currency: 'GYD',
        symbol: '$',
        currencyFull: 'Guyana Dollar',
        capital: 'Georgetown'
      },
      HTI: {
        flag: 'ht.svg',
        name: 'Haiti',
        code2: 'HT',
        code3: 'HTI',
        currency: 'HTG',
        symbol: '',
        currencyFull: 'Gourde',
        capital: 'Port-au-Prince'
      },
      VAT: {
        flag: 'va.svg',
        name: 'The Hoy See (Vatican City State)',
        code2: 'VA',
        code3: 'VAT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'euro',
        capital: 'Vatican City'
      },
      HND: {
        flag: 'hn.svg',
        name: 'Honduras',
        code2: 'HN',
        code3: 'HND',
        currency: 'HNL',
        symbol: 'L',
        currencyFull: 'Lempira',
        capital: 'Tegucigalpa'
      },
      HUN: {
        flag: 'hu.svg',
        name: 'Hungary',
        code2: 'HU',
        code3: 'HUN',
        currency: 'HUF',
        symbol: 'Ft',
        currencyFull: 'Forint',
        capital: 'Budapest'
      },
      ISL: {
        flag: 'is.svg',
        name: 'Iceland',
        code2: 'IS',
        code3: 'ISL',
        currency: 'ISK',
        symbol: 'kr',
        currencyFull: 'Iceland Krona',
        capital: 'Reykjavik'
      },
      IND: {
        flag: 'in.svg',
        name: 'India',
        code2: 'IN',
        code3: 'IND',
        currency: 'INR',
        symbol: '₹',
        currencyFull: 'Indian Rupee',
        capital: 'New Delhi'
      },
      IDN: {
        flag: 'id.svg',
        name: 'Indonesia',
        code2: 'ID',
        code3: 'IDN',
        currency: 'IDR',
        symbol: 'Rp',
        currencyFull: 'Rupiah',
        capital: 'Jakarta'
      },
      IRN: {
        flag: 'ir.svg',
        name: 'Iran',
        code2: 'IR',
        code3: 'IRN',
        currency: 'IRR',
        symbol: '﷼',
        currencyFull: 'Iranian rial',
        capital: 'Tehran'
      },
      IRQ: {
        flag: 'iq.svg',
        name: 'Iraq',
        code2: 'IQ',
        code3: 'IRQ',
        currency: 'IQD',
        symbol: '',
        currencyFull: 'Iraqi Dinar',
        capital: 'Baghdad'
      },
      IRL: {
        flag: 'ie.svg',
        name: 'Ireland',
        code2: 'IE',
        code3: 'IRL',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Dublin'
      },
      ISR: {
        flag: 'il.svg',
        name: 'Israel',
        code2: 'IL',
        code3: 'ISR',
        currency: 'ILS',
        symbol: '₪',
        currencyFull: 'New Israeli Sheqel',
        capital: 'Jerusalem'
      },
      ITA: {
        flag: 'it.svg',
        name: 'Italy',
        code2: 'IT',
        code3: 'ITA',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Rome'
      },
      JAM: {
        flag: 'jm.svg',
        name: 'Jamaica',
        code2: 'JM',
        code3: 'JAM',
        currency: 'JMD',
        symbol: 'J$',
        currencyFull: 'Jamaican Dollar',
        capital: 'Kingston'
      },
      JPN: {
        flag: 'jp.svg',
        name: 'Japan',
        code2: 'JP',
        code3: 'JPN',
        currency: 'JPY',
        symbol: '¥',
        currencyFull: 'Yen',
        capital: 'Tokyo'
      },
      JOR: {
        flag: 'jo.svg',
        name: 'Jordan',
        code2: 'JO',
        code3: 'JOR',
        currency: 'JOD',
        symbol: '',
        currencyFull: 'Jordanian Dinar',
        capital: 'Amman'
      },
      KAZ: {
        flag: 'kz.svg',
        name: 'Kazakhstan',
        code2: 'KZ',
        code3: 'KAZ',
        currency: 'KZT',
        symbol: 'лв',
        currencyFull: 'Tenge',
        capital: 'Astana'
      },
      KEN: {
        flag: 'ke.svg',
        name: 'Kenya',
        code2: 'KE',
        code3: 'KEN',
        currency: 'KES',
        symbol: '',
        currencyFull: 'Kenyan Shilling',
        capital: 'Nairobi'
      },
      KIR: {
        flag: 'ki.svg',
        name: 'Kiribati',
        code2: 'KI',
        code3: 'KIR',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Tarawa'
      },
      PRK: {
        flag: 'kp.svg',
        name: 'North Korea',
        code2: 'KP',
        code3: 'PRK',
        currency: 'KPW',
        symbol: '₩',
        currencyFull: 'North Korean won (inv.)',
        capital: 'Pyongyang'
      },
      KOR: {
        flag: 'kr.svg',
        name: 'South Korea',
        code2: 'KR',
        code3: 'KOR',
        currency: 'KRW',
        symbol: '₩',
        currencyFull: 'South Korean won (inv.)',
        capital: 'Seoul'
      },
      KWT: {
        flag: 'kw.svg',
        name: 'Kuwait',
        code2: 'KW',
        code3: 'KWT',
        currency: 'KWD',
        symbol: '',
        currencyFull: 'Kuwaiti Dinar',
        capital: 'Kuwait City'
      },
      KGZ: {
        flag: 'kg.svg',
        name: 'Kyrgyzstan',
        code2: 'KG',
        code3: 'KGZ',
        currency: 'KGS',
        symbol: 'лв',
        currencyFull: 'Som',
        capital: 'Bishkek'
      },
      LAO: {
        flag: 'la.svg',
        name: 'Laos',
        code2: 'LA',
        code3: 'LAO',
        currency: 'LAK',
        symbol: '₭',
        currencyFull: 'kip (inv.)',
        capital: 'Vientiane'
      },
      LVA: {
        flag: 'lv.svg',
        name: 'Latvia',
        code2: 'LV',
        code3: 'LVA',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Riga'
      },
      LBN: {
        flag: 'lb.svg',
        name: 'Lebanon',
        code2: 'LB',
        code3: 'LBN',
        currency: 'LBP',
        symbol: '£',
        currencyFull: 'Lebanese Pound',
        capital: 'Beirut'
      },
      LSO: {
        flag: 'ls.svg',
        name: 'Lesotho',
        code2: 'LS',
        code3: 'LSO',
        currency: 'LSL',
        symbol: '',
        currencyFull: 'Loti',
        capital: 'Maseru'
      },
      LBR: {
        flag: 'lr.svg',
        name: 'Liberia',
        code2: 'LR',
        code3: 'LBR',
        currency: 'LRD',
        symbol: '$',
        currencyFull: 'Liberian Dollar',
        capital: 'Monrovia'
      },
      LBY: {
        flag: 'ly.svg',
        name: 'Libya',
        code2: 'LY',
        code3: 'LBY',
        currency: 'LYD',
        symbol: '',
        currencyFull: 'Libyan Dinar',
        capital: 'Tripoli'
      },
      LIE: {
        flag: 'li.svg',
        name: 'Liechtenstein',
        code2: 'LI',
        code3: 'LIE',
        currency: 'CHF',
        symbol: 'CHF',
        currencyFull: 'Swiss Franc',
        capital: 'Vaduz'
      },
      LTU: {
        flag: 'lt.svg',
        name: 'Lithuania',
        code2: 'LT',
        code3: 'LTU',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Vilnius'
      },
      LUX: {
        flag: 'lu.svg',
        name: 'Luxembourg',
        code2: 'LU',
        code3: 'LUX',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Luxembourg'
      },
      MKD: {
        flag: 'mk.svg',
        name: 'Former Yugoslav Republic of Macedonia',
        code2: 'MK',
        code3: 'MKD',
        currency: 'MKD',
        symbol: 'ден',
        currencyFull: 'denar (inv.)',
        capital: 'Skopje'
      },
      MDG: {
        flag: 'mg.svg',
        name: 'Madagascar',
        code2: 'MG',
        code3: 'MDG',
        currency: 'MGA',
        symbol: '',
        currencyFull: 'Malagasy Ariary',
        capital: 'Antananarivo'
      },
      MWI: {
        flag: 'mw.svg',
        name: 'Malawi',
        code2: 'MW',
        code3: 'MWI',
        currency: 'MWK',
        symbol: '',
        currencyFull: 'Malawi Kwacha',
        capital: 'Lilongwe'
      },
      MYS: {
        flag: 'my.svg',
        name: 'Malaysia',
        code2: 'MY',
        code3: 'MYS',
        currency: 'MYR',
        symbol: 'RM',
        currencyFull: 'Malaysian Ringgit',
        capital: 'Kuala Lumpur'
      },
      MDV: {
        flag: 'mv.svg',
        name: 'Maldives',
        code2: 'MV',
        code3: 'MDV',
        currency: 'MVR',
        symbol: '',
        currencyFull: 'Rufiyaa',
        capital: 'Male'
      },
      MLI: {
        flag: 'ml.svg',
        name: 'Mali',
        code2: 'ML',
        code3: 'MLI',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Bamako'
      },
      MLT: {
        flag: 'mt.svg',
        name: 'Malta',
        code2: 'MT',
        code3: 'MLT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Valletta'
      },
      MHL: {
        flag: 'mh.svg',
        name: 'Marshall Islands',
        code2: 'MH',
        code3: 'MHL',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Majuro'
      },
      MTQ: {
        flag: 'mq.svg',
        name: 'Martinique',
        code2: 'MQ',
        code3: 'MTQ',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Fort-de-France'
      },
      MRT: {
        flag: 'mr.svg',
        name: 'Mauritania',
        code2: 'MR',
        code3: 'MRT',
        currency: 'MRO',
        symbol: '',
        currencyFull: 'Ouguiya',
        capital: 'Nouakchott'
      },
      MUS: {
        flag: 'mu.svg',
        name: 'Mauritius',
        code2: 'MU',
        code3: 'MUS',
        currency: 'MUR',
        symbol: '₨',
        currencyFull: 'Mauritius Rupee',
        capital: 'Port Louis'
      },
      MYT: {
        flag: 'yt.svg',
        name: 'Mayotte',
        code2: 'YT',
        code3: 'MYT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Mamoudzou'
      },
      MEX: {
        flag: 'mx.svg',
        name: 'Mexico',
        code2: 'MX',
        code3: 'MEX',
        currency: 'MXN',
        symbol: '$',
        currencyFull: 'Mexican Peso',
        capital: 'Mexico City'
      },
      FSM: {
        flag: 'fm.svg',
        name: 'Micronesia',
        code2: 'FM',
        code3: 'FSM',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Palikir'
      },
      MDA: {
        flag: 'md.svg',
        name: 'Moldova',
        code2: 'MD',
        code3: 'MDA',
        currency: 'MDL',
        symbol: '',
        currencyFull: 'Moldovan leu (pl. lei)',
        capital: 'Chisinau'
      },
      MCO: {
        flag: 'mc.svg',
        name: 'Monaco',
        code2: 'MC',
        code3: 'MCO',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Monaco'
      },
      MNG: {
        flag: 'mn.svg',
        name: 'Mongolia',
        code2: 'MN',
        code3: 'MNG',
        currency: 'MNT',
        symbol: '₮',
        currencyFull: 'Tugrik',
        capital: 'Ulan Bator'
      },
      MSR: {
        flag: 'ms.svg',
        name: 'Montserrat',
        code2: 'MS',
        code3: 'MSR',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Plymouth'
      },
      MAR: {
        flag: 'ma.svg',
        name: 'Morocco',
        code2: 'MA',
        code3: 'MAR',
        currency: 'MAD',
        symbol: '',
        currencyFull: 'Moroccan Dirham',
        capital: 'Rabat'
      },
      MOZ: {
        flag: 'mz.svg',
        name: 'Mozambique',
        code2: 'MZ',
        code3: 'MOZ',
        currency: 'MZN',
        symbol: 'MT',
        currencyFull: 'Mozambique Metical',
        capital: 'Maputo'
      },
      MMR: {
        flag: 'mm.svg',
        name: 'Myanmar',
        code2: 'MM',
        code3: 'MMR',
        currency: 'MMK',
        symbol: '',
        currencyFull: 'Kyat',
        capital: 'Yangon'
      },
      NAM: {
        flag: 'na.svg',
        name: 'Namibia',
        code2: 'NA',
        code3: 'NAM',
        currency: 'NAD',
        symbol: '$',
        currencyFull: 'Namibia Dollar',
        capital: 'Windhoek'
      },
      NRU: {
        flag: 'nr.svg',
        name: 'Nauru',
        code2: 'NR',
        code3: 'NRU',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Yaren'
      },
      NPL: {
        flag: 'np.svg',
        name: 'Nepal',
        code2: 'NP',
        code3: 'NPL',
        currency: 'NPR',
        symbol: '₨',
        currencyFull: 'Nepalese Rupee',
        capital: 'Kathmandu'
      },
      NLD: {
        flag: 'nl.svg',
        name: 'Netherlands',
        code2: 'NL',
        code3: 'NLD',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'euro',
        capital: 'Amsterdam'
      },
      ANT: {
        flag: 'an.svg',
        name: 'Netherlands Antilles',
        code2: 'AN',
        code3: 'ANT',
        currency: 'ANG',
        symbol: 'ƒ',
        currencyFull: 'Netherlands Antillean guilder',
        capital: 'Willemstad'
      },
      NCL: {
        flag: 'nc.svg',
        name: 'New Caledonia',
        code2: 'NC',
        code3: 'NCL',
        currency: 'XPF',
        symbol: '',
        currencyFull: 'CFP Franc',
        capital: 'Noumea'
      },
      NZL: {
        flag: 'nz.svg',
        name: 'New Zealand',
        code2: 'NZ',
        code3: 'NZL',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Wellington'
      },
      NIC: {
        flag: 'ni.svg',
        name: 'Nicaragua',
        code2: 'NI',
        code3: 'NIC',
        currency: 'NIO',
        symbol: 'C$',
        currencyFull: 'Cordoba Oro',
        capital: 'Managua'
      },
      NER: {
        flag: 'ne.svg',
        name: 'Niger',
        code2: 'NE',
        code3: 'NER',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA franc',
        capital: 'Niamey'
      },
      NGA: {
        flag: 'ng.svg',
        name: 'Nigeria',
        code2: 'NG',
        code3: 'NGA',
        currency: 'NGN',
        symbol: '₦',
        currencyFull: 'Naira',
        capital: 'Abuja'
      },
      NIU: {
        flag: 'nu.svg',
        name: 'Niue',
        code2: 'NU',
        code3: 'NIU',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Alofi'
      },
      NFK: {
        flag: 'nf.svg',
        name: 'Norfolk Island',
        code2: 'NF',
        code3: 'NFK',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Kingston'
      },
      MNP: {
        flag: 'mp.svg',
        name: 'Northern Marianas',
        code2: 'MP',
        code3: 'MNP',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Garapan'
      },
      NOR: {
        flag: 'no.svg',
        name: 'Norway',
        code2: 'NO',
        code3: 'NOR',
        currency: 'NOK',
        symbol: 'kr',
        currencyFull: 'Norwegian Krone',
        capital: 'Oslo'
      },
      OMN: {
        flag: 'om.svg',
        name: 'Oman',
        code2: 'OM',
        code3: 'OMN',
        currency: 'OMR',
        symbol: '﷼',
        currencyFull: 'Rial Omani',
        capital: 'Muscat'
      },
      PAK: {
        flag: 'pk.svg',
        name: 'Pakistan',
        code2: 'PK',
        code3: 'PAK',
        currency: 'PKR',
        symbol: '₨',
        currencyFull: 'Pakistan Rupee',
        capital: 'Islamabad'
      },
      PLW: {
        flag: 'pw.svg',
        name: 'Palau',
        code2: 'PW',
        code3: 'PLW',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Koror'
      },
      PAN: {
        flag: 'pa.svg',
        name: 'Panama',
        code2: 'PA',
        code3: 'PAN',
        currency: 'PAB',
        symbol: 'B/.',
        currencyFull: 'Balboa',
        capital: 'Panama City'
      },
      PNG: {
        flag: 'pg.svg',
        name: 'Papua New Guinea',
        code2: 'PG',
        code3: 'PNG',
        currency: 'PGK',
        symbol: '',
        currencyFull: 'Kina',
        capital: 'Port Moresby'
      },
      PRY: {
        flag: 'py.svg',
        name: 'Paraguay',
        code2: 'PY',
        code3: 'PRY',
        currency: 'PYG',
        symbol: 'Gs',
        currencyFull: 'Guarani',
        capital: 'Asuncion'
      },
      PER: {
        flag: 'pe.svg',
        name: 'Peru',
        code2: 'PE',
        code3: 'PER',
        currency: 'PEN',
        symbol: 'S/.',
        currencyFull: 'Sol',
        capital: 'Lima'
      },
      PHL: {
        flag: 'ph.svg',
        name: 'Philippines',
        code2: 'PH',
        code3: 'PHL',
        currency: 'PHP',
        symbol: '₱',
        currencyFull: 'Philippine peso',
        capital: 'Manila'
      },
      PCN: {
        flag: 'pn.svg',
        name: 'Pitcairn Islands',
        code2: 'PN',
        code3: 'PCN',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Adamstown'
      },
      POL: {
        flag: 'pl.svg',
        name: 'Poland',
        code2: 'PL',
        code3: 'POL',
        currency: 'PLN',
        symbol: 'zł',
        currencyFull: 'Zloty',
        capital: 'Warsaw'
      },
      PRT: {
        flag: 'pt.svg',
        name: 'Portugal',
        code2: 'PT',
        code3: 'PRT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Lisbon'
      },
      PRI: {
        flag: 'pr.svg',
        name: 'Puerto Rico',
        code2: 'PR',
        code3: 'PRI',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'San Juan'
      },
      QAT: {
        flag: 'qa.svg',
        name: 'Qatar',
        code2: 'QA',
        code3: 'QAT',
        currency: 'QAR',
        symbol: '﷼',
        currencyFull: 'Qatari Rial',
        capital: 'Doha'
      },
      REU: {
        flag: 're.svg',
        name: 'Reunion',
        code2: 'RE',
        code3: 'REU',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Saint-Denis'
      },
      ROU: {
        flag: 'ro.svg',
        name: 'Romania',
        code2: 'RO',
        code3: 'ROU',
        currency: 'RON',
        symbol: 'lei',
        currencyFull: 'Romanian Leu',
        capital: 'Bucharest'
      },
      RUS: {
        flag: 'ru.svg',
        name: 'Russia',
        code2: 'RU',
        code3: 'RUS',
        currency: 'RUB',
        symbol: '₽',
        currencyFull: 'rouble',
        capital: 'Moscow'
      },
      RWA: {
        flag: 'rw.svg',
        name: 'Rwanda',
        code2: 'RW',
        code3: 'RWA',
        currency: 'RWF',
        symbol: '',
        currencyFull: 'Rwanda Franc',
        capital: 'Kigali'
      },
      SHN: {
        flag: 'sh.svg',
        name: 'Saint Helena',
        code2: 'SH',
        code3: 'SHN',
        currency: 'SHP',
        symbol: '£',
        currencyFull: 'Saint Helena pound',
        capital: 'Jamestown'
      },
      KNA: {
        flag: 'kn.svg',
        name: 'Saint Kitts and Nevis',
        code2: 'KN',
        code3: 'KNA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Basseterre'
      },
      LCA: {
        flag: 'lc.svg',
        name: 'Saint Lucia',
        code2: 'LC',
        code3: 'LCA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Castries'
      },
      SPM: {
        flag: 'pm.svg',
        name: 'Saint Pierre and Miquelon',
        code2: 'PM',
        code3: 'SPM',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Saint-Pierre'
      },
      VCT: {
        flag: 'vc.svg',
        name: 'Saint Vincent and the Grenadines',
        code2: 'VC',
        code3: 'VCT',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'Eastern Caribbean dollar',
        capital: 'Kingstown'
      },
      WSM: {
        flag: 'ws.svg',
        name: 'Samoa',
        code2: 'WS',
        code3: 'WSM',
        currency: 'WST',
        symbol: '',
        currencyFull: 'Tala',
        capital: 'Apia'
      },
      SMR: {
        flag: 'sm.svg',
        name: 'San Marino',
        code2: 'SM',
        code3: 'SMR',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'San Marino'
      },
      STP: {
        flag: 'st.svg',
        name: 'Sao tome and principle',
        code2: 'ST',
        code3: 'STP',
        currency: 'STD',
        symbol: '',
        currencyFull: 'Dobra',
        capital: 'Sao Tome & Principe Dobra'
      },
      SAU: {
        flag: 'sa.svg',
        name: 'Saudi Arabia',
        code2: 'SA',
        code3: 'SAU',
        currency: 'SAR',
        symbol: '﷼',
        currencyFull: 'Saudi Riyal',
        capital: 'Riyadh'
      },
      SEN: {
        flag: 'sn.svg',
        name: 'Senegal',
        code2: 'SN',
        code3: 'SEN',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Dakar'
      },
      SRB: {
        flag: 'rs.svg',
        name: 'Serbia',
        code2: 'RS',
        code3: 'SRB',
        currency: 'RSD',
        symbol: 'Дин.',
        currencyFull: 'Serbian Dinar',
        capital: 'Belgrade'
      },
      SYC: {
        flag: 'sc.svg',
        name: 'Seychelles',
        code2: 'SC',
        code3: 'SYC',
        currency: 'SCR',
        symbol: '₨',
        currencyFull: 'Seychelles Rupee',
        capital: 'Victoria'
      },
      SLE: {
        flag: 'sl.svg',
        name: 'Sierra Leone',
        code2: 'SL',
        code3: 'SLE',
        currency: 'SLL',
        symbol: '',
        currencyFull: 'Leone',
        capital: 'Freetown'
      },
      SGP: {
        flag: 'sg.svg',
        name: 'Singapore',
        code2: 'SG',
        code3: 'SGP',
        currency: 'SGD',
        symbol: '$',
        currencyFull: 'Singapore Dollar',
        capital: 'Singapore'
      },
      SVK: {
        flag: 'sk.svg',
        name: 'Slovakia',
        code2: 'SK',
        code3: 'SVK',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Bratislava'
      },
      SVN: {
        flag: 'si.svg',
        name: 'Slovenia',
        code2: 'SI',
        code3: 'SVN',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Ljubljana'
      },
      SLB: {
        flag: 'sb.svg',
        name: 'Solomon Islands',
        code2: 'SB',
        code3: 'SLB',
        currency: 'SBD',
        symbol: '$',
        currencyFull: 'Solomon Islands Dollar',
        capital: 'Honiara'
      },
      SOM: {
        flag: 'so.svg',
        name: 'Somalia',
        code2: 'SO',
        code3: 'SOM',
        currency: 'SOS',
        symbol: 'S',
        currencyFull: 'Somali Shilling',
        capital: 'Mogadishu'
      },
      ZAF: {
        flag: 'za.svg',
        name: 'South Africa',
        code2: 'ZA',
        code3: 'ZAF',
        currency: 'ZAR',
        symbol: 'R',
        currencyFull: 'Rand',
        capital: 'Pretoria'
      },
      SSD: {
        flag: 'ss.svg',
        name: 'South Sudan',
        code2: 'SS',
        code3: 'SSD',
        currency: 'SSP',
        symbol: '',
        currencyFull: 'South Sudanese Pound',
        capital: 'Juba'
      },
      ESP: {
        flag: 'es.svg',
        name: 'Spain',
        code2: 'ES',
        code3: 'ESP',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Madrid'
      },
      LKA: {
        flag: 'lk.svg',
        name: 'Sri Lanka',
        code2: 'LK',
        code3: 'LKA',
        currency: 'LKR',
        symbol: '₨',
        currencyFull: 'Sri Lanka Rupee',
        capital: 'Colombo'
      },
      SDN: {
        flag: 'sd.svg',
        name: 'Sudan',
        code2: 'SD',
        code3: 'SDN',
        currency: 'SDD',
        symbol: '',
        currencyFull: 'Sudanese dinar',
        capital: 'Khartoum'
      },
      SUR: {
        flag: 'sr.svg',
        name: 'Suriname',
        code2: 'SR',
        code3: 'SUR',
        currency: 'SRD',
        symbol: '$',
        currencyFull: 'Surinam Dollar',
        capital: 'Paramaribo'
      },
      SJM: {
        flag: 'sj.svg',
        name: 'Svalbard and Jan Mayen',
        code2: 'SJ',
        code3: 'SJM',
        currency: 'NOK',
        symbol: 'kr',
        currencyFull: 'Norwegian krone (pl. kroner)',
        capital: 'Longyearbyen'
      },
      SWZ: {
        flag: 'sz.svg',
        name: 'Swaziland',
        code2: 'SZ',
        code3: 'SWZ',
        currency: 'SZL',
        symbol: '',
        currencyFull: 'Lilangeni',
        capital: 'Mbabane'
      },
      SWE: {
        flag: 'se.svg',
        name: 'Sweden',
        code2: 'SE',
        code3: 'SWE',
        currency: 'SEK',
        symbol: 'kr',
        currencyFull: 'Swedish Krona',
        capital: 'Stockholm'
      },
      CHE: {
        flag: 'ch.svg',
        name: 'Switzerland',
        code2: 'CH',
        code3: 'CHE',
        currency: 'CHF',
        symbol: 'CHF',
        currencyFull: 'Swiss Franc',
        capital: 'Berne'
      },
      SYR: {
        flag: 'sy.svg',
        name: 'Syria',
        code2: 'SY',
        code3: 'SYR',
        currency: 'SYP',
        symbol: '£',
        currencyFull: 'Syrian pound',
        capital: 'Damascus'
      },
      TWN: {
        flag: 'tw.svg',
        name: 'Taiwan',
        code2: 'TW',
        code3: 'TWN',
        currency: 'TWD',
        symbol: 'NT$',
        currencyFull: 'new Taiwan dollar',
        capital: 'Taipei'
      },
      TJK: {
        flag: 'tj.svg',
        name: 'Tajikistan',
        code2: 'TJ',
        code3: 'TJK',
        currency: 'TJS',
        symbol: '',
        currencyFull: 'Somoni',
        capital: 'Dushanbe'
      },
      TZA: {
        flag: 'tz.svg',
        name: 'Tanzania',
        code2: 'TZ',
        code3: 'TZA',
        currency: 'TZS',
        symbol: '',
        currencyFull: 'Tanzanian Shilling',
        capital: 'Dodoma'
      },
      THA: {
        flag: 'th.svg',
        name: 'Thailand',
        code2: 'TH',
        code3: 'THA',
        currency: 'THB',
        symbol: '฿',
        currencyFull: 'Baht',
        capital: 'Bangkok'
      },
      TLS: {
        flag: 'tl.svg',
        name: 'Timor-Leste',
        code2: 'TL',
        code3: 'TLS',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Dili'
      },
      TGO: {
        flag: 'tg.svg',
        name: 'Togo',
        code2: 'TG',
        code3: 'TGO',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Lome'
      },
      TKL: {
        flag: 'tk.svg',
        name: 'Tokelau',
        code2: 'TK',
        code3: 'TKL',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Fakaofo'
      },
      TON: {
        flag: 'to.svg',
        name: 'Tonga',
        code2: 'TO',
        code3: 'TON',
        currency: 'TOP',
        symbol: '',
        currencyFull: 'Pa__anga',
        capital: 'Nuku\'alofa'
      },
      TTO: {
        flag: 'tt.svg',
        name: 'Trinidad and Tobago',
        code2: 'TT',
        code3: 'TTO',
        currency: 'TTD',
        symbol: 'TT$',
        currencyFull: 'Trinidad and Tobago Dollar',
        capital: 'Port of Spain'
      },
      TUN: {
        flag: 'tn.svg',
        name: 'Tunisia',
        code2: 'TN',
        code3: 'TUN',
        currency: 'TND',
        symbol: '',
        currencyFull: 'Tunisian Dinar',
        capital: 'Tunis'
      },
      TUR: {
        flag: 'tr.svg',
        name: 'Turkey',
        code2: 'TR',
        code3: 'TUR',
        currency: 'TRY',
        symbol: '₺',
        currencyFull: 'Turkish Lira',
        capital: 'Ankara'
      },
      TKM: {
        flag: 'tm.svg',
        name: 'Turkmenistan',
        code2: 'TM',
        code3: 'TKM',
        currency: 'TMT',
        symbol: '',
        currencyFull: 'Turkmenistan New Manat',
        capital: 'Ashgabat'
      },
      TCA: {
        flag: 'tc.svg',
        name: 'Turks and Caicos Islands',
        code2: 'TC',
        code3: 'TCA',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Cockburn Town'
      },
      TUV: {
        flag: 'tv.svg',
        name: 'Tuvalu',
        code2: 'TV',
        code3: 'TUV',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Fongafale'
      },
      UGA: {
        flag: 'ug.svg',
        name: 'Uganda',
        code2: 'UG',
        code3: 'UGA',
        currency: 'UGX',
        symbol: '',
        currencyFull: 'Uganda Shilling',
        capital: 'Kampala'
      },
      UKR: {
        flag: 'ua.svg',
        name: 'Ukraine',
        code2: 'UA',
        code3: 'UKR',
        currency: 'UAH',
        symbol: '₴',
        currencyFull: 'Hryvnia',
        capital: 'Kiev'
      },
      ARE: {
        flag: 'ae.svg',
        name: 'United Arab Emirates',
        code2: 'AE',
        code3: 'ARE',
        currency: 'AED',
        symbol: '',
        currencyFull: 'UAE dirham',
        capital: 'Abu Dhabi'
      },
      GBR: {
        flag: 'gb.svg',
        name: 'United Kingdom',
        code2: 'GB',
        code3: 'GBR',
        currency: 'GBP',
        symbol: '£',
        currencyFull: 'pound sterling',
        capital: 'London'
      },
      USA: {
        flag: 'us.svg',
        name: 'United States',
        code2: 'US',
        code3: 'USA',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Washington DC'
      },
      URY: {
        flag: 'uy.svg',
        name: 'Uruguay',
        code2: 'UY',
        code3: 'URY',
        currency: 'UYU',
        symbol: '$U',
        currencyFull: 'Peso Uruguayo',
        capital: 'Montevideo'
      },
      UZB: {
        flag: 'uz.svg',
        name: 'Uzbekistan',
        code2: 'UZ',
        code3: 'UZB',
        currency: 'UZS',
        symbol: 'лв',
        currencyFull: 'Uzbekistan Sum',
        capital: 'Tashkent'
      },
      VUT: {
        flag: 'vu.svg',
        name: 'Vanuatu',
        code2: 'VU',
        code3: 'VUT',
        currency: 'VUV',
        symbol: '',
        currencyFull: 'Vatu',
        capital: 'Port Vila'
      },
      VEN: {
        flag: 've.svg',
        name: 'Venezuela',
        code2: 'VE',
        code3: 'VEN',
        currency: 'VEB',
        symbol: '',
        currencyFull: 'bolivar',
        capital: 'Caracas'
      },
      VNM: {
        flag: 'vn.svg',
        name: 'Vietnam',
        code2: 'VN',
        code3: 'VNM',
        currency: 'VND',
        symbol: '₫',
        currencyFull: 'dong',
        capital: 'Hanoi'
      },
      VIR: {
        flag: 'vi.svg',
        name: 'US Virgin Islands',
        code2: 'VI',
        code3: 'VIR',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Charlotte Amalie'
      },
      WLF: {
        flag: 'wf.svg',
        name: 'Wallis and Futuna',
        code2: 'WF',
        code3: 'WLF',
        currency: 'XPF',
        symbol: '',
        currencyFull: 'CFP franc',
        capital: 'Mata-Utu'
      },
      ESH: {
        flag: 'eh.svg',
        name: 'Western Sahara',
        code2: 'EH',
        code3: 'ESH',
        currency: 'MAD',
        symbol: '',
        currencyFull: 'Moroccan Dirham',
        capital: 'Al aaiun'
      },
      YEM: {
        flag: 'ye.svg',
        name: 'Yemen',
        code2: 'YE',
        code3: 'YEM',
        currency: 'YER',
        symbol: '﷼',
        currencyFull: 'Yemeni Rial',
        capital: 'San\'a'
      },
      ZMB: {
        flag: 'zm.svg',
        name: 'Zambia',
        code2: 'ZM',
        code3: 'ZMB',
        currency: 'ZMW',
        symbol: '',
        currencyFull: 'Zambian Kwacha',
        capital: 'Lusaka'
      },
      ZWE: {
        flag: 'zw.svg',
        name: 'Zimbabwe',
        code2: 'ZW',
        code3: 'ZWE',
        currency: 'ZWL',
        symbol: '',
        currencyFull: 'Zimbabwe Dollar',
        capital: 'Harare'
      }
    },
    byCode2: {
      AF: {
        flag: 'af.svg',
        name: 'Afghanistan',
        code2: 'AF',
        code3: 'AFG',
        currency: 'AFN',
        symbol: '؋',
        currencyFull: 'Afghani',
        capital: 'Kabul'
      },
      AL: {
        flag: 'al.svg',
        name: 'Albania',
        code2: 'AL',
        code3: 'ALB',
        currency: 'ALL',
        symbol: 'Lek',
        currencyFull: 'Lek',
        capital: 'Tirana'
      },
      DZ: {
        flag: 'dz.svg',
        name: 'Algeria',
        code2: 'DZ',
        code3: 'DZA',
        currency: 'DZD',
        symbol: '',
        currencyFull: 'Algerian Dinar',
        capital: 'Algiers'
      },
      AS: {
        flag: 'as.svg',
        name: 'American Samoa',
        code2: 'AS',
        code3: 'ASM',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Pago Pago'
      },
      AD: {
        flag: 'ad.svg',
        name: 'Andorra',
        code2: 'AD',
        code3: 'AND',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Andorra la Vella'
      },
      AO: {
        flag: 'ao.svg',
        name: 'Angola',
        code2: 'AO',
        code3: 'AGO',
        currency: 'AOA',
        symbol: '',
        currencyFull: 'Kwanza',
        capital: 'Luanda'
      },
      AI: {
        flag: 'ai.svg',
        name: 'Anguilla',
        code2: 'AI',
        code3: 'AIA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'The Valley'
      },
      AG: {
        flag: 'ag.svg',
        name: 'Antigua and Barbuda',
        code2: 'AG',
        code3: 'ATG',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'St John\'s'
      },
      AR: {
        flag: 'ar.svg',
        name: 'Argentina',
        code2: 'AR',
        code3: 'ARG',
        currency: 'ARS',
        symbol: '$',
        currencyFull: 'Argentine Peso',
        capital: 'Buenos Aires'
      },
      AM: {
        flag: 'am.svg',
        name: 'Armenia',
        code2: 'AM',
        code3: 'ARM',
        currency: 'AMD',
        symbol: '',
        currencyFull: 'Armenian Dram',
        capital: 'Yerevan'
      },
      AW: {
        flag: 'aw.svg',
        name: 'Aruba',
        code2: 'AW',
        code3: 'ABW',
        currency: 'AWG',
        symbol: 'ƒ',
        currencyFull: 'Aruban Florin',
        capital: 'Oranjestad'
      },
      AU: {
        flag: 'au.svg',
        name: 'Australia',
        code2: 'AU',
        code3: 'AUS',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Canberra'
      },
      AT: {
        flag: 'at.svg',
        name: 'Austria',
        code2: 'AT',
        code3: 'AUT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Vienna'
      },
      AZ: {
        flag: 'az.svg',
        name: 'Azerbaijan',
        code2: 'AZ',
        code3: 'AZE',
        currency: 'AZN',
        symbol: '₼',
        currencyFull: 'Azerbaijan Manat',
        capital: 'Baku'
      },
      BS: {
        flag: 'bs.svg',
        name: 'The Bahamas',
        code2: 'BS',
        code3: 'BHS',
        currency: 'BSD',
        symbol: '$',
        currencyFull: 'Bahamian Dollar',
        capital: 'Nassau'
      },
      BH: {
        flag: 'bh.svg',
        name: 'Bahrain',
        code2: 'BH',
        code3: 'BHR',
        currency: 'BHD',
        symbol: '',
        currencyFull: 'Bahraini Dinar',
        capital: 'Manama'
      },
      BD: {
        flag: 'bd.svg',
        name: 'Bangladesh',
        code2: 'BD',
        code3: 'BGD',
        currency: 'BDT',
        symbol: '',
        currencyFull: 'Taka',
        capital: 'Dhaka'
      },
      BB: {
        flag: 'bb.svg',
        name: 'Barbados',
        code2: 'BB',
        code3: 'BRB',
        currency: 'BBD',
        symbol: '$',
        currencyFull: 'Barbados Dollar',
        capital: 'Bridgetown'
      },
      BY: {
        flag: 'by.svg',
        name: 'Belarus',
        code2: 'BY',
        code3: 'BLR',
        currency: 'BYN',
        symbol: 'Br',
        currencyFull: 'Belarusian Ruble',
        capital: 'Minsk'
      },
      BE: {
        flag: 'be.svg',
        name: 'Belgium',
        code2: 'BE',
        code3: 'BEL',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Brussels'
      },
      BZ: {
        flag: 'bz.svg',
        name: 'Belize',
        code2: 'BZ',
        code3: 'BLZ',
        currency: 'BZD',
        symbol: 'BZ$',
        currencyFull: 'Belize Dollar',
        capital: 'Belmopan'
      },
      BJ: {
        flag: 'bj.svg',
        name: 'Benin',
        code2: 'BJ',
        code3: 'BEN',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Porto Novo'
      },
      BM: {
        flag: 'bm.svg',
        name: 'Bermuda',
        code2: 'BM',
        code3: 'BMU',
        currency: 'BMD',
        symbol: '$',
        currencyFull: 'Bermudian Dollar',
        capital: 'Hamilton'
      },
      BT: {
        flag: 'bt.svg',
        name: 'Bhutan',
        code2: 'BT',
        code3: 'BTN',
        currency: 'BTN',
        symbol: '',
        currencyFull: 'Indian Rupee',
        capital: 'Thimphu'
      },
      BO: {
        flag: 'bo.svg',
        name: 'Bolivia',
        code2: 'BO',
        code3: 'BOL',
        currency: 'BOB',
        symbol: '$b',
        currencyFull: 'boliviano',
        capital: 'Sucre'
      },
      BA: {
        flag: 'ba.svg',
        name: 'Bosnia and Herzegovina',
        code2: 'BA',
        code3: 'BIH',
        currency: 'BAM',
        symbol: 'KM',
        currencyFull: 'Convertible Mark',
        capital: 'Sarajevo'
      },
      BW: {
        flag: 'bw.svg',
        name: 'Botswana',
        code2: 'BW',
        code3: 'BWA',
        currency: 'BWP',
        symbol: 'P',
        currencyFull: 'Pula',
        capital: 'Gaborone'
      },
      BV: {
        flag: 'bv.svg',
        name: 'Bouvet Island',
        code2: 'BV',
        code3: 'BVT',
        currency: 'NOK',
        symbol: 'kr',
        currencyFull: 'Norwegian Krone',
        capital: '-'
      },
      BR: {
        flag: 'br.svg',
        name: 'Brazil',
        code2: 'BR',
        code3: 'BRA',
        currency: 'BRL',
        symbol: 'R$',
        currencyFull: 'Brazilian Real',
        capital: 'Brasilia'
      },
      VG: {
        flag: 'vg.svg',
        name: 'British Virgin Islands',
        code2: 'VG',
        code3: 'VGB',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Road Town'
      },
      BN: {
        flag: 'bn.svg',
        name: 'Brunei',
        code2: 'BN',
        code3: 'BRN',
        currency: 'BND',
        symbol: '$',
        currencyFull: 'Brunei Dollar',
        capital: 'Bandar Seri Begawan'
      },
      BG: {
        flag: 'bg.svg',
        name: 'Bulgaria',
        code2: 'BG',
        code3: 'BGR',
        currency: 'BGN',
        symbol: 'лв',
        currencyFull: 'Bulgarian Lev',
        capital: 'Sofia'
      },
      BF: {
        flag: 'bf.svg',
        name: 'Burkina Faso',
        code2: 'BF',
        code3: 'BFA',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Ouagadougou'
      },
      BI: {
        flag: 'bi.svg',
        name: 'Burundi',
        code2: 'BI',
        code3: 'BDI',
        currency: 'BIF',
        symbol: '',
        currencyFull: 'Burundi Franc',
        capital: 'Bujumbura'
      },
      KH: {
        flag: 'kh.svg',
        name: 'Cambodia',
        code2: 'KH',
        code3: 'KHM',
        currency: 'KHR',
        symbol: '៛',
        currencyFull: 'Riel',
        capital: 'Phnom Penh'
      },
      CM: {
        flag: 'cm.svg',
        name: 'Cameroon',
        code2: 'CM',
        code3: 'CMR',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'Yaound'
      },
      CA: {
        flag: 'ca.svg',
        name: 'Canada',
        code2: 'CA',
        code3: 'CAN',
        currency: 'CAD',
        symbol: '$',
        currencyFull: 'Canadian Dollar',
        capital: 'Ottawa'
      },
      CV: {
        flag: 'cv.svg',
        name: 'Cape Verde',
        code2: 'CV',
        code3: 'CPV',
        currency: 'CVE',
        symbol: '',
        currencyFull: 'Cape Verde escudo',
        capital: 'Praia'
      },
      KY: {
        flag: 'ky.svg',
        name: 'Cayman Islands',
        code2: 'KY',
        code3: 'CYM',
        currency: 'KYD',
        symbol: '$',
        currencyFull: 'Cayman Islands dollar',
        capital: 'George Town'
      },
      CF: {
        flag: 'cf.svg',
        name: 'Central African Republic',
        code2: 'CF',
        code3: 'CAF',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA franc',
        capital: 'Bangui'
      },
      TD: {
        flag: 'td.svg',
        name: 'Chad',
        code2: 'TD',
        code3: 'TCD',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'N\'Djamena'
      },
      CL: {
        flag: 'cl.svg',
        name: 'Chile',
        code2: 'CL',
        code3: 'CHL',
        currency: 'CLP',
        symbol: '$',
        currencyFull: 'Chilean Peso',
        capital: 'Santiago'
      },
      CN: {
        flag: 'cn.svg',
        name: 'China',
        code2: 'CN',
        code3: 'CHN',
        currency: 'CNY',
        symbol: '¥',
        currencyFull: 'Yuan Renminbi',
        capital: 'Beijing'
      },
      HK: {
        flag: 'hk.svg',
        name: 'Hong Kong',
        code2: 'HK',
        code3: 'HKG',
        currency: 'HKD',
        symbol: '$',
        currencyFull: 'Hong Kong Dollar',
        capital: 'Victoria City'
      },
      MO: {
        flag: 'mo.svg',
        name: 'Macau',
        code2: 'MO',
        code3: 'MAC',
        currency: 'MOP',
        symbol: '',
        currencyFull: 'pataca',
        capital: 'Macau'
      },
      CX: {
        flag: 'cx.svg',
        name: 'Christmas Island',
        code2: 'CX',
        code3: 'CXR',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Flying Fish Cove'
      },
      CC: {
        flag: 'cc.svg',
        name: 'Cocos (Keeling) Islands',
        code2: 'CC',
        code3: 'CCK',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian dollar',
        capital: 'Bantam'
      },
      CO: {
        flag: 'co.svg',
        name: 'Colombia',
        code2: 'CO',
        code3: 'COL',
        currency: 'COP',
        symbol: '$',
        currencyFull: 'Colombian Peso',
        capital: 'Santa Fe de Bogot'
      },
      KM: {
        flag: 'km.svg',
        name: 'Comoros',
        code2: 'KM',
        code3: 'COM',
        currency: 'KMF',
        symbol: '',
        currencyFull: 'Comorian franc',
        capital: 'Moroni'
      },
      CG: {
        flag: 'cg.svg',
        name: 'Congo',
        code2: 'CG',
        code3: 'COG',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA franc',
        capital: 'Brazzaville'
      },
      CD: {
        flag: 'cd.svg',
        name: 'Democratic Republic of the Congo',
        code2: 'CD',
        code3: 'COD',
        currency: 'CDF',
        symbol: '',
        currencyFull: 'Congolese franc',
        capital: 'Kinshasa'
      },
      CK: {
        flag: 'ck.svg',
        name: 'Cook Islands',
        code2: 'CK',
        code3: 'COK',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand dollar',
        capital: 'Avarua'
      },
      CR: {
        flag: 'cr.svg',
        name: 'Costa Rica',
        code2: 'CR',
        code3: 'CRI',
        currency: 'CRC',
        symbol: '₡',
        currencyFull: 'Costa Rican Colon',
        capital: 'San Jos'
      },
      CI: {
        flag: 'ci.svg',
        name: 'Cote D\'Ivoire',
        code2: 'CI',
        code3: 'CIV',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Yamoussoukro'
      },
      HR: {
        flag: 'hr.svg',
        name: 'Croatia',
        code2: 'HR',
        code3: 'HRV',
        currency: 'HRK',
        symbol: 'kn',
        currencyFull: 'Kuna',
        capital: 'Zagreb'
      },
      CU: {
        flag: 'cu.svg',
        name: 'Cuba',
        code2: 'CU',
        code3: 'CUB',
        currency: 'CUP',
        symbol: '₱',
        currencyFull: 'Cuban Peso',
        capital: 'Havana'
      },
      CY: {
        flag: 'cy.svg',
        name: 'Cyprus',
        code2: 'CY',
        code3: 'CYP',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Nicosia'
      },
      CZ: {
        flag: 'cz.svg',
        name: 'Czech Republic',
        code2: 'CZ',
        code3: 'CZE',
        currency: 'CZK',
        symbol: 'Kč',
        currencyFull: 'Czech koruna (pl. koruny)',
        capital: 'Prague'
      },
      DK: {
        flag: 'dk.svg',
        name: 'Denmark',
        code2: 'DK',
        code3: 'DNK',
        currency: 'DKK',
        symbol: 'kr',
        currencyFull: 'Danish Krone',
        capital: 'Copenhagen'
      },
      DJ: {
        flag: 'dj.svg',
        name: 'Djibouti',
        code2: 'DJ',
        code3: 'DJI',
        currency: 'DJF',
        symbol: '',
        currencyFull: 'Djibouti Franc',
        capital: 'Djibouti'
      },
      DM: {
        flag: 'dm.svg',
        name: 'Dominica',
        code2: 'DM',
        code3: 'DMA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Roseau'
      },
      DO: {
        flag: 'do.svg',
        name: 'Dominican Republic',
        code2: 'DO',
        code3: 'DOM',
        currency: 'DOP',
        symbol: 'RD$',
        currencyFull: 'Dominican peso',
        capital: 'Santo Domingo'
      },
      EC: {
        flag: 'ec.svg',
        name: 'Ecuador',
        code2: 'EC',
        code3: 'ECU',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Quito'
      },
      EG: {
        flag: 'eg.svg',
        name: 'Egypt',
        code2: 'EG',
        code3: 'EGY',
        currency: 'EGP',
        symbol: '£',
        currencyFull: 'Egyptian Pound',
        capital: 'Cairo'
      },
      SV: {
        flag: 'sv.svg',
        name: 'El Salvador',
        code2: 'SV',
        code3: 'SLV',
        currency: 'SVC',
        symbol: '$',
        currencyFull: 'El Salvador Colon',
        capital: 'San Salvador'
      },
      GQ: {
        flag: 'gq.svg',
        name: 'Equatorial Guinea',
        code2: 'GQ',
        code3: 'GNQ',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'Malabo'
      },
      ER: {
        flag: 'er.svg',
        name: 'Eritrea',
        code2: 'ER',
        code3: 'ERI',
        currency: 'ERN',
        symbol: '',
        currencyFull: 'Nakfa',
        capital: 'Asmara'
      },
      EE: {
        flag: 'ee.svg',
        name: 'Estonia',
        code2: 'EE',
        code3: 'EST',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Tallinn'
      },
      ET: {
        flag: 'et.svg',
        name: 'Ethiopia',
        code2: 'ET',
        code3: 'ETH',
        currency: 'ETB',
        symbol: '',
        currencyFull: 'Ethiopian Birr',
        capital: 'Addis Ababa'
      },
      FK: {
        flag: 'fk.svg',
        name: 'Falkland Islands',
        code2: 'FK',
        code3: 'FLK',
        currency: 'FKP',
        symbol: '£',
        currencyFull: 'Falkland Islands pound',
        capital: 'Stanley'
      },
      FO: {
        flag: 'fo.svg',
        name: 'Faeroe Islands',
        code2: 'FO',
        code3: 'FRO',
        currency: 'DKK',
        symbol: 'kr',
        currencyFull: 'Danish krone (pl. kroner)',
        capital: 'Thorshavn'
      },
      FJ: {
        flag: 'fj.svg',
        name: 'Fiji',
        code2: 'FJ',
        code3: 'FJI',
        currency: 'FJD',
        symbol: '$',
        currencyFull: 'Fiji Dollar',
        capital: 'Suva'
      },
      FI: {
        flag: 'fi.svg',
        name: 'Finland',
        code2: 'FI',
        code3: 'FIN',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Helsinki'
      },
      FR: {
        flag: 'fr.svg',
        name: 'France',
        code2: 'FR',
        code3: 'FRA',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Paris'
      },
      GF: {
        flag: 'gf.svg',
        name: 'French Guiana',
        code2: 'GF',
        code3: 'GUF',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Cayenne'
      },
      PF: {
        flag: 'pf.svg',
        name: 'French Polynesia',
        code2: 'PF',
        code3: 'PYF',
        currency: 'XPF',
        symbol: '',
        currencyFull: 'CFP Franc',
        capital: 'Papeete'
      },
      GA: {
        flag: 'ga.svg',
        name: 'Gabon',
        code2: 'GA',
        code3: 'GAB',
        currency: 'XAF',
        symbol: '',
        currencyFull: 'CFA Franc BEAC',
        capital: 'Libreville'
      },
      GM: {
        flag: 'gm.svg',
        name: 'The Gambia',
        code2: 'GM',
        code3: 'GMB',
        currency: 'GMD',
        symbol: '',
        currencyFull: 'dalasi (inv.)',
        capital: 'Banjul'
      },
      GE: {
        flag: 'ge.svg',
        name: 'Georgia',
        code2: 'GE',
        code3: 'GEO',
        currency: 'GEL',
        symbol: '',
        currencyFull: 'Lari',
        capital: 'Tbilisi'
      },
      DE: {
        flag: 'de.svg',
        name: 'Germany',
        code2: 'DE',
        code3: 'DEU',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Berlin'
      },
      GH: {
        flag: 'gh.svg',
        name: 'Ghana',
        code2: 'GH',
        code3: 'GHA',
        currency: 'GHS',
        symbol: '¢',
        currencyFull: 'Ghana Cedi',
        capital: 'Accra'
      },
      GI: {
        flag: 'gi.svg',
        name: 'Gibraltar',
        code2: 'GI',
        code3: 'GIB',
        currency: 'GIP',
        symbol: '£',
        currencyFull: 'Gibraltar Pound',
        capital: 'Gibraltar'
      },
      GR: {
        flag: 'gr.svg',
        name: 'Greece',
        code2: 'GR',
        code3: 'GRC',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Athens'
      },
      GL: {
        flag: 'gl.svg',
        name: 'Greenland',
        code2: 'GL',
        code3: 'GRL',
        currency: 'DKK',
        symbol: 'kr',
        currencyFull: 'Danish Krone',
        capital: 'Nuuk'
      },
      GD: {
        flag: 'gd.svg',
        name: 'Grenada',
        code2: 'GD',
        code3: 'GRD',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'St George\'s'
      },
      GP: {
        flag: 'gp.svg',
        name: 'Guadeloupe',
        code2: 'GP',
        code3: 'GLP',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Basse Terre'
      },
      GU: {
        flag: 'gu.svg',
        name: 'Guam',
        code2: 'GU',
        code3: 'GUM',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Hagtana'
      },
      GT: {
        flag: 'gt.svg',
        name: 'Guatemala',
        code2: 'GT',
        code3: 'GTM',
        currency: 'GTQ',
        symbol: 'Q',
        currencyFull: 'Quetzal',
        capital: 'Guatemala City'
      },
      GN: {
        flag: 'gn.svg',
        name: 'Guinea',
        code2: 'GN',
        code3: 'GIN',
        currency: 'GNF',
        symbol: '',
        currencyFull: 'Guinean Franc',
        capital: 'Conakry'
      },
      GW: {
        flag: 'gw.svg',
        name: 'Guinea-Bissau',
        code2: 'GW',
        code3: 'GNB',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Bissau'
      },
      GY: {
        flag: 'gy.svg',
        name: 'Guyana',
        code2: 'GY',
        code3: 'GUY',
        currency: 'GYD',
        symbol: '$',
        currencyFull: 'Guyana Dollar',
        capital: 'Georgetown'
      },
      HT: {
        flag: 'ht.svg',
        name: 'Haiti',
        code2: 'HT',
        code3: 'HTI',
        currency: 'HTG',
        symbol: '',
        currencyFull: 'Gourde',
        capital: 'Port-au-Prince'
      },
      VA: {
        flag: 'va.svg',
        name: 'The Hoy See (Vatican City State)',
        code2: 'VA',
        code3: 'VAT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'euro',
        capital: 'Vatican City'
      },
      HN: {
        flag: 'hn.svg',
        name: 'Honduras',
        code2: 'HN',
        code3: 'HND',
        currency: 'HNL',
        symbol: 'L',
        currencyFull: 'Lempira',
        capital: 'Tegucigalpa'
      },
      HU: {
        flag: 'hu.svg',
        name: 'Hungary',
        code2: 'HU',
        code3: 'HUN',
        currency: 'HUF',
        symbol: 'Ft',
        currencyFull: 'Forint',
        capital: 'Budapest'
      },
      IS: {
        flag: 'is.svg',
        name: 'Iceland',
        code2: 'IS',
        code3: 'ISL',
        currency: 'ISK',
        symbol: 'kr',
        currencyFull: 'Iceland Krona',
        capital: 'Reykjavik'
      },
      IN: {
        flag: 'in.svg',
        name: 'India',
        code2: 'IN',
        code3: 'IND',
        currency: 'INR',
        symbol: '₹',
        currencyFull: 'Indian Rupee',
        capital: 'New Delhi'
      },
      ID: {
        flag: 'id.svg',
        name: 'Indonesia',
        code2: 'ID',
        code3: 'IDN',
        currency: 'IDR',
        symbol: 'Rp',
        currencyFull: 'Rupiah',
        capital: 'Jakarta'
      },
      IR: {
        flag: 'ir.svg',
        name: 'Iran',
        code2: 'IR',
        code3: 'IRN',
        currency: 'IRR',
        symbol: '﷼',
        currencyFull: 'Iranian rial',
        capital: 'Tehran'
      },
      IQ: {
        flag: 'iq.svg',
        name: 'Iraq',
        code2: 'IQ',
        code3: 'IRQ',
        currency: 'IQD',
        symbol: '',
        currencyFull: 'Iraqi Dinar',
        capital: 'Baghdad'
      },
      IE: {
        flag: 'ie.svg',
        name: 'Ireland',
        code2: 'IE',
        code3: 'IRL',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Dublin'
      },
      IL: {
        flag: 'il.svg',
        name: 'Israel',
        code2: 'IL',
        code3: 'ISR',
        currency: 'ILS',
        symbol: '₪',
        currencyFull: 'New Israeli Sheqel',
        capital: 'Jerusalem'
      },
      IT: {
        flag: 'it.svg',
        name: 'Italy',
        code2: 'IT',
        code3: 'ITA',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Rome'
      },
      JM: {
        flag: 'jm.svg',
        name: 'Jamaica',
        code2: 'JM',
        code3: 'JAM',
        currency: 'JMD',
        symbol: 'J$',
        currencyFull: 'Jamaican Dollar',
        capital: 'Kingston'
      },
      JP: {
        flag: 'jp.svg',
        name: 'Japan',
        code2: 'JP',
        code3: 'JPN',
        currency: 'JPY',
        symbol: '¥',
        currencyFull: 'Yen',
        capital: 'Tokyo'
      },
      JO: {
        flag: 'jo.svg',
        name: 'Jordan',
        code2: 'JO',
        code3: 'JOR',
        currency: 'JOD',
        symbol: '',
        currencyFull: 'Jordanian Dinar',
        capital: 'Amman'
      },
      KZ: {
        flag: 'kz.svg',
        name: 'Kazakhstan',
        code2: 'KZ',
        code3: 'KAZ',
        currency: 'KZT',
        symbol: 'лв',
        currencyFull: 'Tenge',
        capital: 'Astana'
      },
      KE: {
        flag: 'ke.svg',
        name: 'Kenya',
        code2: 'KE',
        code3: 'KEN',
        currency: 'KES',
        symbol: '',
        currencyFull: 'Kenyan Shilling',
        capital: 'Nairobi'
      },
      KI: {
        flag: 'ki.svg',
        name: 'Kiribati',
        code2: 'KI',
        code3: 'KIR',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Tarawa'
      },
      KP: {
        flag: 'kp.svg',
        name: 'North Korea',
        code2: 'KP',
        code3: 'PRK',
        currency: 'KPW',
        symbol: '₩',
        currencyFull: 'North Korean won (inv.)',
        capital: 'Pyongyang'
      },
      KR: {
        flag: 'kr.svg',
        name: 'South Korea',
        code2: 'KR',
        code3: 'KOR',
        currency: 'KRW',
        symbol: '₩',
        currencyFull: 'South Korean won (inv.)',
        capital: 'Seoul'
      },
      KW: {
        flag: 'kw.svg',
        name: 'Kuwait',
        code2: 'KW',
        code3: 'KWT',
        currency: 'KWD',
        symbol: '',
        currencyFull: 'Kuwaiti Dinar',
        capital: 'Kuwait City'
      },
      KG: {
        flag: 'kg.svg',
        name: 'Kyrgyzstan',
        code2: 'KG',
        code3: 'KGZ',
        currency: 'KGS',
        symbol: 'лв',
        currencyFull: 'Som',
        capital: 'Bishkek'
      },
      LA: {
        flag: 'la.svg',
        name: 'Laos',
        code2: 'LA',
        code3: 'LAO',
        currency: 'LAK',
        symbol: '₭',
        currencyFull: 'kip (inv.)',
        capital: 'Vientiane'
      },
      LV: {
        flag: 'lv.svg',
        name: 'Latvia',
        code2: 'LV',
        code3: 'LVA',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Riga'
      },
      LB: {
        flag: 'lb.svg',
        name: 'Lebanon',
        code2: 'LB',
        code3: 'LBN',
        currency: 'LBP',
        symbol: '£',
        currencyFull: 'Lebanese Pound',
        capital: 'Beirut'
      },
      LS: {
        flag: 'ls.svg',
        name: 'Lesotho',
        code2: 'LS',
        code3: 'LSO',
        currency: 'LSL',
        symbol: '',
        currencyFull: 'Loti',
        capital: 'Maseru'
      },
      LR: {
        flag: 'lr.svg',
        name: 'Liberia',
        code2: 'LR',
        code3: 'LBR',
        currency: 'LRD',
        symbol: '$',
        currencyFull: 'Liberian Dollar',
        capital: 'Monrovia'
      },
      LY: {
        flag: 'ly.svg',
        name: 'Libya',
        code2: 'LY',
        code3: 'LBY',
        currency: 'LYD',
        symbol: '',
        currencyFull: 'Libyan Dinar',
        capital: 'Tripoli'
      },
      LI: {
        flag: 'li.svg',
        name: 'Liechtenstein',
        code2: 'LI',
        code3: 'LIE',
        currency: 'CHF',
        symbol: 'CHF',
        currencyFull: 'Swiss Franc',
        capital: 'Vaduz'
      },
      LT: {
        flag: 'lt.svg',
        name: 'Lithuania',
        code2: 'LT',
        code3: 'LTU',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Vilnius'
      },
      LU: {
        flag: 'lu.svg',
        name: 'Luxembourg',
        code2: 'LU',
        code3: 'LUX',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Luxembourg'
      },
      MK: {
        flag: 'mk.svg',
        name: 'Former Yugoslav Republic of Macedonia',
        code2: 'MK',
        code3: 'MKD',
        currency: 'MKD',
        symbol: 'ден',
        currencyFull: 'denar (inv.)',
        capital: 'Skopje'
      },
      MG: {
        flag: 'mg.svg',
        name: 'Madagascar',
        code2: 'MG',
        code3: 'MDG',
        currency: 'MGA',
        symbol: '',
        currencyFull: 'Malagasy Ariary',
        capital: 'Antananarivo'
      },
      MW: {
        flag: 'mw.svg',
        name: 'Malawi',
        code2: 'MW',
        code3: 'MWI',
        currency: 'MWK',
        symbol: '',
        currencyFull: 'Malawi Kwacha',
        capital: 'Lilongwe'
      },
      MY: {
        flag: 'my.svg',
        name: 'Malaysia',
        code2: 'MY',
        code3: 'MYS',
        currency: 'MYR',
        symbol: 'RM',
        currencyFull: 'Malaysian Ringgit',
        capital: 'Kuala Lumpur'
      },
      MV: {
        flag: 'mv.svg',
        name: 'Maldives',
        code2: 'MV',
        code3: 'MDV',
        currency: 'MVR',
        symbol: '',
        currencyFull: 'Rufiyaa',
        capital: 'Male'
      },
      ML: {
        flag: 'ml.svg',
        name: 'Mali',
        code2: 'ML',
        code3: 'MLI',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Bamako'
      },
      MT: {
        flag: 'mt.svg',
        name: 'Malta',
        code2: 'MT',
        code3: 'MLT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Valletta'
      },
      MH: {
        flag: 'mh.svg',
        name: 'Marshall Islands',
        code2: 'MH',
        code3: 'MHL',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Majuro'
      },
      MQ: {
        flag: 'mq.svg',
        name: 'Martinique',
        code2: 'MQ',
        code3: 'MTQ',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Fort-de-France'
      },
      MR: {
        flag: 'mr.svg',
        name: 'Mauritania',
        code2: 'MR',
        code3: 'MRT',
        currency: 'MRO',
        symbol: '',
        currencyFull: 'Ouguiya',
        capital: 'Nouakchott'
      },
      MU: {
        flag: 'mu.svg',
        name: 'Mauritius',
        code2: 'MU',
        code3: 'MUS',
        currency: 'MUR',
        symbol: '₨',
        currencyFull: 'Mauritius Rupee',
        capital: 'Port Louis'
      },
      YT: {
        flag: 'yt.svg',
        name: 'Mayotte',
        code2: 'YT',
        code3: 'MYT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Mamoudzou'
      },
      MX: {
        flag: 'mx.svg',
        name: 'Mexico',
        code2: 'MX',
        code3: 'MEX',
        currency: 'MXN',
        symbol: '$',
        currencyFull: 'Mexican Peso',
        capital: 'Mexico City'
      },
      FM: {
        flag: 'fm.svg',
        name: 'Micronesia',
        code2: 'FM',
        code3: 'FSM',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Palikir'
      },
      MD: {
        flag: 'md.svg',
        name: 'Moldova',
        code2: 'MD',
        code3: 'MDA',
        currency: 'MDL',
        symbol: '',
        currencyFull: 'Moldovan leu (pl. lei)',
        capital: 'Chisinau'
      },
      MC: {
        flag: 'mc.svg',
        name: 'Monaco',
        code2: 'MC',
        code3: 'MCO',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Monaco'
      },
      MN: {
        flag: 'mn.svg',
        name: 'Mongolia',
        code2: 'MN',
        code3: 'MNG',
        currency: 'MNT',
        symbol: '₮',
        currencyFull: 'Tugrik',
        capital: 'Ulan Bator'
      },
      MS: {
        flag: 'ms.svg',
        name: 'Montserrat',
        code2: 'MS',
        code3: 'MSR',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Plymouth'
      },
      MA: {
        flag: 'ma.svg',
        name: 'Morocco',
        code2: 'MA',
        code3: 'MAR',
        currency: 'MAD',
        symbol: '',
        currencyFull: 'Moroccan Dirham',
        capital: 'Rabat'
      },
      MZ: {
        flag: 'mz.svg',
        name: 'Mozambique',
        code2: 'MZ',
        code3: 'MOZ',
        currency: 'MZN',
        symbol: 'MT',
        currencyFull: 'Mozambique Metical',
        capital: 'Maputo'
      },
      MM: {
        flag: 'mm.svg',
        name: 'Myanmar',
        code2: 'MM',
        code3: 'MMR',
        currency: 'MMK',
        symbol: '',
        currencyFull: 'Kyat',
        capital: 'Yangon'
      },
      NA: {
        flag: 'na.svg',
        name: 'Namibia',
        code2: 'NA',
        code3: 'NAM',
        currency: 'NAD',
        symbol: '$',
        currencyFull: 'Namibia Dollar',
        capital: 'Windhoek'
      },
      NR: {
        flag: 'nr.svg',
        name: 'Nauru',
        code2: 'NR',
        code3: 'NRU',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Yaren'
      },
      NP: {
        flag: 'np.svg',
        name: 'Nepal',
        code2: 'NP',
        code3: 'NPL',
        currency: 'NPR',
        symbol: '₨',
        currencyFull: 'Nepalese Rupee',
        capital: 'Kathmandu'
      },
      NL: {
        flag: 'nl.svg',
        name: 'Netherlands',
        code2: 'NL',
        code3: 'NLD',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'euro',
        capital: 'Amsterdam'
      },
      AN: {
        flag: 'an.svg',
        name: 'Netherlands Antilles',
        code2: 'AN',
        code3: 'ANT',
        currency: 'ANG',
        symbol: 'ƒ',
        currencyFull: 'Netherlands Antillean guilder',
        capital: 'Willemstad'
      },
      NC: {
        flag: 'nc.svg',
        name: 'New Caledonia',
        code2: 'NC',
        code3: 'NCL',
        currency: 'XPF',
        symbol: '',
        currencyFull: 'CFP Franc',
        capital: 'Noumea'
      },
      NZ: {
        flag: 'nz.svg',
        name: 'New Zealand',
        code2: 'NZ',
        code3: 'NZL',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Wellington'
      },
      NI: {
        flag: 'ni.svg',
        name: 'Nicaragua',
        code2: 'NI',
        code3: 'NIC',
        currency: 'NIO',
        symbol: 'C$',
        currencyFull: 'Cordoba Oro',
        capital: 'Managua'
      },
      NE: {
        flag: 'ne.svg',
        name: 'Niger',
        code2: 'NE',
        code3: 'NER',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA franc',
        capital: 'Niamey'
      },
      NG: {
        flag: 'ng.svg',
        name: 'Nigeria',
        code2: 'NG',
        code3: 'NGA',
        currency: 'NGN',
        symbol: '₦',
        currencyFull: 'Naira',
        capital: 'Abuja'
      },
      NU: {
        flag: 'nu.svg',
        name: 'Niue',
        code2: 'NU',
        code3: 'NIU',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Alofi'
      },
      NF: {
        flag: 'nf.svg',
        name: 'Norfolk Island',
        code2: 'NF',
        code3: 'NFK',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Kingston'
      },
      MP: {
        flag: 'mp.svg',
        name: 'Northern Marianas',
        code2: 'MP',
        code3: 'MNP',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Garapan'
      },
      NO: {
        flag: 'no.svg',
        name: 'Norway',
        code2: 'NO',
        code3: 'NOR',
        currency: 'NOK',
        symbol: 'kr',
        currencyFull: 'Norwegian Krone',
        capital: 'Oslo'
      },
      OM: {
        flag: 'om.svg',
        name: 'Oman',
        code2: 'OM',
        code3: 'OMN',
        currency: 'OMR',
        symbol: '﷼',
        currencyFull: 'Rial Omani',
        capital: 'Muscat'
      },
      PK: {
        flag: 'pk.svg',
        name: 'Pakistan',
        code2: 'PK',
        code3: 'PAK',
        currency: 'PKR',
        symbol: '₨',
        currencyFull: 'Pakistan Rupee',
        capital: 'Islamabad'
      },
      PW: {
        flag: 'pw.svg',
        name: 'Palau',
        code2: 'PW',
        code3: 'PLW',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Koror'
      },
      PA: {
        flag: 'pa.svg',
        name: 'Panama',
        code2: 'PA',
        code3: 'PAN',
        currency: 'PAB',
        symbol: 'B/.',
        currencyFull: 'Balboa',
        capital: 'Panama City'
      },
      PG: {
        flag: 'pg.svg',
        name: 'Papua New Guinea',
        code2: 'PG',
        code3: 'PNG',
        currency: 'PGK',
        symbol: '',
        currencyFull: 'Kina',
        capital: 'Port Moresby'
      },
      PY: {
        flag: 'py.svg',
        name: 'Paraguay',
        code2: 'PY',
        code3: 'PRY',
        currency: 'PYG',
        symbol: 'Gs',
        currencyFull: 'Guarani',
        capital: 'Asuncion'
      },
      PE: {
        flag: 'pe.svg',
        name: 'Peru',
        code2: 'PE',
        code3: 'PER',
        currency: 'PEN',
        symbol: 'S/.',
        currencyFull: 'Sol',
        capital: 'Lima'
      },
      PH: {
        flag: 'ph.svg',
        name: 'Philippines',
        code2: 'PH',
        code3: 'PHL',
        currency: 'PHP',
        symbol: '₱',
        currencyFull: 'Philippine peso',
        capital: 'Manila'
      },
      PN: {
        flag: 'pn.svg',
        name: 'Pitcairn Islands',
        code2: 'PN',
        code3: 'PCN',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Adamstown'
      },
      PL: {
        flag: 'pl.svg',
        name: 'Poland',
        code2: 'PL',
        code3: 'POL',
        currency: 'PLN',
        symbol: 'zł',
        currencyFull: 'Zloty',
        capital: 'Warsaw'
      },
      PT: {
        flag: 'pt.svg',
        name: 'Portugal',
        code2: 'PT',
        code3: 'PRT',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Lisbon'
      },
      PR: {
        flag: 'pr.svg',
        name: 'Puerto Rico',
        code2: 'PR',
        code3: 'PRI',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'San Juan'
      },
      QA: {
        flag: 'qa.svg',
        name: 'Qatar',
        code2: 'QA',
        code3: 'QAT',
        currency: 'QAR',
        symbol: '﷼',
        currencyFull: 'Qatari Rial',
        capital: 'Doha'
      },
      RE: {
        flag: 're.svg',
        name: 'Reunion',
        code2: 'RE',
        code3: 'REU',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Saint-Denis'
      },
      RO: {
        flag: 'ro.svg',
        name: 'Romania',
        code2: 'RO',
        code3: 'ROU',
        currency: 'RON',
        symbol: 'lei',
        currencyFull: 'Romanian Leu',
        capital: 'Bucharest'
      },
      RU: {
        flag: 'ru.svg',
        name: 'Russia',
        code2: 'RU',
        code3: 'RUS',
        currency: 'RUB',
        symbol: '₽',
        currencyFull: 'rouble',
        capital: 'Moscow'
      },
      RW: {
        flag: 'rw.svg',
        name: 'Rwanda',
        code2: 'RW',
        code3: 'RWA',
        currency: 'RWF',
        symbol: '',
        currencyFull: 'Rwanda Franc',
        capital: 'Kigali'
      },
      SH: {
        flag: 'sh.svg',
        name: 'Saint Helena',
        code2: 'SH',
        code3: 'SHN',
        currency: 'SHP',
        symbol: '£',
        currencyFull: 'Saint Helena pound',
        capital: 'Jamestown'
      },
      KN: {
        flag: 'kn.svg',
        name: 'Saint Kitts and Nevis',
        code2: 'KN',
        code3: 'KNA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Basseterre'
      },
      LC: {
        flag: 'lc.svg',
        name: 'Saint Lucia',
        code2: 'LC',
        code3: 'LCA',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'East Caribbean Dollar',
        capital: 'Castries'
      },
      PM: {
        flag: 'pm.svg',
        name: 'Saint Pierre and Miquelon',
        code2: 'PM',
        code3: 'SPM',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Saint-Pierre'
      },
      VC: {
        flag: 'vc.svg',
        name: 'Saint Vincent and the Grenadines',
        code2: 'VC',
        code3: 'VCT',
        currency: 'XCD',
        symbol: '$',
        currencyFull: 'Eastern Caribbean dollar',
        capital: 'Kingstown'
      },
      WS: {
        flag: 'ws.svg',
        name: 'Samoa',
        code2: 'WS',
        code3: 'WSM',
        currency: 'WST',
        symbol: '',
        currencyFull: 'Tala',
        capital: 'Apia'
      },
      SM: {
        flag: 'sm.svg',
        name: 'San Marino',
        code2: 'SM',
        code3: 'SMR',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'San Marino'
      },
      ST: {
        flag: 'st.svg',
        name: 'Sao tome and principle',
        code2: 'ST',
        code3: 'STP',
        currency: 'STD',
        symbol: '',
        currencyFull: 'Dobra',
        capital: 'Sao Tome & Principe Dobra'
      },
      SA: {
        flag: 'sa.svg',
        name: 'Saudi Arabia',
        code2: 'SA',
        code3: 'SAU',
        currency: 'SAR',
        symbol: '﷼',
        currencyFull: 'Saudi Riyal',
        capital: 'Riyadh'
      },
      SN: {
        flag: 'sn.svg',
        name: 'Senegal',
        code2: 'SN',
        code3: 'SEN',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Dakar'
      },
      RS: {
        flag: 'rs.svg',
        name: 'Serbia',
        code2: 'RS',
        code3: 'SRB',
        currency: 'RSD',
        symbol: 'Дин.',
        currencyFull: 'Serbian Dinar',
        capital: 'Belgrade'
      },
      SC: {
        flag: 'sc.svg',
        name: 'Seychelles',
        code2: 'SC',
        code3: 'SYC',
        currency: 'SCR',
        symbol: '₨',
        currencyFull: 'Seychelles Rupee',
        capital: 'Victoria'
      },
      SL: {
        flag: 'sl.svg',
        name: 'Sierra Leone',
        code2: 'SL',
        code3: 'SLE',
        currency: 'SLL',
        symbol: '',
        currencyFull: 'Leone',
        capital: 'Freetown'
      },
      SG: {
        flag: 'sg.svg',
        name: 'Singapore',
        code2: 'SG',
        code3: 'SGP',
        currency: 'SGD',
        symbol: '$',
        currencyFull: 'Singapore Dollar',
        capital: 'Singapore'
      },
      SK: {
        flag: 'sk.svg',
        name: 'Slovakia',
        code2: 'SK',
        code3: 'SVK',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Bratislava'
      },
      SI: {
        flag: 'si.svg',
        name: 'Slovenia',
        code2: 'SI',
        code3: 'SVN',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Ljubljana'
      },
      SB: {
        flag: 'sb.svg',
        name: 'Solomon Islands',
        code2: 'SB',
        code3: 'SLB',
        currency: 'SBD',
        symbol: '$',
        currencyFull: 'Solomon Islands Dollar',
        capital: 'Honiara'
      },
      SO: {
        flag: 'so.svg',
        name: 'Somalia',
        code2: 'SO',
        code3: 'SOM',
        currency: 'SOS',
        symbol: 'S',
        currencyFull: 'Somali Shilling',
        capital: 'Mogadishu'
      },
      ZA: {
        flag: 'za.svg',
        name: 'South Africa',
        code2: 'ZA',
        code3: 'ZAF',
        currency: 'ZAR',
        symbol: 'R',
        currencyFull: 'Rand',
        capital: 'Pretoria'
      },
      SS: {
        flag: 'ss.svg',
        name: 'South Sudan',
        code2: 'SS',
        code3: 'SSD',
        currency: 'SSP',
        symbol: '',
        currencyFull: 'South Sudanese Pound',
        capital: 'Juba'
      },
      ES: {
        flag: 'es.svg',
        name: 'Spain',
        code2: 'ES',
        code3: 'ESP',
        currency: 'EUR',
        symbol: '€',
        currencyFull: 'Euro',
        capital: 'Madrid'
      },
      LK: {
        flag: 'lk.svg',
        name: 'Sri Lanka',
        code2: 'LK',
        code3: 'LKA',
        currency: 'LKR',
        symbol: '₨',
        currencyFull: 'Sri Lanka Rupee',
        capital: 'Colombo'
      },
      SD: {
        flag: 'sd.svg',
        name: 'Sudan',
        code2: 'SD',
        code3: 'SDN',
        currency: 'SDD',
        symbol: '',
        currencyFull: 'Sudanese dinar',
        capital: 'Khartoum'
      },
      SR: {
        flag: 'sr.svg',
        name: 'Suriname',
        code2: 'SR',
        code3: 'SUR',
        currency: 'SRD',
        symbol: '$',
        currencyFull: 'Surinam Dollar',
        capital: 'Paramaribo'
      },
      SJ: {
        flag: 'sj.svg',
        name: 'Svalbard and Jan Mayen',
        code2: 'SJ',
        code3: 'SJM',
        currency: 'NOK',
        symbol: 'kr',
        currencyFull: 'Norwegian krone (pl. kroner)',
        capital: 'Longyearbyen'
      },
      SZ: {
        flag: 'sz.svg',
        name: 'Swaziland',
        code2: 'SZ',
        code3: 'SWZ',
        currency: 'SZL',
        symbol: '',
        currencyFull: 'Lilangeni',
        capital: 'Mbabane'
      },
      SE: {
        flag: 'se.svg',
        name: 'Sweden',
        code2: 'SE',
        code3: 'SWE',
        currency: 'SEK',
        symbol: 'kr',
        currencyFull: 'Swedish Krona',
        capital: 'Stockholm'
      },
      CH: {
        flag: 'ch.svg',
        name: 'Switzerland',
        code2: 'CH',
        code3: 'CHE',
        currency: 'CHF',
        symbol: 'CHF',
        currencyFull: 'Swiss Franc',
        capital: 'Berne'
      },
      SY: {
        flag: 'sy.svg',
        name: 'Syria',
        code2: 'SY',
        code3: 'SYR',
        currency: 'SYP',
        symbol: '£',
        currencyFull: 'Syrian pound',
        capital: 'Damascus'
      },
      TW: {
        flag: 'tw.svg',
        name: 'Taiwan',
        code2: 'TW',
        code3: 'TWN',
        currency: 'TWD',
        symbol: 'NT$',
        currencyFull: 'new Taiwan dollar',
        capital: 'Taipei'
      },
      TJ: {
        flag: 'tj.svg',
        name: 'Tajikistan',
        code2: 'TJ',
        code3: 'TJK',
        currency: 'TJS',
        symbol: '',
        currencyFull: 'Somoni',
        capital: 'Dushanbe'
      },
      TZ: {
        flag: 'tz.svg',
        name: 'Tanzania',
        code2: 'TZ',
        code3: 'TZA',
        currency: 'TZS',
        symbol: '',
        currencyFull: 'Tanzanian Shilling',
        capital: 'Dodoma'
      },
      TH: {
        flag: 'th.svg',
        name: 'Thailand',
        code2: 'TH',
        code3: 'THA',
        currency: 'THB',
        symbol: '฿',
        currencyFull: 'Baht',
        capital: 'Bangkok'
      },
      TL: {
        flag: 'tl.svg',
        name: 'Timor-Leste',
        code2: 'TL',
        code3: 'TLS',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US Dollar',
        capital: 'Dili'
      },
      TG: {
        flag: 'tg.svg',
        name: 'Togo',
        code2: 'TG',
        code3: 'TGO',
        currency: 'XOF',
        symbol: '',
        currencyFull: 'CFA Franc BCEAO',
        capital: 'Lome'
      },
      TK: {
        flag: 'tk.svg',
        name: 'Tokelau',
        code2: 'TK',
        code3: 'TKL',
        currency: 'NZD',
        symbol: '$',
        currencyFull: 'New Zealand Dollar',
        capital: 'Fakaofo'
      },
      TO: {
        flag: 'to.svg',
        name: 'Tonga',
        code2: 'TO',
        code3: 'TON',
        currency: 'TOP',
        symbol: '',
        currencyFull: 'Pa__anga',
        capital: 'Nuku\'alofa'
      },
      TT: {
        flag: 'tt.svg',
        name: 'Trinidad and Tobago',
        code2: 'TT',
        code3: 'TTO',
        currency: 'TTD',
        symbol: 'TT$',
        currencyFull: 'Trinidad and Tobago Dollar',
        capital: 'Port of Spain'
      },
      TN: {
        flag: 'tn.svg',
        name: 'Tunisia',
        code2: 'TN',
        code3: 'TUN',
        currency: 'TND',
        symbol: '',
        currencyFull: 'Tunisian Dinar',
        capital: 'Tunis'
      },
      TR: {
        flag: 'tr.svg',
        name: 'Turkey',
        code2: 'TR',
        code3: 'TUR',
        currency: 'TRY',
        symbol: '₺',
        currencyFull: 'Turkish Lira',
        capital: 'Ankara'
      },
      TM: {
        flag: 'tm.svg',
        name: 'Turkmenistan',
        code2: 'TM',
        code3: 'TKM',
        currency: 'TMT',
        symbol: '',
        currencyFull: 'Turkmenistan New Manat',
        capital: 'Ashgabat'
      },
      TC: {
        flag: 'tc.svg',
        name: 'Turks and Caicos Islands',
        code2: 'TC',
        code3: 'TCA',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Cockburn Town'
      },
      TV: {
        flag: 'tv.svg',
        name: 'Tuvalu',
        code2: 'TV',
        code3: 'TUV',
        currency: 'AUD',
        symbol: '$',
        currencyFull: 'Australian Dollar',
        capital: 'Fongafale'
      },
      UG: {
        flag: 'ug.svg',
        name: 'Uganda',
        code2: 'UG',
        code3: 'UGA',
        currency: 'UGX',
        symbol: '',
        currencyFull: 'Uganda Shilling',
        capital: 'Kampala'
      },
      UA: {
        flag: 'ua.svg',
        name: 'Ukraine',
        code2: 'UA',
        code3: 'UKR',
        currency: 'UAH',
        symbol: '₴',
        currencyFull: 'Hryvnia',
        capital: 'Kiev'
      },
      AE: {
        flag: 'ae.svg',
        name: 'United Arab Emirates',
        code2: 'AE',
        code3: 'ARE',
        currency: 'AED',
        symbol: '',
        currencyFull: 'UAE dirham',
        capital: 'Abu Dhabi'
      },
      GB: {
        flag: 'gb.svg',
        name: 'United Kingdom',
        code2: 'GB',
        code3: 'GBR',
        currency: 'GBP',
        symbol: '£',
        currencyFull: 'pound sterling',
        capital: 'London'
      },
      US: {
        flag: 'us.svg',
        name: 'United States',
        code2: 'US',
        code3: 'USA',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Washington DC'
      },
      UY: {
        flag: 'uy.svg',
        name: 'Uruguay',
        code2: 'UY',
        code3: 'URY',
        currency: 'UYU',
        symbol: '$U',
        currencyFull: 'Peso Uruguayo',
        capital: 'Montevideo'
      },
      UZ: {
        flag: 'uz.svg',
        name: 'Uzbekistan',
        code2: 'UZ',
        code3: 'UZB',
        currency: 'UZS',
        symbol: 'лв',
        currencyFull: 'Uzbekistan Sum',
        capital: 'Tashkent'
      },
      VU: {
        flag: 'vu.svg',
        name: 'Vanuatu',
        code2: 'VU',
        code3: 'VUT',
        currency: 'VUV',
        symbol: '',
        currencyFull: 'Vatu',
        capital: 'Port Vila'
      },
      VE: {
        flag: 've.svg',
        name: 'Venezuela',
        code2: 'VE',
        code3: 'VEN',
        currency: 'VEB',
        symbol: '',
        currencyFull: 'bolivar',
        capital: 'Caracas'
      },
      VN: {
        flag: 'vn.svg',
        name: 'Vietnam',
        code2: 'VN',
        code3: 'VNM',
        currency: 'VND',
        symbol: '₫',
        currencyFull: 'dong',
        capital: 'Hanoi'
      },
      VI: {
        flag: 'vi.svg',
        name: 'US Virgin Islands',
        code2: 'VI',
        code3: 'VIR',
        currency: 'USD',
        symbol: '$',
        currencyFull: 'US dollar',
        capital: 'Charlotte Amalie'
      },
      WF: {
        flag: 'wf.svg',
        name: 'Wallis and Futuna',
        code2: 'WF',
        code3: 'WLF',
        currency: 'XPF',
        symbol: '',
        currencyFull: 'CFP franc',
        capital: 'Mata-Utu'
      },
      EH: {
        flag: 'eh.svg',
        name: 'Western Sahara',
        code2: 'EH',
        code3: 'ESH',
        currency: 'MAD',
        symbol: '',
        currencyFull: 'Moroccan Dirham',
        capital: 'Al aaiun'
      },
      YE: {
        flag: 'ye.svg',
        name: 'Yemen',
        code2: 'YE',
        code3: 'YEM',
        currency: 'YER',
        symbol: '﷼',
        currencyFull: 'Yemeni Rial',
        capital: 'San\'a'
      },
      ZM: {
        flag: 'zm.svg',
        name: 'Zambia',
        code2: 'ZM',
        code3: 'ZMB',
        currency: 'ZMW',
        symbol: '',
        currencyFull: 'Zambian Kwacha',
        capital: 'Lusaka'
      },
      ZW: {
        flag: 'zw.svg',
        name: 'Zimbabwe',
        code2: 'ZW',
        code3: 'ZWE',
        currency: 'ZWL',
        symbol: '',
        currencyFull: 'Zimbabwe Dollar',
        capital: 'Harare'
      }
    },
    currencies: {
      'ALL': {
        name: 'Albanian lek',
        currency: 'ALL',
        flag: '21px-Flag_of_Albania.svg.png'
      },
      'DZD': {
        name: 'Algerian dinar',
        currency: 'DZD',
        flag: '23px-Flag_of_Algeria.svg.png'
      },
      'ARS': {
        name: 'Argentine peso',
        currency: 'ARS',
        flag: '23px-Flag_of_Argentina.svg.png'
      },
      'AUD': {
        name: 'Australian dollar',
        currency: 'AUD',
        flag: '23px-Flag_of_Australia.svg.png'
      },
      'BSD': {
        name: 'Bahamian dollar',
        currency: 'BSD',
        flag: '23px-Flag_of_the_Bahamas.svg.png'
      },
      'BHD': {
        name: 'Bahraini dinar',
        currency: 'BHD',
        flag: '23px-Flag_of_Bahrain.svg.png'
      },
      'BDT': {
        name: 'Bangladeshi taka',
        currency: 'BDT',
        flag: '23px-Flag_of_Bangladesh.svg.png'
      },
      'AMD': {
        name: 'Armenian dram',
        currency: 'AMD',
        flag: '23px-Flag_of_Armenia.svg.png'
      },
      'BBD': {
        name: 'Barbados dollar',
        currency: 'BBD',
        flag: '23px-Flag_of_Barbados.svg.png'
      },
      'BMD': {
        name: 'Bermudian dollar',
        currency: 'BMD',
        flag: '23px-Flag_of_Bermuda.svg.png'
      },
      'BTN': {
        name: 'Bhutanese ngultrum',
        currency: 'BTN',
        flag: '23px-Flag_of_Bhutan.svg.png'
      },
      'BOB': {
        name: 'Boliviano',
        currency: 'BOB',
        flag: '22px-Flag_of_Bolivia.svg.png'
      },
      'BWP': {
        name: 'Botswana pula',
        currency: 'BWP',
        flag: '23px-Flag_of_Botswana.svg.png'
      },
      'BZD': {
        name: 'Belize dollar',
        currency: 'BZD',
        flag: '23px-Flag_of_Belize.svg.png'
      },
      'SBD': {
        name: 'Solomon Islands dollar',
        currency: 'SBD',
        flag: '23px-Flag_of_the_Solomon_Islands.svg.png'
      },
      'BND': {
        name: 'Brunei dollar',
        currency: 'BND',
        flag: '23px-Flag_of_Brunei.svg.png'
      },
      'MMK': {
        name: 'Myanmar kyat',
        currency: 'MMK',
        flag: '23px-Flag_of_Myanmar.svg.png'
      },
      'BIF': {
        name: 'Burundian franc',
        currency: 'BIF',
        flag: 'Flag_of_Burundi.svg.png'
      },
      'KHR': {
        name: 'Cambodian riel',
        currency: 'KHR',
        flag: '23px-Flag_of_Cambodia.svg.png'
      },
      'CAD': {
        name: 'Canadian dollar',
        currency: 'CAD',
        flag: 'Flag_of_Canada.svg.png'
      },
      'CVE': {
        name: 'Cape Verde escudo',
        currency: 'CVE',
        flag: '23px-Flag_of_Cape_Verde.svg.png'
      },
      'KYD': {
        name: 'Cayman Islands dollar',
        currency: 'KYD',
        flag: '23px-Flag_of_the_Cayman_Islands.svg.png'
      },
      'LKR': {
        name: 'Sri Lankan rupee',
        currency: 'LKR',
        flag: '23px-Flag_of_Sri_Lanka.svg.png'
      },
      'CLP': {
        name: 'Chilean peso',
        currency: 'CLP',
        flag: '23px-Flag_of_Chile.svg.png'
      },
      'CNH': {
        name: 'Renminbi (Chinese) Yuan (Offshore)',
        currency: 'CNH',
        flag: '23px-Flag_of_the_People\'s_Republic_of_China_CNH.svg.png'
      },
      'CNY': {
        name: 'Renminbi (Chinese) Yuan',
        currency: 'CNY',
        flag: '23px-Flag_of_the_People\'s_Republic_of_China_CNY.svg.png'
      },
      'COP': {
        name: 'Colombian peso',
        currency: 'COP',
        flag: '23px-Flag_of_Colombia.svg.png'
      },
      'KMF': {
        name: 'Comoro franc',
        currency: 'KMF',
        flag: '23px-Flag_of_the_Comoros.svg.png'
      },
      'CRC': {
        name: 'Costa Rican colon',
        currency: 'CRC',
        flag: '23px-Flag_of_Costa_Rica.svg.png'
      },
      'HRK': {
        name: 'Croatian kuna',
        currency: 'HRK',
        flag: '23px-Flag_of_Croatia.svg.png'
      },
      'CUP': {
        name: 'Cuban peso',
        currency: 'CUP',
        flag: '23px-Flag_of_Cuba.svg.png'
      },
      'CZK': {
        name: 'Czech koruna',
        currency: 'CZK',
        flag: '23px-Flag_of_the_Czech_Republic.svg.png'
      },
      'DKK': {
        name: 'Danish krone',
        currency: 'DKK',
        flag: '20px-Flag_of_Denmark.svg.png'
      },
      'DOP': {
        name: 'Dominican peso',
        currency: 'DOP',
        flag: '23px-Flag_of_the_Dominican_Republic.svg.png'
      },
      'SVC': {
        name: 'Salvadoran colÃģn',
        currency: 'SVC',
        flag: '23px-Flag_of_El_Salvador.svg.png'
      },
      'ETB': {
        name: 'Ethiopian birr',
        currency: 'ETB',
        flag: '23px-Flag_of_Ethiopia.svg.png'
      },
      'ERN': {
        name: 'Eritrean nakfa',
        currency: 'ERN',
        flag: '23px-Flag_of_Eritrea.svg.png'
      },
      'FKP': {
        name: 'Falkland Islands pound',
        currency: 'FKP',
        flag: '23px-Flag_of_the_Falkland_Islands.svg.png'
      },
      'FJD': {
        name: 'Fiji dollar',
        currency: 'FJD',
        flag: '23px-Flag_of_Fiji.svg.png'
      },
      'DJF': {
        name: 'Djiboutian franc',
        currency: 'DJF',
        flag: '23px-Flag_of_Djibouti.svg.png'
      },
      'GMD': {
        name: 'Gambian dalasi',
        currency: 'GMD',
        flag: '23px-Flag_of_The_Gambia.svg.png'
      },
      'GIP': {
        name: 'Gibraltar pound',
        currency: 'GIP',
        flag: '23px-Flag_of_Gibraltar.svg.png'
      },
      'GTQ': {
        name: 'Guatemalan quetzal',
        currency: 'GTQ',
        flag: '23px-Flag_of_Guatemala.svg.png'
      },
      'GNF': {
        name: 'Guinean franc',
        currency: 'GNF',
        flag: '23px-Flag_of_Guinea.svg.png'
      },
      'GYD': {
        name: 'Guyanese dollar',
        currency: 'GYD',
        flag: '23px-Flag_of_Guyana.svg.png'
      },
      'HTG': {
        name: 'Haitian gourde',
        currency: 'HTG',
        flag: '23px-Flag_of_Haiti.svg.png'
      },
      'HNL': {
        name: 'Honduran lempira',
        currency: 'HNL',
        flag: '23px-Flag_of_Honduras.svg.png'
      },
      'HKD': {
        name: 'Hong Kong dollar',
        currency: 'HKD',
        flag: '23px-Flag_of_Hong_Kong.svg.png'
      },
      'HUF': {
        name: 'Hungarian forint',
        currency: 'HUF',
        flag: '23px-Flag_of_Hungary.svg.png'
      },
      'ISK': {
        name: 'Icelandic krÃģna',
        currency: 'ISK',
        flag: '21px-Flag_of_Iceland.svg.png'
      },
      'INR': {
        name: 'Indian rupee',
        currency: 'INR',
        flag: '23px-Flag_of_India.svg.png'
      },
      'IDR': {
        name: 'Indonesian rupiah',
        currency: 'IDR',
        flag: '23px-Flag_of_Indonesia.svg.png'
      },
      'IRR': {
        name: 'Iranian rial',
        currency: 'IRR',
        flag: '23px-Flag_of_Iran.svg.png'
      },
      'IQD': {
        name: 'Iraqi dinar',
        currency: 'IQD',
        flag: '23px-Flag_of_Iraq.svg.png'
      },
      'ILS': {
        name: 'Israeli new shekel',
        currency: 'ILS',
        flag: '21px-Flag_of_Israel.svg.png'
      },
      'JMD': {
        name: 'Jamaican dollar',
        currency: 'JMD',
        flag: '23px-Flag_of_Jamaica.svg.png'
      },
      'JPY': {
        name: 'Japanese yen',
        currency: 'JPY',
        flag: '23px-Flag_of_Japan.svg.png'
      },
      'KZT': {
        name: 'Kazakhstani tenge',
        currency: 'KZT',
        flag: '23px-Flag_of_Kazakhstan.svg.png'
      },
      'JOD': {
        name: 'Jordanian dinar',
        currency: 'JOD',
        flag: '23px-Flag_of_Jordan.svg.png'
      },
      'KES': {
        name: 'Kenyan shilling',
        currency: 'KES',
        flag: '23px-Flag_of_Kenya.svg.png'
      },
      'KPW': {
        name: 'North Korean won',
        currency: 'KPW',
        flag: '23px-Flag_of_North_Korea.svg.png'
      },
      'KRW': {
        name: 'South Korean won',
        currency: 'KRW',
        flag: '23px-Flag_of_South_Korea.svg.png'
      },
      'KWD': {
        name: 'Kuwaiti dinar',
        currency: 'KWD',
        flag: '23px-Flag_of_Kuwait.svg.png'
      },
      'KGS': {
        name: 'Kyrgyzstani som',
        currency: 'KGS',
        flag: '23px-Flag_of_Kyrgyzstan.svg.png'
      },
      'LAK': {
        name: 'Lao kip',
        currency: 'LAK',
        flag: '23px-Flag_of_Laos.svg.png'
      },
      'LBP': {
        name: 'Lebanese pound',
        currency: 'LBP',
        flag: '23px-Flag_of_Lebanon.svg.png'
      },
      'LSL': {
        name: 'Lesotho loti',
        currency: 'LSL',
        flag: '23px-Flag_of_Lesotho.svg.png'
      },
      'LRD': {
        name: 'Liberian dollar',
        currency: 'LRD',
        flag: '23px-Flag_of_Liberia.svg.png'
      },
      'LYD': {
        name: 'Libyan dinar',
        currency: 'LYD',
        flag: '23px-Flag_of_Libya.svg.png'
      },
      'MOP': {
        name: 'Macanese pataca',
        currency: 'MOP',
        flag: '23px-Flag_of_Macau.svg.png'
      },
      'MWK': {
        name: 'Malawian kwacha',
        currency: 'MWK',
        flag: '23px-Flag_of_Malawi.svg.png'
      },
      'MYR': {
        name: 'Malaysian ringgit',
        currency: 'MYR',
        flag: '23px-Flag_of_Malaysia.svg.png'
      },
      'MVR': {
        name: 'Maldivian rufiyaa',
        currency: 'MVR',
        flag: '23px-Flag_of_Maldives.svg.png'
      },
      'MUR': {
        name: 'Mauritian rupee',
        currency: 'MUR',
        flag: '23px-Flag_of_Mauritius.svg.png'
      },
      'MXN': {
        name: 'Mexican peso',
        currency: 'MXN',
        flag: '23px-Flag_of_Mexico.svg.png'
      },
      'MNT': {
        name: 'Mongolian tÃķgrÃķg',
        currency: 'MNT',
        flag: '23px-Flag_of_Mongolia.svg.png'
      },
      'MDL': {
        name: 'Moldovan leu',
        currency: 'MDL',
        flag: '23px-Flag_of_Moldova.svg.png'
      },
      'MAD': {
        name: 'Moroccan dirham',
        currency: 'MAD',
        flag: '23px-Flag_of_Morocco.svg.png'
      },
      'OMR': {
        name: 'Omani rial',
        currency: 'OMR',
        flag: '23px-Flag_of_Oman.svg.png'
      },
      'NAD': {
        name: 'Namibian dollar',
        currency: 'NAD',
        flag: '23px-Flag_of_Namibia.svg.png'
      },
      'NPR': {
        name: 'Nepalese rupee',
        currency: 'NPR',
        flag: '16px-Flag_of_Nepal.svg.png'
      },
      'ANG': {
        name: 'Netherlands Antillean guilder',
        currency: 'ANG',
        flag: '23px-Flag_of_CuraÃ§ao.svg.png'
      },
      'AWG': {
        name: 'Aruban florin',
        currency: 'AWG',
        flag: '23px-Flag_of_Aruba.svg.png'
      },
      'VUV': {
        name: 'Vanuatu vatu',
        currency: 'VUV',
        flag: '23px-Flag_of_Vanuatu.svg.png'
      },
      'NZD': {
        name: 'New Zealand dollar',
        currency: 'NZD',
        flag: '23px-Flag_of_New_Zealand.svg.png'
      },
      'NIO': {
        name: 'Nicaraguan cÃģrdoba',
        currency: 'NIO',
        flag: '23px-Flag_of_Nicaragua.svg.png'
      },
      'NGN': {
        name: 'Nigerian naira',
        currency: 'NGN',
        flag: '23px-Flag_of_Nigeria.svg.png'
      },
      'NOK': {
        name: 'Norwegian krone',
        currency: 'NOK',
        flag: '21px-Flag_of_Norway.svg.png'
      },
      'PKR': {
        name: 'Pakistani rupee',
        currency: 'PKR',
        flag: '23px-Flag_of_Pakistan.svg.png'
      },
      'PAB': {
        name: 'Panamanian balboa',
        currency: 'PAB',
        flag: '23px-Flag_of_Panama.svg.png'
      },
      'PGK': {
        name: 'Papua New Guinean kina',
        currency: 'PGK',
        flag: '20px-Flag_of_Papua_New_Guinea.svg.png'
      },
      'PYG': {
        name: 'Paraguayan guaranÃ­',
        currency: 'PYG',
        flag: '23px-Flag_of_Paraguay.svg.png'
      },
      'PEN': {
        name: 'Peruvian Sol',
        currency: 'PEN',
        flag: '23px-Flag_of_Peru.svg.png'
      },
      'PHP': {
        name: 'Philippine piso[13]',
        currency: 'PHP',
        flag: '23px-Flag_of_the_Philippines.svg.png'
      },
      'QAR': {
        name: 'Qatari riyal',
        currency: 'QAR',
        flag: '23px-Flag_of_Qatar.svg.png'
      },
      'RUB': {
        name: 'Russian ruble',
        currency: 'RUB',
        flag: '23px-Flag_of_Russia.svg.png'
      },
      'RWF': {
        name: 'Rwandan franc',
        currency: 'RWF',
        flag: '23px-Flag_of_Rwanda.svg.png'
      },
      'SHP': {
        name: 'Saint Helena pound',
        currency: 'SHP',
        flag: '23px-Flag_of_Saint_Helena.svg.png'
      },
      'SAR': {
        name: 'Saudi riyal',
        currency: 'SAR',
        flag: '23px-Flag_of_Saudi_Arabia.svg.png'
      },
      'SCR': {
        name: 'Seychelles rupee',
        currency: 'SCR',
        flag: '23px-Flag_of_Seychelles.svg.png'
      },
      'SLL': {
        name: 'Sierra Leonean leone',
        currency: 'SLL',
        flag: '23px-Flag_of_Sierra_Leone.svg.png'
      },
      'SGD': {
        name: 'Singapore dollar',
        currency: 'SGD',
        flag: '23px-Flag_of_Singapore.svg.png'
      },
      'VND': {
        name: 'Vietnamese Äáŧng',
        currency: 'VND',
        flag: '23px-Flag_of_Vietnam.svg.png'
      },
      'SOS': {
        name: 'Somali shilling',
        currency: 'SOS',
        flag: '23px-Flag_of_Somalia.svg.png'
      },
      'ZAR': {
        name: 'South African rand',
        currency: 'ZAR',
        flag: '23px-Flag_of_South_Africa.svg.png'
      },
      'SSP': {
        name: 'South Sudanese pound',
        currency: 'SSP',
        flag: 'Flag_of_South_Sudan.svg.png'
      },
      'SZL': {
        name: 'Swazi lilangeni',
        currency: 'SZL',
        flag: '23px-Flag_of_Swaziland.svg.png'
      },
      'SEK': {
        name: 'Swedish krona/kronor',
        currency: 'SEK',
        flag: '23px-Flag_of_Sweden.svg.png'
      },
      'CHF': {
        name: 'Swiss franc',
        currency: 'CHF',
        flag: '16px-Flag_of_Switzerland.svg.png'
      },
      'SYP': {
        name: 'Syrian pound',
        currency: 'SYP',
        flag: '23px-Flag_of_Syria.svg.png'
      },
      'THB': {
        name: 'Thai baht',
        currency: 'THB',
        flag: '23px-Flag_of_Thailand.svg.png'
      },
      'TOP': {
        name: 'Tongan paĘŧanga',
        currency: 'TOP',
        flag: '23px-Flag_of_Tonga.svg.png'
      },
      'TTD': {
        name: 'Trinidad and Tobago dollar',
        currency: 'TTD',
        flag: '23px-Flag_of_Trinidad_and_Tobago.svg.png'
      },
      'AED': {
        name: 'United Arab Emirates dirham',
        currency: 'AED',
        flag: 'Flag_of_the_United_Arab_Emirates.svg.png'
      },
      'TND': {
        name: 'Tunisian dinar',
        currency: 'TND',
        flag: '23px-Flag_of_Tunisia.svg.png'
      },
      'UGX': {
        name: 'Ugandan shilling',
        currency: 'UGX',
        flag: '23px-Flag_of_Uganda.svg.png'
      },
      'MKD': {
        name: 'Macedonian denar',
        currency: 'MKD',
        flag: '23px-Flag_of_Macedonia.svg.png'
      },
      'EGP': {
        name: 'Egyptian pound',
        currency: 'EGP',
        flag: '23px-Flag_of_Egypt.svg.png'
      },
      'GBP': {
        name: 'Pound sterling',
        currency: 'GBP',
        flag: '23px-Flag_of_the_United_Kingdom.svg.png'
      },
      'TZS': {
        name: 'Tanzanian shilling',
        currency: 'TZS',
        flag: '23px-Flag_of_Tanzania.svg.png'
      },
      'USD': {
        name: 'United States dollar',
        currency: 'USD',
        flag: '23px-Flag_of_the_United_States.svg.png'
      },
      'UYU': {
        name: 'Uruguayan peso',
        currency: 'UYU',
        flag: '23px-Flag_of_Uruguay.svg.png'
      },
      'UZS': {
        name: 'Uzbekistan som',
        currency: 'UZS',
        flag: '23px-Flag_of_Uzbekistan.svg.png'
      },
      'WST': {
        name: 'Samoan tala',
        currency: 'WST',
        flag: '23px-Flag_of_Samoa.svg.png'
      },
      'YER': {
        name: 'Yemeni rial',
        currency: 'YER',
        flag: '23px-Flag_of_Yemen.svg.png'
      },
      'TWD': {
        name: 'New Taiwan dollar',
        currency: 'TWD',
        flag: '23px-Flag_of_the_Republic_of_China.svg.png'
      },
      'MRU[12]': {
        name: 'Mauritanian ouguiya',
        currency: 'MRU[12]',
        flag: '23px-Flag_of_Mauritania.svg.png'
      },
      'STN[14]': {
        name: 'SÃĢo TomÃĐ and PrÃ­ncipe dobra',
        currency: 'STN[14]',
        flag: '23px-Flag_of_Sao_Tome_and_Principe.svg.png'
      },
      'CUC': {
        name: 'Cuban convertible peso',
        currency: 'CUC',
        flag: '23px-Flag_of_Cuba.svg.png'
      },
      'ZWL': {
        name: 'Zimbabwean dollar A/10',
        currency: 'ZWL',
        flag: '23px-Flag_of_Zimbabwe.svg.png'
      },
      'BYN': {
        name: 'Belarusian ruble',
        currency: 'BYN',
        flag: '23px-Flag_of_Belarus.svg.png'
      },
      'TMT': {
        name: 'Turkmenistan manat',
        currency: 'TMT',
        flag: '23px-Flag_of_Turkmenistan.svg.png'
      },
      'GHS': {
        name: 'Ghanaian cedi',
        currency: 'GHS',
        flag: '23px-Flag_of_Ghana.svg.png'
      },
      'VEF': {
        name: 'Venezuelan bolÃ­var',
        currency: 'VEF',
        flag: '23px-Flag_of_Venezuela.svg.png'
      },
      'SDG': {
        name: 'Sudanese pound',
        currency: 'SDG',
        flag: 'Flag_of_Sudan.svg.png'
      },
      'UYI': {
        name: 'Uruguay Peso en Unidades Indexadas (URUIURUI) (funds code)',
        currency: 'UYI',
        flag: '23px-Flag_of_Uruguay.svg.png'
      },
      'RSD': {
        name: 'Serbian dinar',
        currency: 'RSD',
        flag: '23px-Flag_of_Serbia.svg.png'
      },
      'MZN': {
        name: 'Mozambican metical',
        currency: 'MZN',
        flag: 'Flag_of_Mozambique.svg.png'
      },
      'AZN': {
        name: 'Azerbaijani manat',
        currency: 'AZN',
        flag: '23px-Flag_of_Azerbaijan.svg.png'
      },
      'RON': {
        name: 'Romanian leu',
        currency: 'RON',
        flag: '23px-Flag_of_Romania.svg.png'
      },
      'CHE': {
        name: 'WIR Euro (complementary currency)',
        currency: 'CHE',
        flag: '16px-Flag_of_Switzerland.svg.png'
      },
      'CHW': {
        name: 'WIR Franc (complementary currency)',
        currency: 'CHW',
        flag: '16px-Flag_of_Switzerland.svg.png'
      },
      'TRY': {
        name: 'Turkish lira',
        currency: 'TRY',
        flag: '23px-Flag_of_Turkey.svg.png'
      },
      'XAF': {
        name: 'CFA franc BEAC',
        currency: 'XAF',
        flag: '23px-Flag_of_Cameroon.svg.png'
      },
      'XCD': {
        name: 'East Caribbean dollar',
        currency: 'XCD',
        flag: '23px-Flag_of_Anguilla.svg.png'
      },
      'XOF': {
        name: 'CFA franc BCEAO',
        currency: 'XOF',
        flag: '23px-Flag_of_Benin.svg.png'
      },
      'XPF': {
        name: 'CFP franc (franc Pacifique)',
        currency: 'XPF',
        flag: '23px-Flag_of_French_Polynesia.svg.png'
      },
      'XBA': {
        name: 'European Composite Unit (EURCO) (bond market unit)',
        currency: 'XBA',
        flag: ''
      },
      'XBB': {
        name: 'European Monetary Unit (E.M.U.-6) (bond market unit)',
        currency: 'XBB',
        flag: ''
      },
      'XBC': {
        name: 'European Unit of Account 9 (E.U.A.-9) (bond market unit)',
        currency: 'XBC',
        flag: ''
      },
      'XBD': {
        name: 'European Unit of Account 17 (E.U.A.-17) (bond market unit)',
        currency: 'XBD',
        flag: ''
      },
      'XAU': {
        name: 'Gold (one troy ounce)',
        currency: 'XAU',
        flag: ''
      },
      'XDR': {
        name: 'Special drawing rights',
        currency: 'XDR',
        flag: ''
      },
      'XAG': {
        name: 'Silver (one troy ounce)',
        currency: 'XAG',
        flag: ''
      },
      'XPT': {
        name: 'Platinum (one troy ounce)',
        currency: 'XPT',
        flag: ''
      },
      'XTS': {
        name: 'Code reserved for testing purposes',
        currency: 'XTS',
        flag: ''
      },
      'XPD': {
        name: 'Palladium (one troy ounce)',
        currency: 'XPD',
        flag: ''
      },
      'XUA': {
        name: 'ADB Unit of Account',
        currency: 'XUA',
        flag: ''
      },
      'ZMW': {
        name: 'Zambian kwacha',
        currency: 'ZMW',
        flag: '23px-Flag_of_Zambia.svg.png'
      },
      'SRD': {
        name: 'Surinamese dollar',
        currency: 'SRD',
        flag: '23px-Flag_of_Suriname.svg.png'
      },
      'MGA': {
        name: 'Malagasy ariary',
        currency: 'MGA',
        flag: '23px-Flag_of_Madagascar.svg.png'
      },
      'COU': {
        name: 'Unidad de Valor Real (UVR) (funds code)[9]',
        currency: 'COU',
        flag: '23px-Flag_of_Colombia.svg.png'
      },
      'AFN': {
        name: 'Afghan afghani',
        currency: 'AFN',
        flag: '23px-Flag_of_Afghanistan.svg.png'
      },
      'TJS': {
        name: 'Tajikistani somoni',
        currency: 'TJS',
        flag: '23px-Flag_of_Tajikistan.svg.png'
      },
      'AOA': {
        name: 'Angolan kwanza',
        currency: 'AOA',
        flag: '23px-Flag_of_Angola.svg.png'
      },
      'BGN': {
        name: 'Bulgarian lev',
        currency: 'BGN',
        flag: '23px-Flag_of_Bulgaria.svg.png'
      },
      'CDF': {
        name: 'Congolese franc',
        currency: 'CDF',
        flag: '20px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png'
      },
      'BAM': {
        name: 'Bosnia and Herzegovina convertible mark',
        currency: 'BAM',
        flag: '23px-Flag_of_Bosnia_and_Herzegovina.svg.png'
      },
      'EUR': {
        name: 'Euro',
        currency: 'EUR',
        flag: '23px-Flag_of_Europe.svg.png'
      },
      'MXV': {
        name: 'Mexican Unidad de Inversion (UDI) (funds code)',
        currency: 'MXV',
        flag: '23px-Flag_of_Mexico.svg.png'
      },
      'UAH': {
        name: 'Ukrainian hryvnia',
        currency: 'UAH',
        flag: '23px-Flag_of_Ukraine.svg.png'
      },
      'GEL': {
        name: 'Georgian lari',
        currency: 'GEL',
        flag: '23px-Flag_of_Georgia.svg.png'
      },
      'BOV': {
        name: 'Bolivian Mvdol (funds code)',
        currency: 'BOV',
        flag: '22px-Flag_of_Bolivia.svg.png'
      },
      'PLN': {
        name: 'Polish zÅoty',
        currency: 'PLN',
        flag: '23px-Flag_of_Poland.svg.png'
      },
      'BRL': {
        name: 'Brazilian real',
        currency: 'BRL',
        flag: '22px-Flag_of_Brazil.svg.png'
      },
      'CLF': {
        name: 'Unidad de Fomento (funds code)',
        currency: 'CLF',
        flag: '23px-Flag_of_Chile.svg.png'
      },
      'XSU': {
        name: 'SUCRE',
        currency: 'XSU',
        flag: ''
      },
      'USN': {
        name: 'United States dollar (next day) (funds code)',
        currency: 'USN',
        flag: '23px-Flag_of_the_United_States.svg.png'
      },
      'XXX': {
        name: 'No currency',
        currency: 'XXX',
        flag: ''
      }
    }
  };
}

/**
 * <flag-cc> is a simple web component that display the flag of the
 * corresponding currency or country code.  Use the `currency` attribute to
 * display the currency flag or use `code` to display the country flag.
 *
 * If the flag is not found, it will displays either the `currency` or the
 * `code` that was specified by the user.
 *
 * ![screenshot](./screenshot.png)
 *
 * ## Installation and demo
 * This library depends on the famous LitElement library. To see the demo
 * locally in action please:
 *
 * ```
 * git clone https://github.com/yveslange/flag-cc.git
 * cd flag-cc && npm install
 * npm start
 * ```
 * Now you can navigate to `http://localhost:8000`
 *
 * You can build the source by running `npm run build`. The built distribution
 * will be located into `./build/`. Additionally, you can serve the built
 *
 *
 *
 *
 * ## How to use
 *
 * In your `index.html`:
 * ```
 *  <head>
 *    <script src="./node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
 *    <script type="module" src="./node_modules/flag-cc/index.js"></script>
 * ```
 *
 * Then you should be able to use \<flag-cc\> tag anywhere.
 * ```javascript
 * <flag-cc currency="CHF"></flag-cc>
 * <flag-cc currency="CNY"></flag-cc>
 * <flag-cc currency="CNH"></flag-cc>
 * <flag-cc currency="ABC"></flag-cc>
 * <flag-cc code="Unknown"></flag-cc>
 * <flag-cc code="FR"></flag-cc>
 * ```
 *
 * ## Technical
 * The flags will be searched in `./node_modules/flag-cc/flags/`. If you want to
 * change the path please refer to the property `imagesPath`.
 *
 */

class FlagCC extends LitElement {
  /**
   * Rendering function
   * @return {HTMLTemplate} A HTML template
   */
  render() {
    return html`
      <style>
        :host {
          display: flex;
          position: relative;
          min-height: 10px;
          min-width: 15px;
        }
        img {
          object-fit: cover;
          display: flex;
          flex-grow: 1;
          flex-direction: row;
          width: 100%;
          height: 100%;
          min-height: 12px;
        }

        :host([is-unknown]) {
          border: none;
        }

        #unknown_display {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: auto;
          text-align: center;
          font-size: 9px;
        }
      </style>

      <img
        title="${this._flag_title}"
        src="${this.imagesPath}${this._flagSrc}"
        alt=""
      ></img>

      <div id="unknown_display"></div>

    `;
  }
  /**
   * Properties of the element.
   * @return {Object} The properties.
   */


  static get properties() {
    return {
      /** The country code (eg: CH, FR, ...) */
      code: String,

      /** The currency code (eg: EUR, CNY, CHF, ...) */
      currency: String,

      /** The type of the flag ('country' or 'currency') */
      flagType: {
        type: String,
        attribute: 'flag-type',
        reflect: true
      },

      /**
       * Is true if the country or currency code is unknown. This is set by
       * flag-cc if the flag was not found.
       */
      isUnknown: {
        type: Boolean,
        attribute: 'is-unknown',
        reflect: true
      },

      /** The corresponding country name */
      country: Object,

      /** Configures where the images folder is located */
      imagesPath: {
        type: String,
        attribute: 'images-path',
        reflect: true
      },

      /** PRIVATES */
      _countries: Object,
      _flagSrc: String,
      _flag_title: String,
      _debouncer: Number,
      _DOM_UnknownDisplay: Element
    };
  }
  /** Constructor */


  constructor() {
    super(); // Set the path of the images

    this.imagesPath = './node_modules/flag-cc/flags/';
  }
  /** First update of the element */


  firstUpdated() {
    const shadowRoot = this.shadowRoot;
    this._DOM_UnknownDisplay = shadowRoot.querySelector('#unknown_display');
  }
  /**
   * When props get updated
   * @param {Object} props Hash of the properties that changed.
   */


  updated(props) {
    if (props.has('code') || props.has('currency')) {
      this._updateFlag(this.code, this.currency);
    }
  }
  /**
   * Update the flag using the currency name or the country code name.
   * @param {String} code - The country code to use.
   * @param {String} currency - The currency name to use.
   * @fire changed
   */


  _updateFlag(code, currency) {
    const countries = CountriesDataProvider.data;
    /**
     * Stops the updates when the list of countries and if one of the code or
     * currency is not defined.
     */

    if (!countries || !code && !currency) {
      return;
    } // Create a debouncer


    if (this._debouncer) {
      clearTimeout(this._debouncer);
    }

    this._debouncer = setTimeout(() => {
      let item = null; // The flag that was found.

      let flagType = null; // The flag type (currency or country).

      let flagSrc = ''; // The relative flag image source path.
      // Check if the country code was defined.

      if (code) {
        [flagSrc, item] = this.getCountryFlag(code);
        flagType = 'country'; // Check for the currency was defined
      } else if (currency) {
        [flagSrc, item] = this.getCurrencyFlag(currency);
        flagType = 'currency';
      } // Display the flag if found or display a text.


      if (item) {
        this._flagSrc = flagSrc;
        this._flag_title = code != undefined ? item.name : item.currency;
        this.isUnknown = false;
        this._DOM_UnknownDisplay.innerText = '';
      } else {
        this._flagSrc = '';
        this._flag_title = code != undefined ? code : currency;
        this.isUnknown = true;
        this._DOM_UnknownDisplay.innerText = this._flag_title;
      }

      this.countries = item;
      this.flagType = flagType;
    }, 1);
  }
  /**
   * Retreive the country flag using the code
   * @param {String} code - The country code.
   * @return {String} flag - The flag to use.
   */


  getCountryFlag(code = '') {
    code = code.toUpperCase();
    const countries = CountriesDataProvider.data;
    let item = null;
    let flagSrc = ''; // The relative flag image source path.

    if (code.length == 2) {
      item = countries.byCode2[code];
    } else if (code.length == 3) {
      item = countries.byCode3[code];
    } else {
      console.warn('FLAG-CC> code length should be either 2 or 3 (code:', code, ')');
    }

    if (item) {
      flagSrc = 'countries/' + item.flag;
    } else {
      console.warn('The item was not found for code', code);
    }

    return [flagSrc, item];
  }
  /**
   * Retreive the currency flag using the currency name.
   * @param {String} currency - The currency name to use (eg: CHF, EUR, ...).
   * @return {String} flag - The flag to use.
   */


  getCurrencyFlag(currency) {
    currency = currency.toUpperCase();
    const countries = CountriesDataProvider.data;
    let item = null;
    let flagSrc = ''; // The relative flag image source path.

    item = countries.currencies[currency];

    if (item) {
      flagSrc = 'currencies/' + item.flag;
    } else {
      console.warn('The item was not found for currency', currency);
    }

    return [flagSrc, item];
  }

}

customElements.define('flag-cc', FlagCC);
