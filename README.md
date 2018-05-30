# \<flag-cc\>

A simple component that displays the flag and some information about the currency and the country.

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
        display: block;
        width: 24px;
        height: 24px;
      }
    </style>
    <flag-cc currency="USD"></flag-cc>
    <flag-cc currency="CHF"></flag-cc>
    <flag-cc code="FR"></flag-cc>
  </template>
</custom-element-demo>
```
-->

## Running Tests

```
$ polymer test
```

Your application is already set up to be tested via [web-component-tester](https://github.com/Polymer/web-component-tester). Run `polymer test` to run your application's test suite locally.

## Build notes

Please be sure to add the `extraDependencies`:

- "bower_components/flag-cc/flags/**/*"

to your `polymer.json`
