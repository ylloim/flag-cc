import { LitElement, html } from "lit-element";
import "@polymer/iron-image/iron-image.js";

import CountriesDataProvider from "./countries-data-provider.js";

/**
<flag-cc> is a simple component that display the flag of the corresponding currency or country code.

Use the `currency` attribute to display the currency flag and use `code` to display the country flag.

# Example

```
<flag-cc currency="CHF"></flag-cc>
<flag-cc currency="CNY"></flag-cc>
<flag-cc currency="CNH"></flag-cc>
<flag-cc currency="ABC"></flag-cc>
<flag-cc code="Unknown"></flag-cc>
<flag-cc code="FR"></flag-cc>
```

@customElement
@polymer
@demo demo/index.html
 */
class FlagCC extends LitElement {
  render() {
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
          left: 0;
          font-size: 9px;
        }
      </style>

      <!-- The flag to display -->
      <iron-image
        sizing="cover"
        title="${this._flag_title}"
        src="${this.imagesPath}${this._flag_src}"
      ></iron-image>

      <span id="unknown_display"></span>

      <div id="overlay" ?hidden="${this.isUnknown}"></div>
    `;
  }

  static get properties() {
    return {
      /** The country code (eg: CH, FR, ...) */
      code: String,

      /** The currency code (eg: EUR, CNY, CHF, ...) */
      currency: String,

      /** The type of the flag ('country' or 'currency') */
      // TODO: reflect to attribute
      flagType: { type: String, attribute: "flag-type", reflect: true },

      /** Is true if the country or currency code is unknown */
      isUnknown: Boolean,

      /** The corresponding country either for the country or currency code */
      // TODO: generate an event to propagate the information
      country: Object,

      /** Configures where the images folder is located */
      imagesPath: String,

      /** PRIVATES */
      _countries: Object,
      _flag_src: String,
      _flag_title: String,
      _debouncer: Number
    };
  }

  constructor() {
    super();

    // Set the path of the images
    this.imagesPath = "/node_modules/flag-cc/flags/";
  }

  firstUpdated(changedProps) {
    this._DOM_UnknownDisplay = this.shadowRoot.querySelector(
      "#unknown_display"
    );
    console.log(this._DOM_UnknownDisplay);
  }

  updated(props) {
    if (props.has("code") || props.has("currency")) {
      this._updateFlag(this.code, this.currency);
    }
  }

  _updateFlag(code, currency) {
    // Get the static list of countries
    let _countries = CountriesDataProvider.data;

    // Stops the updates when the list of countries and if one of the code or
    // currency is not defined
    if (!_countries || (!code && !currency)) {
      return;
    }

    // Create a debouncer
    if (this._debouncer) {
      clearTimeout(this._debouncer);
    }
    this._debouncer = setTimeout(() => {
      var item = null; // ?
      var flag_src = ""; // The relative flag image source path
      var flag_type = null; // The flag type (currency or country)
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
        this._DOM_UnknownDisplay.innerText = "";
      } else {
        this._flag_src = "";
        this._flag_title = code != undefined ? code : currency;
        this.isUnknown = true;
        this._DOM_UnknownDisplay.innerText = this._flag_title;
      }
      this.countries = item;
      this.flagType = flag_type;
    }, 1);
  }
}

customElements.define("flag-cc", FlagCC);
