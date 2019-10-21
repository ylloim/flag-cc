# \<flag-cc\>
A simple component that displays the flag of a
specific currency or country code.

# IMPORTANT CHANGE
Since version 1.0.0, this component uses
`lit-element`. The API didn't changed but some
optimization were done in order to reduce the memory
footprint of this component.


## Install the Polymer-CLI

First, make sure you have the [Polymer CLI](https://www.npmjs.com/package/polymer-cli) installed. Then run `polymer serve` to serve your element locally.

## Viewing Your Element

```
$ polymer serve
```

<!--
```
<custom-element-demo>
  <template>
    <link rel="import" href="flag-cc.html">
    <style is="custom-style">
      flag-cc {
        display: inline-block;
        width: 24px;
        height: 14px;
        margin: 10px;
      }
    </style>
    USD: <flag-cc currency="USD"></flag-cc>
    CHF: <flag-cc currency="CHF"></flag-cc>
    EUR: <flag-cc code="EUR"></flag-cc>
    FRANCE: <flag-cc code="FR"></flag-cc>
  </template>
</custom-element-demo>
```
-->

Check the `demos/` for more examples

## Running Tests

```
$ polymer test
```

Your application is already set up to be tested via [web-component-tester](https://github.com/Polymer/web-component-tester). Run `polymer test` to run your application's test suite locally.

## Build notes

Please be sure to add the `extraDependencies`:

```
"node_modules/flag-cc/flags/**/*"
```

to your `polymer.json`
