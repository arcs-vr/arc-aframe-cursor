# ARC A-Frame Cursor

[![js-standard-style](https://cdn.rawgit.com/standard/standard/master/badge.svg)](http://standardjs.com)

This cursor will provide interaction feedback by displaying possible actions.
It enables [ARCS](https://github.com/arcs-vr) click events and handle gaze-only interaction. 

## Installation

Use one of the following:

```bash
yarn add arcs-vr/arc-aframe-vue-cursor
npm install arcs-vr/arc-aframe-vue-cursor
```

## Usage

Include the A-Frame component in your scene.
It works best if attached to the main camera entity.
Remember to give the cursor a negative offset on the Z Axis to make it visible.

```html
<a-entity camera
          id="main-camera"
>
    <a-entity arc-cursor
              position="0 0 -0.5"
              ref="cursor"
    />
</a-entity>
```

## Schema

|Name               | Type      |Description   |
|-------------------|-----------|--------------|
|`startColor`       | Vector3   | Used for gaze click. Icons and titles start off with this color and gradually morph to the interactionColor. |
|`interactionColor` | Vector3   | Used for gaze click. Icons and titles morph to this color before the action is triggered. Default color for non gaze-only interaction. |
|`onTop`            | Boolean   | Whether the component should be rendered on top of everything else or be able to go through other elements. |

## Subscribed Events

Emit `arc-cursor-activate` and `arc-cursor-deactivate` events on the scene element.

### **Name:** `arc-cursor-activate`

**Description:** Dispatch this event to activate one or more actions.

**Event Target:** A-Frame Scene Element

**Event Detail:** 

`actions`: An array of actions which are each an object consisting of:
* `name`: (one of the `ArcCursorActions`)
* `title`: Currently unused — planned for screen readers
* `icon`: THREE.Texture. Should contain a white icon that will be colored using three.js 

**Example:**

```js
const icon = new THREE.TextureLoader().load('../gyarados.png')

this.el.sceneEl.emit(
  'arc-cursor-activate',
  {
    actions: [
      {
        name: ArcCursorActions.PRIMARY,
        title: 'Choose Gyarados',
        icon: icon
      }
    ]
  }
)
```

### **Name:** `arc-cursor-deactivate`

**Description:** Dispatch this event to deactivate one or more actions.

**Event Target:** A-Frame Scene Element

**Event Detail:**

`actions`: An array of action names as defined in `ArcCursorActions`

**Example:**

```js
this.el.sceneEl.emit(
  'arc-cursor-deactivate',
  {
    actions: [
      ArcCursorActions.PRIMARY
    ]
  }
)
```

## More

Look at the [`arcs-vr/arc-aframe-vue-template`](https://github.com/arcs-vr/arc-aframe-vue-template) for easier setup and at the
[`arcs-vr/arc-aframe-vue-demo`](https://github.com/arcs-vr/arc-aframe-vue-demo) for example usage.
