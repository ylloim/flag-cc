import { html } from "@polymer/polymer/lib/utils/html-tag.js";
import { PolymerElement } from "@polymer/polymer/polymer-element.js";
import "@polymer/iron-image/iron-image.js";
import "./countries-data.js";

/**
<flag-cc> is a simple component that convert a currency or country code to
its flag.

# Example

```
<flag-cc currency="CHF"></flag-cc>
<flag-cc code="FR"></flag-cc>
<flag-cc currency="CNY"></flag-cc>
<flag-cc currency="CNH"></flag-cc>
<flag-cc code="Unknown"></flag-cc>
<flag-cc currency="ABC"></flag-cc>
```

@customElement
@polymer
@demo demo/index.html
 */
class FlagCc extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-block;
          height: 100%;
          min-height: 13px;
          min-width: 18px;
          position: relative;
        }
        iron-image {
          height: 100%;
          width: 100%;
          min-height: 12px;
          position: initial;
        }
        :host([flag-type="currency"]) {
          max-height: 13px;
          max-width: 22px;
          border: 1px solid #333333;
        }
        :host([is-unknown]) {
          border: none;
        }

        #overlay {
          pointer-events: none;
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          opacity: 0.5;
          /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+0,ffffff+100&1+0,0+100;White+to+Transparent */
          background: -moz-linear-gradient(
            top,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0) 100%
          ); /* FF3.6-15 */
          background: -webkit-linear-gradient(
            top,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0) 100%
          ); /* Chrome10-25,Safari5.1-6 */
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0) 100%
          ); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
          filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ffffff', endColorstr='#00ffffff',GradientType=0 ); /* IE6-9 */
        }

        #overlay[hidden] {
          display: none;
        }

        #unknown_display {
          font-size: inherit;
          position: absolute;
          top: 0;
        }
      </style>

      <!-- A collection of countries, codes and flags -->
      <countries-data data="{{_countries}}"></countries-data>

      <!-- The flag to display -->
      <iron-image
        sizing="cover"
        title\$="[[_flag_title]]"
        src\$="[[imagesPath]][[_flag_src]]"
      ></iron-image>
      <span id="unknown_display"></span>
      <div id="overlay" hidden\$="[[isUnknown]]"></div>
    `;
  }

  static get is() {
    return "flag-cc";
  }
  static get properties() {
    return {
      /** The country code (eg: CH, FR, ...) */
      code: {
        type: String
      },

      /** The currency code (eg: EUR, CNY, CHF, ...) */
      currency: {
        type: String
      },

      /** The type of the flag ('country' or 'currency') */
      flagType: {
        type: String,
        reflectToAttribute: true
      },

      /** Is true if the country or currency code is unknown */
      isUnknown: {
        type: Boolean,
        reflectToAttribute: true
      },

      /** The corresponding country either for the country or currency code */
      country: {
        type: Object,
        notify: true,
        readOnly: true
      },

      /** Configures where the images folder is located */
      imagesPath: {
        type: String,
        value: () => {
          return "/node_modules/flag-cc/flags/";
        }
      },

      /** PRIVATES */
      _countries: {
        type: Object
      },
      _flag_src: {
        type: String
      },
      _flag_title: {
        type: String
      },
      _debouncer: {
        type: Number
      }
    };
  }

  static get observers() {
    return ["_updateFlag(_countries, code, currency)"];
  }

  _updateFlag(_countries, code, currency) {
    if (!_countries || (!code && !currency)) {
      return;
    }
    if (this._debouncer) {
      clearTimeout(this._debouncer);
    }
    this._debouncer = setTimeout(() => {
      var item = null;
      var flag_src = "";
      var flag_type = null;
      if (code) {
        code = code.toUpperCase();
        if (code.length == 2) {
          item = _countries.byCode2[code];
        } else if (code.length == 3) {
          item = _countries.byCode3[code];
        } else {
          console.warn(
            "FLAG-CC> code length should be either 2 or 3 (code:",
            code,
            ")"
          );
        }
        if (item) {
          flag_src = "countries/" + item.flag;
        } else {
          console.warn("The item was not found for code", code);
        }
        flag_type = "country";
      } else if (currency) {
        currency = currency.toUpperCase();
        item = _countries.currencies[currency];
        if (item) {
          flag_src = "currencies/" + item.flag;
        } else {
          console.warn("The item was not found for currency", currency);
        }
        flag_src = flag_src;
        flag_type = "currency";
      }
      if (item) {
        this._flag_src = flag_src;
        this._flag_title = code != undefined ? item.name : item.currency;
        this.isUnknown = false;
        this.$.unknown_display.innerText = "";
      } else {
        this._flag_src = "";
        this._flag_title = code != undefined ? code : currency;
        this.isUnknown = true;
        this.$.unknown_display.innerText = this._flag_title;
      }
      this.countries = item;
      this.flagType = flag_type;
    }, 1);
  }
}

window.customElements.define(FlagCc.is, FlagCc);
